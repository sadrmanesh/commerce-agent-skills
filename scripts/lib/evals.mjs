import { readFile } from "node:fs/promises";
import path from "node:path";

const TASK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function checkAnswer(answer, expects) {
  const errors = [];
  const text = String(answer);
  for (const needle of expects?.must_include ?? []) {
    if (!text.includes(needle)) {
      errors.push(`missing required text: ${needle}`);
    }
  }
  for (const needle of expects?.must_not_include ?? []) {
    if (needle !== "" && text.includes(needle)) {
      errors.push(`contains forbidden text: ${needle}`);
    }
  }
  return errors;
}

export async function validateSkillEvals(skill) {
  const errors = [];
  const tasksPath = path.join(skill.dir, "evals", "tasks.json");
  let document;
  try {
    document = JSON.parse(await readFile(tasksPath, "utf8"));
  } catch (error) {
    return [`${skill.name}: evals/tasks.json is missing or is not JSON (${error.message})`];
  }
  if (!document || !Array.isArray(document.tasks) || document.tasks.length < 2) {
    return [`${skill.name}: evals/tasks.json needs at least two tasks`];
  }

  const ids = new Set();
  let negativeChecks = 0;
  for (const [index, task] of document.tasks.entries()) {
    const label = `${skill.name} evals task ${index}`;
    if (!task || typeof task !== "object") {
      errors.push(`${label} must be an object`);
      continue;
    }
    if (typeof task.id !== "string" || !TASK_ID.test(task.id)) {
      errors.push(`${label} id must be lowercase words separated by single hyphens`);
    } else if (ids.has(task.id)) {
      errors.push(`${label} duplicates id ${task.id}`);
    } else {
      ids.add(task.id);
    }
    if (typeof task.task !== "string" || task.task.trim().length < 40) {
      errors.push(`${label} task text must be at least 40 characters`);
    }
    const expects = task.expects;
    if (!expects || !Array.isArray(expects.must_include) || expects.must_include.length === 0) {
      errors.push(`${label} expects.must_include must list at least one string`);
    } else if (expects.must_include.some((item) => typeof item !== "string" || item.length < 2)) {
      errors.push(`${label} must_include entries must be strings of at least 2 characters`);
    }
    if (expects?.must_not_include !== undefined) {
      if (!Array.isArray(expects.must_not_include) || expects.must_not_include.some((item) => typeof item !== "string" || item.length < 2)) {
        errors.push(`${label} must_not_include must be an array of strings`);
      } else if (expects.must_not_include.length > 0) {
        negativeChecks += 1;
      }
    }
    if (typeof task.id !== "string") {
      continue;
    }
    const examplePath = path.join(skill.dir, "evals", "examples", `${task.id}.md`);
    let example;
    try {
      example = await readFile(examplePath, "utf8");
    } catch {
      errors.push(`${skill.name}: missing evals/examples/${task.id}.md`);
      continue;
    }
    if (example.trim().length < 80) {
      errors.push(`${skill.name}: evals/examples/${task.id}.md is too short to be a worked example`);
    }
    if (expects) {
      for (const problem of checkAnswer(example, expects)) {
        errors.push(`${skill.name} example ${task.id}: ${problem}`);
      }
    }
  }
  if (negativeChecks === 0) {
    errors.push(`${skill.name}: at least one eval task must set must_not_include`);
  }
  return errors;
}
