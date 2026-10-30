import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { catalogMatchesReadme } from "../scripts/generate-catalog.mjs";
import { validateRepository } from "../scripts/validate-skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the repository skills and rules pass validation", async () => {
  const errors = await validateRepository(root);
  assert.deepEqual(errors, []);
});

test("the README catalog matches the skill descriptions", async () => {
  const result = await catalogMatchesReadme(root);
  assert.equal(result.matches, true);
});
