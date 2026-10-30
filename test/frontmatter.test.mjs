import assert from "node:assert/strict";
import test from "node:test";
import { assertSpecFrontmatter, parseFrontmatter, splitFrontmatter } from "../scripts/lib/frontmatter.mjs";

test("parses quoted description and metadata strings", () => {
  const { yaml, body } = splitFrontmatter(`---
name: order-sync
description: "Sync orders. Use when a store sends webhooks."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.1.0"
---

# Order sync

Do the work.
`);
  const data = parseFrontmatter(yaml);
  assert.equal(data.name, "order-sync");
  assert.equal(data.description, "Sync orders. Use when a store sends webhooks.");
  assert.equal(data.metadata.version, "0.1.0");
  assert.equal(data.metadata.author, "Naser Sadrmanesh");
  assert.match(body.trim(), /^# Order sync/);
  assert.deepEqual(assertSpecFrontmatter(data), []);
});

test("rejects unquoted version numbers in metadata", () => {
  assert.throws(
    () => parseFrontmatter('name: order-sync\nmetadata:\n  version: 0.1.0\n'),
    /quoted string/,
  );
});

test("rejects names that will not match the specification", () => {
  const errors = assertSpecFrontmatter({
    name: "Order--Sync",
    description: "Use when testing.",
  });
  assert.ok(errors.some((error) => error.startsWith("name must")));
});
