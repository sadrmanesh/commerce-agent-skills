#!/usr/bin/env node
// Score answers against each skill's eval fixtures.
//
//   node scripts/run-evals.mjs                         score the worked examples
//   node scripts/run-evals.mjs --answers out           score out/<skill>/<task-id>.md
//   node scripts/run-evals.mjs --answers out --skill stripe-payments --min-score 0.8 --json
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSkillTasks, scoreAnswer } from "./lib/evals.mjs";
import { loadRepository } from "./lib/skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseArgs(argv) {
  const options = { answers: null, skills: [], json: false, minScore: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new Error(`${arg} needs a value`);
      }
      index += 1;
      return next;
    };
    if (arg === "--answers") options.answers = value();
    else if (arg === "--skill") options.skills.push(value());
    else if (arg === "--json") options.json = true;
    else if (arg === "--min-score") {
      const raw = value();
      const score = Number(raw);
      if (!Number.isFinite(score) || score < 0 || score > 1) {
        throw new Error(`--min-score must be a number from 0 to 1, got ${raw}`);
      }
      options.minScore = score;
    } else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`unknown option ${arg}`);
  }
  return options;
}

/**
 * Scores every task of the chosen skills. With `answersDir`, reads
 * `<answersDir>/<skill>/<task-id>.md`; without it, scores each skill's worked
 * examples. A task passes only when every check passes.
 */
export async function runEvals({ repoRoot = root, answersDir = null, skills = [] } = {}) {
  const repo = await loadRepository(repoRoot);
  const known = new Set(repo.skills.map((skill) => skill.name));
  for (const name of skills) {
    if (!known.has(name)) {
      throw new Error(`unknown skill ${name}`);
    }
  }
  const chosen = repo.skills.filter((skill) => skills.length === 0 || skills.includes(skill.name));
  const results = [];
  for (const skill of chosen) {
    const tasks = await loadSkillTasks(skill.dir);
    const taskResults = [];
    for (const task of tasks) {
      const file = answersDir
        ? path.resolve(answersDir, skill.name, `${task.id}.md`)
        : path.join(skill.dir, "evals", "examples", `${task.id}.md`);
      let answer = null;
      try {
        answer = await readFile(file, "utf8");
      } catch {
        answer = null;
      }
      if (answer === null) {
        const total = (task.expects?.must_include?.length ?? 0) + (task.expects?.must_not_include?.length ?? 0);
        taskResults.push({ id: task.id, passed: 0, total, score: 0, pass: false, failures: ["missing answer file"] });
        continue;
      }
      const scored = scoreAnswer(answer, task.expects);
      taskResults.push({ id: task.id, ...scored, pass: scored.failures.length === 0 });
    }
    const passed = taskResults.reduce((sum, task) => sum + task.passed, 0);
    const total = taskResults.reduce((sum, task) => sum + task.total, 0);
    results.push({
      skill: skill.name,
      tasks: taskResults,
      passed,
      total,
      score: total === 0 ? 1 : passed / total,
      tasksPassed: taskResults.filter((task) => task.pass).length,
    });
  }
  const passed = results.reduce((sum, skill) => sum + skill.passed, 0);
  const total = results.reduce((sum, skill) => sum + skill.total, 0);
  const taskCount = results.reduce((sum, skill) => sum + skill.tasks.length, 0);
  const tasksPassed = results.reduce((sum, skill) => sum + skill.tasksPassed, 0);
  return {
    mode: answersDir ? "answers" : "examples",
    skills: results,
    passed,
    total,
    score: total === 0 ? 1 : passed / total,
    tasks: taskCount,
    tasksPassed,
  };
}

export function formatReport(report) {
  const lines = [];
  for (const skill of report.skills) {
    lines.push(`${percent(skill.score).padStart(5)}  ${skill.skill} (${skill.tasksPassed}/${skill.tasks.length} tasks)`);
    for (const task of skill.tasks) {
      if (!task.pass) {
        lines.push(`         ${task.id}: ${task.failures.join("; ")}`);
      }
    }
  }
  lines.push("");
  lines.push(`Overall ${percent(report.score)}: ${report.passed}/${report.total} checks, ${report.tasksPassed}/${report.tasks} tasks passed (${report.mode}).`);
  return lines.join("\n");
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

const USAGE = `Usage: node scripts/run-evals.mjs [--answers <dir>] [--skill <name>]... [--min-score <0-1>] [--json]

Without --answers, scores each skill's worked examples and requires every check to pass.
With --answers, reads <dir>/<skill>/<task-id>.md; --min-score defaults to 0.`;

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(USAGE);
    process.exit(2);
  }
  if (options.help) {
    console.log(USAGE);
    process.exit(0);
  }
  let report;
  try {
    report = await runEvals({ answersDir: options.answers, skills: options.skills });
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  const minScore = options.minScore ?? (options.answers ? 0 : 1);
  console.log(options.json ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.score >= minScore ? 0 : 1);
}
