#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, splitFrontmatter } from "../scripts/lib/frontmatter.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function packageSkillsDir(root = packageRoot) {
  return path.join(root, "skills");
}

export function packageRulesDir(root = packageRoot) {
  return path.join(root, "rules");
}

export async function listSkillRecords(root = packageRoot) {
  const skillsDir = packageSkillsDir(root);
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const records = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const skillPath = path.join(skillsDir, entry.name, "SKILL.md");
    const text = await readFile(skillPath, "utf8");
    const { yaml } = splitFrontmatter(text);
    const data = parseFrontmatter(yaml);
    records.push({
      name: entry.name,
      description: typeof data.description === "string" ? data.description : "",
    });
  }
  records.sort((a, b) => a.name.localeCompare(b.name));
  return records;
}

export async function addSkill({
  name,
  dir,
  force = false,
  withRule = false,
  root = packageRoot,
}) {
  if (typeof name !== "string" || name === "" || name.includes("/") || name.includes("\\")) {
    throw new Error("Skill name is required.");
  }
  if (typeof dir !== "string" || dir.trim() === "") {
    throw new Error("--dir is required.");
  }
  const source = path.join(packageSkillsDir(root), name);
  try {
    const sourceStat = await stat(source);
    if (!sourceStat.isDirectory()) {
      throw new Error(`Unknown skill: ${name}`);
    }
  } catch (error) {
    if (error.message.startsWith("Unknown skill")) {
      throw error;
    }
    throw new Error(`Unknown skill: ${name}`);
  }

  const destinationRoot = path.resolve(dir);
  const destination = path.join(destinationRoot, name);
  const existing = await stat(destination).then(
    (info) => info.isDirectory(),
    () => false,
  );
  if (existing && !force) {
    throw new Error(`${destination} already exists. Pass --force to replace it.`);
  }
  await mkdir(destinationRoot, { recursive: true });
  if (existing) {
    await rm(destination, { recursive: true, force: true });
  }
  await cp(source, destination, { recursive: true });

  let rulePath;
  if (withRule) {
    const ruleSource = path.join(packageRulesDir(root), `${name}.md`);
    await stat(ruleSource);
    const rulesDir = path.join(path.dirname(destinationRoot), "rules");
    rulePath = path.join(rulesDir, `${name}.md`);
    await mkdir(rulesDir, { recursive: true });
    await cp(ruleSource, rulePath, { force: true });
  }
  return { destination, rulePath };
}

function readFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function printUsage() {
  console.error(`Usage:
  commerce-agent-skills list
  commerce-agent-skills add <skill> --dir <path> [--force] [--with-rule]`);
}

export async function main(argv, root = packageRoot) {
  const [command, ...rest] = argv;
  if (command === "list") {
    if (rest.length > 0) {
      printUsage();
      return 2;
    }
    const records = await listSkillRecords(root);
    for (const record of records) {
      console.log(`${record.name}\t${record.description}`);
    }
    return 0;
  }
  if (command === "add") {
    const name = rest.find((arg) => !arg.startsWith("--"));
    const dir = readFlag(rest, "--dir");
    const force = rest.includes("--force");
    const withRule = rest.includes("--with-rule");
    if (!name || !dir || rest.includes("--help")) {
      printUsage();
      return 2;
    }
    try {
      const result = await addSkill({ name, dir, force, withRule, root });
      console.log(`Added ${name} to ${result.destination}`);
      if (result.rulePath) {
        console.log(`Added rule to ${result.rulePath}`);
      }
      return 0;
    } catch (error) {
      console.error(error.message);
      return 1;
    }
  }
  printUsage();
  return 2;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  process.exitCode = await main(process.argv.slice(2));
}
