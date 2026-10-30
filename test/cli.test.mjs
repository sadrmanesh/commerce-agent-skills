import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { addSkill, listSkillRecords, main } from "../bin/commerce-agent-skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = path.join(root, "bin", "commerce-agent-skills.mjs");

test("list includes every skill description", async () => {
  const records = await listSkillRecords(root);
  assert.ok(records.length >= 20);
  assert.ok(records.some((record) => record.name === "shopify-app-development" && record.description.includes("Use when")));
});

test("add copies a skill and can replace it", async () => {
  const parent = await mkdtemp(path.join(tmpdir(), "commerce-skills-"));
  const dir = path.join(parent, "agent-skills");
  try {
    const first = await addSkill({ name: "tax-and-shipping", dir, root });
    const skill = await readFile(path.join(first.destination, "SKILL.md"), "utf8");
    assert.match(skill, /^---\n/);
    await assert.rejects(() => addSkill({ name: "tax-and-shipping", dir, root }), /already exists/);
    const replaced = await addSkill({ name: "tax-and-shipping", dir, force: true, withRule: true, root });
    const rule = await readFile(replaced.rulePath, "utf8");
    assert.match(rule, /^# Tax and shipping/);
    assert.equal(path.basename(path.dirname(replaced.rulePath)), "rules");
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("the bin exits with the documented status codes", () => {
  const missing = spawnSync(process.execPath, [bin, "add", "not-a-skill", "--dir", "somewhere"], { encoding: "utf8" });
  assert.equal(missing.status, 1);
  const usage = spawnSync(process.execPath, [bin, "add", "tax-and-shipping"], { encoding: "utf8" });
  assert.equal(usage.status, 2);
  const list = spawnSync(process.execPath, [bin, "list"], { encoding: "utf8" });
  assert.equal(list.status, 0);
  assert.match(list.stdout, /woocommerce-plugin-development\t/);
});

test("main rejects an unknown command", async () => {
  assert.equal(await main(["nope"], root), 2);
});
