import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildSite } from "../scripts/build-docs.mjs";
import { checkAnswer } from "../scripts/lib/evals.mjs";
import { checkFeedItem } from "../skills/google-merchant-product-feeds/scripts/check-feed-item.mjs";
import { checkProductDescription } from "../skills/product-description-guardrails/scripts/check-description.mjs";
import { checkCommerceEvent } from "../skills/conversion-event-tracking/scripts/check-event.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the sample Merchant Center item passes and a comma price fails", async () => {
  const example = JSON.parse(await readFile(path.join(root, "skills/google-merchant-product-feeds/assets/example-item.json"), "utf8"));
  assert.deepEqual(checkFeedItem(example), []);
  const bad = { ...example, price: "15,00 USD", availability: "preorder" };
  const errors = checkFeedItem(bad);
  assert.ok(errors.some((error) => error.includes("price")));
  assert.ok(errors.some((error) => error.includes("availability_date")));
});

test("description checks reject a mismatched price and an unsupported cure claim", () => {
  const source = { price: "19.00", currency: "USD", allowedClaims: [] };
  assert.deepEqual(checkProductDescription("Short-sleeve cotton shirt for 19.00 USD.", source), []);
  const errors = checkProductDescription("This shirt cures wrinkles and costs 15.00 USD.", source);
  assert.ok(errors.some((error) => error.includes("cure")));
  assert.ok(errors.some((error) => error.includes("15.00")));
});

test("purchase events need a transaction id and an item-only value", () => {
  const good = checkCommerceEvent({
    name: "purchase",
    params: {
      transaction_id: "1042",
      currency: "USD",
      value: 19,
      tax: 1,
      shipping: 2,
      items: [{ item_id: "SHIRT-BLUE", item_name: "Cotton shirt", price: 19, quantity: 1 }],
    },
  });
  assert.deepEqual(good, []);
  const bad = checkCommerceEvent({
    name: "purchase",
    params: {
      transaction_id: "",
      currency: "USD",
      value: 22,
      items: [{ item_id: "SHIRT-BLUE", price: 19, quantity: 1 }],
    },
  });
  assert.ok(bad.some((error) => error.includes("transaction_id")));
  assert.ok(bad.some((error) => error.includes("value")));
});

test("substring checks accept the worked example and reject a forbidden API", () => {
  const expects = { must_include: ["wc_get_order"], must_not_include: ["update_post_meta"] };
  assert.deepEqual(checkAnswer("Use wc_get_order and save the order.", expects), []);
  assert.ok(checkAnswer("Call update_post_meta on the order.", expects).length > 0);
});

test("the docs site source is generated from the skills", async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), "commerce-docs-"));
  const out = path.join(tmp, "site-src");
  try {
    const result = await buildSite(root, out);
    assert.equal(result.skills, 20);
    assert.equal(result.categories, 4);
    const index = await readFile(path.join(out, "index.md"), "utf8");
    const shopify = await readFile(path.join(out, "skills", "platforms", "shopify-app-development.md"), "utf8");
    const config = await readFile(path.join(tmp, "mkdocs.yml"), "utf8");
    assert.match(index, /Naser Sadrmanesh/);
    assert.match(index, /20 skills in 4 categories/);
    assert.doesNotMatch(index, /<!-- categories -->/);
    assert.match(shopify, /X-Shopify-Hmac-Sha256/);
    assert.match(shopify, /\{ #reference-auth-and-webhooks-md \}/);
    assert.match(shopify, /\(#reference-auth-and-webhooks-md\)/);
    assert.match(config, /^INHERIT: /m);
    assert.match(config, /^docs_dir: site-src$/m);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
