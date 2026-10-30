#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateSkillEvals } from "./lib/evals.mjs";
import {
  RULE_LINE_MAX,
  RULE_LINE_MIN,
  linkedSkillPaths,
  listFiles,
  loadRepository,
  ruleLineCount,
  validateSkillRecord,
} from "./lib/skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function validateRepository(repoRoot = root) {
  const errors = [];
  let repo;
  try {
    repo = await loadRepository(repoRoot);
  } catch (error) {
    return [`Failed to load skills: ${error.message}`];
  }

  const names = repo.skills.map((skill) => skill.name);
  const orderSet = new Set(repo.order);
  if (repo.order.length !== orderSet.size) {
    errors.push("skills/catalog-order.txt lists a skill more than once");
  }
  for (const name of repo.order) {
    if (!names.includes(name)) {
      errors.push(`skills/catalog-order.txt lists missing skill ${name}`);
    }
  }
  for (const name of names) {
    if (!orderSet.has(name)) {
      errors.push(`${name} is missing from skills/catalog-order.txt`);
    }
  }

  for (const skill of repo.skills) {
    errors.push(...validateSkillRecord(skill));
    errors.push(...(await validateSkillFiles(skill)));
    errors.push(...(await validateRule(repo.rulesDir, skill.name)));
    errors.push(...(await validateSkillEvals(skill)));
  }

  const ruleEntries = await listFiles(repo.rulesDir);
  for (const file of ruleEntries) {
    if (!file.endsWith(".md")) {
      errors.push(`rules/${file} is not a Markdown rule file`);
      continue;
    }
    const ruleName = file.slice(0, -3);
    if (ruleName.includes("/") || ruleName.includes("\\")) {
      errors.push(`rules/${file} must be a single file in rules/`);
      continue;
    }
    if (!names.includes(ruleName)) {
      errors.push(`rules/${file} does not match a skill directory`);
    }
  }

  return errors;
}

async function validateSkillFiles(skill) {
  const errors = [];
  const bundled = await listFiles(skill.dir);
  const extraRoots = new Set(["references", "scripts", "assets"]);
  const bundledRel = bundled.filter((file) => extraRoots.has(file.split(/[/\\]/)[0]));
  const mentioned = linkedSkillPaths(skill.body);

  const hasScripts = bundledRel.some((file) => file.startsWith("scripts/"));
  if (hasScripts && typeof skill.data.compatibility !== "string") {
    errors.push(`${skill.name}: skills with scripts/ must set compatibility`);
  }

  for (const relative of mentioned) {
    if (relative.startsWith("/")) {
      errors.push(`${skill.name}: use a relative link, not ${relative}`);
      continue;
    }
    const target = path.resolve(skill.dir, relative);
    if (!target.startsWith(skill.dir + path.sep) && target !== skill.dir) {
      errors.push(`${skill.name}: link escapes the skill directory: ${relative}`);
      continue;
    }
    try {
      await access(target);
    } catch {
      errors.push(`${skill.name}: missing linked file ${relative}`);
    }
  }

  for (const file of bundledRel) {
    const portable = file.split(path.sep).join("/");
    const inBody = skill.body.includes(portable);
    if (!inBody) {
      errors.push(`${skill.name}: ${portable} is not referenced from SKILL.md`);
    }
    if (portable.endsWith(".mjs")) {
      const checked = spawnSync(process.execPath, ["--check", path.join(skill.dir, file)], {
        encoding: "utf8",
      });
      if (checked.status !== 0) {
        errors.push(`${skill.name}: ${portable} failed node --check\n${checked.stderr}`);
      }
    }
  }

  return errors;
}

async function validateRule(rulesDir, name) {
  const errors = [];
  const rulePath = path.join(rulesDir, `${name}.md`);
  let text;
  try {
    text = await readFile(rulePath, "utf8");
  } catch {
    return [`${name}: missing rules/${name}.md`];
  }
  const normalized = text.replace(/\r\n/g, "\n");
  if (normalized.startsWith("---\n")) {
    errors.push(`${name}: rules/${name}.md must be plain Markdown without frontmatter`);
  }
  if (!normalized.startsWith("# ")) {
    errors.push(`${name}: rules/${name}.md must start with a level-1 heading`);
  }
  const lines = ruleLineCount(normalized);
  if (lines < RULE_LINE_MIN || lines > RULE_LINE_MAX) {
    errors.push(`${name}: rules/${name}.md has ${lines} lines; keep rules between ${RULE_LINE_MIN} and ${RULE_LINE_MAX}`);
  }
  return errors;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const errors = await validateRepository(root);
  if (errors.length > 0) {
    console.error(`Skill validation failed with ${errors.length} problem(s):`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }
  console.log("Skill validation passed.");
}
