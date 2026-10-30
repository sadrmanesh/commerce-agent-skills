#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, splitFrontmatter } from "../scripts/lib/frontmatter.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Where skills and rules land inside a project.
 * `agents` keeps both under a hidden .agents directory, which many agents scan.
 * `root` writes skills/ and rules/ at the top of the project.
 */
export const LAYOUTS = Object.freeze({
  agents: Object.freeze({ skills: ".agents/skills", rules: ".agents/rules" }),
  root: Object.freeze({ skills: "skills", rules: "rules" }),
});

export const DEFAULT_LAYOUT = "agents";

export function packageSkillsDir(root = packageRoot) {
  return path.join(root, "skills");
}

export function packageRulesDir(root = packageRoot) {
  return path.join(root, "rules");
}

export async function packageVersion(root = packageRoot) {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  return pkg.version;
}

async function isDirectory(target) {
  return stat(target).then(
    (info) => info.isDirectory(),
    () => false,
  );
}

async function isFile(target) {
  return stat(target).then(
    (info) => info.isFile(),
    () => false,
  );
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
    if (!(await isFile(skillPath))) {
      continue;
    }
    const text = await readFile(skillPath, "utf8");
    const { yaml } = splitFrontmatter(text);
    const data = parseFrontmatter(yaml);
    records.push({
      name: entry.name,
      description: typeof data.description === "string" ? data.description : "",
      hasRule: await isFile(path.join(packageRulesDir(root), `${entry.name}.md`)),
    });
  }
  records.sort((a, b) => a.name.localeCompare(b.name));
  return records;
}

/**
 * Resolve the skills and rules directories for an install.
 * `dir` is the older single-directory form: skills go to `dir`, rules to a
 * `rules` directory next to it.
 */
export function resolveTargets({ target = ".", layout, skillsDir, rulesDir, dir } = {}) {
  const base = path.resolve(target);
  if (dir !== undefined) {
    if (typeof dir !== "string" || dir.trim() === "") {
      throw new Error("--dir needs a path.");
    }
    const skills = path.resolve(base, dir);
    return {
      skills,
      rules: rulesDir ? path.resolve(base, rulesDir) : path.join(path.dirname(skills), "rules"),
    };
  }
  const layoutName = layout ?? DEFAULT_LAYOUT;
  const preset = LAYOUTS[layoutName];
  if (!preset) {
    throw new Error(`Unknown layout: ${layoutName}. Use one of: ${Object.keys(LAYOUTS).join(", ")}.`);
  }
  return {
    skills: path.resolve(base, skillsDir ?? preset.skills),
    rules: path.resolve(base, rulesDir ?? preset.rules),
  };
}

function checkSkillName(name, known) {
  if (typeof name !== "string" || name === "" || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(`Invalid skill name: ${name || "(empty)"}`);
  }
  if (!known.has(name)) {
    throw new Error(`Unknown skill: ${name}. Run "commerce-agent-skills list" to see the names.`);
  }
}

/**
 * Copy skills (and their rules) into a project.
 * Returns one entry per skill: { name, status, destination, rulePath }.
 * status is "added", "replaced", "skipped" (exists, onExisting = "skip"),
 * or "planned" when dryRun is set.
 */
export async function installSkills({
  names,
  target = ".",
  layout,
  skillsDir,
  rulesDir,
  dir,
  rules = true,
  force = false,
  onExisting = "error",
  dryRun = false,
  root = packageRoot,
}) {
  const records = await listSkillRecords(root);
  const known = new Map(records.map((record) => [record.name, record]));
  const wanted = names === undefined ? records.map((record) => record.name) : [...new Set(names)];
  if (wanted.length === 0) {
    throw new Error("No skills selected.");
  }
  for (const name of wanted) {
    checkSkillName(name, known);
  }
  const targets = resolveTargets({ target, layout, skillsDir, rulesDir, dir });

  const plan = [];
  for (const name of wanted) {
    const destination = path.join(targets.skills, name);
    const exists = await isDirectory(destination);
    if (exists && !force && onExisting === "error") {
      throw new Error(`${destination} already exists. Pass --force to replace it.`);
    }
    const rulePath = rules && known.get(name).hasRule ? path.join(targets.rules, `${name}.md`) : undefined;
    plan.push({ name, exists, destination, rulePath });
  }

  const results = [];
  for (const item of plan) {
    if (item.exists && !force) {
      results.push({ name: item.name, status: "skipped", destination: item.destination });
      continue;
    }
    if (dryRun) {
      results.push({ name: item.name, status: "planned", destination: item.destination, rulePath: item.rulePath });
      continue;
    }
    await mkdir(path.dirname(item.destination), { recursive: true });
    if (item.exists) {
      await rm(item.destination, { recursive: true, force: true });
    }
    await cp(path.join(packageSkillsDir(root), item.name), item.destination, { recursive: true });
    if (item.rulePath) {
      await mkdir(path.dirname(item.rulePath), { recursive: true });
      await cp(path.join(packageRulesDir(root), `${item.name}.md`), item.rulePath, { force: true });
    }
    results.push({
      name: item.name,
      status: item.exists ? "replaced" : "added",
      destination: item.destination,
      rulePath: item.rulePath,
    });
  }
  return { targets, results };
}

/** Copy one skill. Kept for scripts written against 0.2.0. */
export async function addSkill({ name, dir, force = false, withRule = false, root = packageRoot }) {
  if (typeof dir !== "string" || dir.trim() === "") {
    throw new Error("--dir is required.");
  }
  const { results } = await installSkills({ names: [name], dir, force, rules: withRule, root });
  return { destination: results[0].destination, rulePath: results[0].rulePath };
}

const USAGE = `Usage:
  commerce-agent-skills list [--json]
  commerce-agent-skills init [options]
  commerce-agent-skills add <skill> [<skill> ...] [options]

Commands:
  list      Print every skill with its description.
  init      Copy the whole library, or the skills named with --only.
  add       Copy the named skills.

Options:
  --target <dir>       Project directory to install into. Default: current directory.
  --layout <name>      agents (.agents/skills and .agents/rules, default)
                       or root (skills/ and rules/).
  --skills-dir <path>  Skills directory, relative to --target. Overrides the layout.
  --rules-dir <path>   Rules directory, relative to --target. Overrides the layout.
  --dir <path>         Skills directory for add, with rules in a sibling rules/ directory.
  --only <a,b>         init: install only these skills.
  --no-rules           Do not copy the matching rules.
  --force              Replace skills that are already installed.
  --dry-run            Print what would be copied and write nothing.
  -h, --help           Show this help.
  -v, --version        Print the version.`;

const VALUE_FLAGS = new Set(["--target", "--layout", "--skills-dir", "--rules-dir", "--dir", "--only"]);
const BOOLEAN_FLAGS = new Set(["--no-rules", "--force", "--dry-run", "--with-rule", "--json", "--help", "-h"]);

export function parseArgs(args) {
  const options = {};
  const positionals = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith("-")) {
      const [flag, inline] = arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, undefined];
      if (VALUE_FLAGS.has(flag)) {
        const value = inline ?? args[index + 1];
        if (inline === undefined) {
          index += 1;
        }
        if (value === undefined || (inline === undefined && value.startsWith("--"))) {
          throw new Error(`${flag} needs a value.`);
        }
        options[flag.slice(2)] = value;
      } else if (BOOLEAN_FLAGS.has(flag) && inline === undefined) {
        options[flag === "-h" ? "help" : flag.replace(/^--/, "")] = true;
      } else {
        throw new Error(`Unknown option: ${arg}`);
      }
    } else {
      positionals.push(arg);
    }
  }
  return { options, positionals };
}

function display(target) {
  const relative = path.relative(process.cwd(), target);
  return relative === "" ? "." : relative.startsWith("..") ? target : relative;
}

function report({ targets, results }, dryRun) {
  const verb = dryRun ? "Would add" : "Added";
  for (const result of results) {
    if (result.status === "skipped") {
      console.log(`Skipped ${result.name}: ${display(result.destination)} exists (use --force to replace)`);
      continue;
    }
    const label = result.status === "replaced" ? "Replaced" : verb;
    const rule = result.rulePath ? ` and ${display(result.rulePath)}` : "";
    console.log(`${label} ${result.name} at ${display(result.destination)}${rule}`);
  }
  const copied = results.filter((result) => result.status !== "skipped").length;
  console.log(
    `${dryRun ? "Planned" : "Done"}: ${copied} of ${results.length} skills. Skills: ${display(targets.skills)}, rules: ${display(targets.rules)}`,
  );
}

export async function main(argv, root = packageRoot) {
  const [command, ...rest] = argv;
  if (command === undefined || command === "help" || command === "--help" || command === "-h") {
    console.log(USAGE);
    return command === undefined ? 2 : 0;
  }
  if (command === "--version" || command === "-v") {
    console.log(await packageVersion(root));
    return 0;
  }

  let parsed;
  try {
    parsed = parseArgs(rest);
  } catch (error) {
    console.error(error.message);
    console.error(USAGE);
    return 2;
  }
  const { options, positionals } = parsed;
  if (options.help) {
    console.log(USAGE);
    return 0;
  }

  if (command === "list") {
    if (positionals.length > 0) {
      console.error(USAGE);
      return 2;
    }
    const records = await listSkillRecords(root);
    if (options.json) {
      console.log(JSON.stringify(records.map(({ name, description }) => ({ name, description })), null, 2));
    } else {
      for (const record of records) {
        console.log(`${record.name}\t${record.description}`);
      }
    }
    return 0;
  }

  if (command === "init" || command === "add") {
    if (command === "init" && positionals.length > 0) {
      console.error(`init takes no skill names. Use --only ${positionals.join(",")} or add.`);
      return 2;
    }
    if (command === "add" && positionals.length === 0) {
      console.error("add needs at least one skill name.");
      console.error(USAGE);
      return 2;
    }
    if (command === "add" && options.only) {
      console.error("--only is for init. Pass skill names to add.");
      return 2;
    }
    const names =
      command === "add"
        ? positionals
        : options.only
          ? options.only.split(",").map((name) => name.trim()).filter(Boolean)
          : undefined;
    try {
      const outcome = await installSkills({
        names,
        target: options.target ?? ".",
        layout: options.layout,
        skillsDir: options["skills-dir"],
        rulesDir: options["rules-dir"],
        dir: options.dir,
        rules: !options["no-rules"],
        force: Boolean(options.force),
        onExisting: command === "init" ? "skip" : "error",
        dryRun: Boolean(options["dry-run"]),
        root,
      });
      report(outcome, Boolean(options["dry-run"]));
      return 0;
    } catch (error) {
      console.error(error.message);
      return 1;
    }
  }

  console.error(`Unknown command: ${command}`);
  console.error(USAGE);
  return 2;
}

// npx and global installs start the command through a symlink, so compare real paths.
function realpathSafe(file) {
  try {
    return realpathSync(path.resolve(file));
  } catch {
    return path.resolve(file);
  }
}

const isCli = Boolean(process.argv[1]) && realpathSafe(fileURLToPath(import.meta.url)) === realpathSafe(process.argv[1]);

if (isCli) {
  process.exitCode = await main(process.argv.slice(2));
}
