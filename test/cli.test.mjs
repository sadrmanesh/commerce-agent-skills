import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, stat, symlink, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  addSkill,
  installSkills,
  LAYOUTS,
  listSkillRecords,
  main,
  parseArgs,
  resolveTargets,
} from "../bin/commerce-agent-skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = path.join(root, "bin", "commerce-agent-skills.mjs");
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));

async function withTemp(fn) {
  const dir = await mkdtemp(path.join(tmpdir(), "commerce-skills-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const exists = (target) => stat(target).then(() => true, () => false);

function run(args, options = {}) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8", ...options });
}

test("list includes every skill description", async () => {
  const records = await listSkillRecords(root);
  const dirs = (await readdir(path.join(root, "skills"), { withFileTypes: true })).filter((entry) => entry.isDirectory());
  assert.equal(records.length, dirs.length);
  assert.ok(records.some((record) => record.name === "shopify-app-development" && record.description.includes("Use when")));
  assert.ok(records.every((record) => record.hasRule));
});

test("list --json prints names and descriptions", () => {
  const result = run(["list", "--json"]);
  assert.equal(result.status, 0);
  const records = JSON.parse(result.stdout);
  assert.ok(records.some((record) => record.name === "stripe-payments" && record.description.length > 0));
});

test("layouts resolve inside the target", () => {
  const target = path.join(tmpdir(), "project");
  assert.deepEqual(resolveTargets({ target }), {
    skills: path.join(target, LAYOUTS.agents.skills),
    rules: path.join(target, LAYOUTS.agents.rules),
  });
  assert.deepEqual(resolveTargets({ target, layout: "root" }), {
    skills: path.join(target, "skills"),
    rules: path.join(target, "rules"),
  });
  assert.deepEqual(resolveTargets({ target, layout: "root", skillsDir: "x/skills", rulesDir: "x/rules" }), {
    skills: path.join(target, "x", "skills"),
    rules: path.join(target, "x", "rules"),
  });
  assert.deepEqual(resolveTargets({ target, dir: "agent-skills" }), {
    skills: path.join(target, "agent-skills"),
    rules: path.join(target, "rules"),
  });
  assert.throws(() => resolveTargets({ target, layout: "nope" }), /Unknown layout/);
});

test("parseArgs reads values, inline values, and booleans", () => {
  assert.deepEqual(parseArgs(["a", "--target", "t", "--layout=root", "--force", "b"]), {
    options: { target: "t", layout: "root", force: true },
    positionals: ["a", "b"],
  });
  assert.throws(() => parseArgs(["--target"]), /needs a value/);
  assert.throws(() => parseArgs(["--bogus"]), /Unknown option/);
});

test("init copies the whole library with rules", () =>
  withTemp(async (dir) => {
    const records = await listSkillRecords(root);
    const { results } = await installSkills({ target: dir, onExisting: "skip", root });
    assert.equal(results.length, records.length);
    assert.ok(results.every((result) => result.status === "added"));
    for (const record of records) {
      const skill = await readFile(path.join(dir, ".agents", "skills", record.name, "SKILL.md"), "utf8");
      assert.match(skill, new RegExp(`^---\\nname: ${record.name}\\n`));
      assert.ok(await exists(path.join(dir, ".agents", "rules", `${record.name}.md`)));
    }
    assert.ok(await exists(path.join(dir, ".agents", "skills", "stripe-payments", "evals", "tasks.json")));
  }));

test("init skips installed skills and replaces them with --force", () =>
  withTemp(async (dir) => {
    await installSkills({ names: ["tax-and-shipping"], target: dir, root });
    const marker = path.join(dir, ".agents", "skills", "tax-and-shipping", "local-note.md");
    await writeFile(marker, "kept\n");
    const second = await installSkills({ names: ["tax-and-shipping", "b2b-pricing"], target: dir, onExisting: "skip", root });
    assert.deepEqual(
      second.results.map((result) => [result.name, result.status]),
      [
        ["tax-and-shipping", "skipped"],
        ["b2b-pricing", "added"],
      ],
    );
    assert.ok(await exists(marker));
    const forced = await installSkills({ names: ["tax-and-shipping"], target: dir, force: true, root });
    assert.equal(forced.results[0].status, "replaced");
    assert.equal(await exists(marker), false);
  }));

test("add refuses to overwrite without --force", () =>
  withTemp(async (dir) => {
    await installSkills({ names: ["stripe-payments"], target: dir, root });
    await assert.rejects(() => installSkills({ names: ["stripe-payments"], target: dir, root }), /already exists/);
  }));

test("--no-rules and --dry-run write only what they should", () =>
  withTemp(async (dir) => {
    await installSkills({ names: ["returns-and-refunds"], target: dir, layout: "root", rules: false, root });
    assert.ok(await exists(path.join(dir, "skills", "returns-and-refunds", "SKILL.md")));
    assert.equal(await exists(path.join(dir, "rules")), false);
    const planned = await installSkills({ names: ["b2b-pricing"], target: dir, layout: "root", dryRun: true, root });
    assert.equal(planned.results[0].status, "planned");
    assert.equal(await exists(path.join(dir, "skills", "b2b-pricing")), false);
  }));

test("unknown and unsafe skill names are rejected", async () => {
  await assert.rejects(() => installSkills({ names: ["not-a-skill"], target: tmpdir(), dryRun: true, root }), /Unknown skill/);
  await assert.rejects(() => installSkills({ names: ["../rules"], target: tmpdir(), dryRun: true, root }), /Invalid skill name/);
});

test("addSkill keeps the 0.2.0 interface", () =>
  withTemp(async (dir) => {
    const skillsDir = path.join(dir, "agent-skills");
    const first = await addSkill({ name: "tax-and-shipping", dir: skillsDir, root });
    assert.equal(first.rulePath, undefined);
    await assert.rejects(() => addSkill({ name: "tax-and-shipping", dir: skillsDir, root }), /already exists/);
    const replaced = await addSkill({ name: "tax-and-shipping", dir: skillsDir, force: true, withRule: true, root });
    assert.match(await readFile(replaced.rulePath, "utf8"), /^# Tax and shipping/);
    assert.equal(path.dirname(replaced.rulePath), path.join(dir, "rules"));
  }));

test("the bin exits with the documented status codes", () =>
  withTemp(async (dir) => {
    assert.equal(run(["add", "not-a-skill", "--target", dir]).status, 1);
    assert.equal(run(["add"]).status, 2);
    assert.equal(run(["init", "stripe-payments"]).status, 2);
    assert.equal(run(["add", "x", "--only", "y"]).status, 2);
    assert.equal(run(["nope"]).status, 2);
    assert.equal(run([]).status, 2);
    assert.equal(run(["--help"]).status, 0);
    const version = run(["--version"]);
    assert.equal(version.status, 0);
    assert.equal(version.stdout.trim(), pkg.version);
    const list = run(["list"]);
    assert.equal(list.status, 0);
    assert.match(list.stdout, /woocommerce-plugin-development\t/);

    const init = run(["init", "--only", "stripe-payments,b2b-pricing"], { cwd: dir });
    assert.equal(init.status, 0, init.stderr);
    assert.match(init.stdout, /Done: 2 of 2 skills/);
    assert.ok(await exists(path.join(dir, ".agents", "skills", "b2b-pricing", "SKILL.md")));
    const again = run(["init", "--only", "stripe-payments"], { cwd: dir });
    assert.equal(again.status, 0);
    assert.match(again.stdout, /Skipped stripe-payments/);
  }));

test("the bin runs through a symlink, as npx and global installs start it", () =>
  withTemp(async (dir) => {
    const binDir = path.join(dir, "node_modules", ".bin");
    await mkdir(binDir, { recursive: true });
    const link = path.join(binDir, "commerce-agent-skills");
    await symlink(bin, link);
    const output = execFileSync(process.execPath, [link, "--version"], { encoding: "utf8" });
    assert.equal(output.trim(), pkg.version);
  }));

test("main rejects an unknown command", async () => {
  assert.equal(await main(["nope"], root), 2);
});

test("the npm package ships only the command, skills, and rules", () => {
  assert.equal(pkg.name, "@sadrmanesh/commerce-agent-skills");
  assert.equal(pkg.bin["commerce-agent-skills"], "./bin/commerce-agent-skills.mjs");
  assert.equal(pkg.publishConfig?.access, "public");
  assert.deepEqual([...pkg.files].sort(), ["CHANGELOG.md", "bin", "rules", "scripts/lib/frontmatter.mjs", "skills"]);
});
