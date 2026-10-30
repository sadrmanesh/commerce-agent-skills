import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { scoreAnswer, untaughtTerms } from "../scripts/lib/evals.mjs";
import { firstHeading, sectionTitles, validateSkillRecord } from "../scripts/lib/skills.mjs";
import { formatReport, parseArgs, runEvals } from "../scripts/run-evals.mjs";
import { validateCategories, validateRepository } from "../scripts/validate-skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts", "run-evals.mjs");
const packageVersion = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version;

async function copyRepo() {
  const dir = await mkdtemp(path.join(tmpdir(), "commerce-skills-v03-"));
  for (const item of ["package.json", "skills", "rules", "website", "docs", "README.md", "CHANGELOG.md"]) {
    await cp(path.join(root, item), path.join(dir, item), { recursive: true });
  }
  return dir;
}

function record(overrides = {}) {
  const body = `\n# Sample\n\n${"Text that teaches the sample skill. ".repeat(8)}\n\n## Gotchas\n\n- One.\n\n## Verification\n\n- Two.\n\n## Evaluation\n\nSee the tasks.\n`;
  return {
    name: "sample",
    body,
    text: body,
    lineCount: 20,
    data: {
      name: "sample",
      description: `Teach the sample skill with enough words to pass the description length check. Use when testing the validator rules in this repository.`,
      license: "MIT",
      metadata: { author: "Naser Sadrmanesh", version: packageVersion },
    },
    ...overrides,
  };
}

test("package version and skill versions agree", async () => {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  assert.deepEqual(validateSkillRecord(record(), pkg.version), []);
  assert.match(validateSkillRecord(record(), "9.9.9").join(), /must be "9.9.9" to match package.json/);
});

test("the stricter skill checks catch missing sections, long descriptions, and em dashes", () => {
  const noSections = record({ body: record().body.replace("## Evaluation", "## Notes") });
  assert.match(validateSkillRecord(noSections, packageVersion).join(), /needs a "## Evaluation" section/);
  const long = record();
  long.data = { ...long.data, description: `${"x".repeat(320)} Use when` };
  assert.match(validateSkillRecord(long, packageVersion).join(), /keep it between 100 and 320/);
  const dash = record({ text: "A \u2014 B" });
  assert.match(validateSkillRecord(dash, packageVersion).join(), /em dash/);
  assert.equal(firstHeading("intro\n# Title here\n## Sub"), "Title here");
  assert.deepEqual(sectionTitles("# A\n## B\ntext\n## C\n"), ["B", "C"]);
});

test("eval terms must be taught and answers are scored per check", () => {
  const tasks = [{ id: "one", expects: { must_include: ["Raw Body", "idempotency"] } }];
  assert.deepEqual(untaughtTerms(tasks, "verify the raw body first"), [{ task: "one", term: "idempotency" }]);
  assert.deepEqual(scoreAnswer("raw body only", { must_include: ["raw body", "ledger"], must_not_include: ["only"] }), {
    passed: 1,
    total: 3,
    score: 1 / 3,
    failures: ["missing required text: ledger", "contains forbidden text: only"],
  });
});

test("categories must list every skill exactly once", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "commerce-categories-"));
  try {
    await mkdir(path.join(dir, "website"));
    await writeFile(
      path.join(dir, "website", "categories.json"),
      JSON.stringify([{ id: "a", skills: ["one", "two"] }, { id: "b", skills: ["two", "ghost"] }]),
    );
    const errors = await validateCategories(dir, ["one", "two", "three"]);
    assert.deepEqual(errors, [
      "website/categories.json lists two in both a and b",
      "website/categories.json lists missing skill ghost",
      "three is missing from website/categories.json",
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the validator flags rule headings, untaught terms, orphan examples, and prose", async () => {
  const dir = await copyRepo();
  try {
    await writeFile(path.join(dir, "rules", "b2b-pricing.md"), (await readFile(path.join(dir, "rules", "b2b-pricing.md"), "utf8")).replace("# B2B pricing", "# Wholesale"));
    const tasksPath = path.join(dir, "skills", "returns-and-refunds", "evals", "tasks.json");
    const tasks = JSON.parse(await readFile(tasksPath, "utf8"));
    tasks.tasks[0].expects.must_include.push("zebra ledger");
    await writeFile(tasksPath, JSON.stringify(tasks));
    await writeFile(path.join(dir, "skills", "returns-and-refunds", "evals", "examples", "stray.md"), "x".repeat(100));
    await writeFile(path.join(dir, "website", "fa.md"), "\u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u0645\n");
    const errors = (await validateRepository(dir)).join("\n");
    assert.match(errors, /rules\/b2b-pricing.md heading "Wholesale" must match/);
    assert.match(errors, /expects "zebra ledger", which the skill, rule, and references never mention/);
    assert.match(errors, /evals\/examples\/stray.md does not match a task id/);
    assert.match(errors, /website\/fa.md contains a zero-width non-joiner/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the eval runner scores every worked example at 100 percent", async () => {
  const report = await runEvals({ repoRoot: root });
  assert.equal(report.mode, "examples");
  assert.ok(report.skills.length >= 29);
  assert.equal(report.score, 1);
  assert.equal(report.tasksPassed, report.tasks);
  assert.match(formatReport(report), /^Overall 100%/m);
});

test("the eval runner scores an answers folder and enforces --min-score", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "commerce-answers-"));
  try {
    await mkdir(path.join(dir, "b2b-pricing"));
    await writeFile(path.join(dir, "b2b-pricing", "tiered-wholesale.md"), "Use a price list keyed on the server.");
    const report = await runEvals({ repoRoot: root, answersDir: dir, skills: ["b2b-pricing"] });
    const [skill] = report.skills;
    const missing = skill.tasks.find((task) => task.id === "net-terms");
    assert.deepEqual(missing.failures, ["missing answer file"]);
    assert.ok(report.score > 0 && report.score < 1);
    await assert.rejects(() => runEvals({ repoRoot: root, skills: ["nope"] }), /unknown skill nope/);

    const low = spawnSync(process.execPath, [runner, "--answers", dir, "--skill", "b2b-pricing", "--min-score", "0.9"], { encoding: "utf8" });
    assert.equal(low.status, 1);
    const lenient = spawnSync(process.execPath, [runner, "--answers", dir, "--skill", "b2b-pricing", "--json"], { encoding: "utf8" });
    assert.equal(lenient.status, 0);
    assert.equal(JSON.parse(lenient.stdout).mode, "answers");
    const bad = spawnSync(process.execPath, [runner, "--min-score", "2"], { encoding: "utf8" });
    assert.equal(bad.status, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  assert.deepEqual(parseArgs(["--skill", "a", "--skill", "b", "--json"]), { answers: null, skills: ["a", "b"], json: true, minScore: null, help: false });
  assert.throws(() => parseArgs(["--answers"]), /needs a value/);
});
