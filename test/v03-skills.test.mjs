import assert from "node:assert/strict";
import test from "node:test";
import {
  parseStripeSignature,
  signStripePayload,
  verifyStripeSignature,
} from "../skills/stripe-payments/scripts/verify-stripe-signature.mjs";
import { checkVerify, convertIranianAmount } from "../skills/iranian-payment-gateways/scripts/check-verify.mjs";
import { allocateOrder, availableAt } from "../skills/inventory-and-multi-warehouse/scripts/allocate-stock.mjs";
import { resolvePrice } from "../skills/b2b-pricing/scripts/resolve-price.mjs";
import { checkImportRows } from "../skills/catalog-import-and-migration/scripts/check-import-rows.mjs";
import { checkWebVitals, rate } from "../skills/storefront-performance/scripts/check-web-vitals.mjs";
import { checkToolDefinitions } from "../skills/mcp-store-tooling/scripts/check-tool-definitions.mjs";

const SECRET = "whsec_test";
const BODY = '{"id":"evt_1","type":"payment_intent.succeeded"}';

test("a Stripe signature over the raw body verifies within the tolerance", () => {
  const signature = signStripePayload(BODY, SECRET, 1_700_000_000);
  const header = `t=1700000000,v1=${signature},v0=ignored`;
  assert.deepEqual(parseStripeSignature(header), { timestamp: 1_700_000_000, signatures: [signature] });
  assert.deepEqual(verifyStripeSignature(BODY, header, SECRET, { now: 1_700_000_100 }), []);
});

test("a Stripe signature fails for a changed body, an old timestamp, or no secret", () => {
  const signature = signStripePayload(BODY, SECRET, 1_700_000_000);
  const header = `t=1700000000,v1=${signature}`;
  assert.match(verifyStripeSignature(`${BODY} `, header, SECRET, { now: 1_700_000_000 }).join(), /no v1 signature matches/);
  assert.match(verifyStripeSignature(BODY, header, SECRET, { now: 1_700_000_301 }).join(), /tolerance/);
  assert.deepEqual(verifyStripeSignature(BODY, header, ""), ["no webhook secret"]);
  assert.deepEqual(verifyStripeSignature(BODY, "v1=abc", SECRET), ["missing t timestamp", "missing v1 signature"]);
});

test("Iranian amounts convert between Toman and Rial", () => {
  assert.equal(convertIranianAmount(125_000, "IRT", "IRR"), 1_250_000);
  assert.equal(convertIranianAmount(1_250_000, "IRR", "IRT"), 125_000);
  assert.throws(() => convertIranianAmount(15, "IRR", "IRT"), /not a whole amount/);
  assert.throws(() => convertIranianAmount(1.5, "IRT", "IRR"), /whole number/);
});

test("a gateway verify response maps to paid, already paid, or unpaid", () => {
  const order = { total: 125_000, currency: "IRT", gatewayCurrency: "IRR", authority: "A0001" };
  const paid = checkVerify(order, { data: { code: 100, ref_id: 201 }, errors: [] }, { authority: "A0001", verifiedAmount: 1_250_000 });
  assert.equal(paid.outcome, "paid");
  assert.equal(paid.amount, 1_250_000);
  assert.deepEqual(paid.errors, []);
  assert.equal(checkVerify(order, { data: { code: 101, ref_id: 201 } }).outcome, "already-paid");
  assert.equal(checkVerify(order, { data: [], errors: { code: -51 } }).outcome, "unpaid");
  const wrongAmount = checkVerify(order, { data: { code: 100, ref_id: 201 } }, { verifiedAmount: 125_000 });
  assert.equal(wrongAmount.outcome, "unpaid");
  assert.equal(checkVerify(order, { data: { code: 100, ref_id: 1 } }, { authority: "B" }).outcome, "unpaid");
});

const STOCK = [
  { location: "berlin", ships: ["DE"], rank: 1, levels: { MUG: { onHand: 3, reserved: 1 }, TEE: { onHand: 1 } } },
  { location: "hamburg", ships: ["DE"], rank: 2, levels: { MUG: { onHand: 5, safetyStock: 1 }, TEE: { onHand: 4 } } },
];

test("stock allocation prefers one location and never oversells", () => {
  assert.equal(availableAt(STOCK[0], "MUG"), 2);
  assert.equal(availableAt(STOCK[1], "MUG"), 4);
  const single = allocateOrder({ destination: "DE", lines: [{ sku: "MUG", quantity: 2 }, { sku: "TEE", quantity: 2 }] }, STOCK);
  assert.deepEqual(single.locations, ["hamburg"]);
  const split = allocateOrder({ destination: "DE", lines: [{ sku: "MUG", quantity: 5 }] }, STOCK);
  assert.deepEqual(split.allocations, [
    { sku: "MUG", location: "berlin", quantity: 2 },
    { sku: "MUG", location: "hamburg", quantity: 3 },
  ]);
  const short = allocateOrder({ destination: "DE", lines: [{ sku: "MUG", quantity: 9 }] }, STOCK);
  assert.deepEqual(short.shortfalls, [{ sku: "MUG", quantity: 3 }]);
  assert.equal(allocateOrder({ destination: "FR", lines: [{ sku: "MUG", quantity: 1 }] }, STOCK).shortfalls[0].quantity, 1);
  assert.throws(() => allocateOrder({ lines: [{ sku: "MUG", quantity: 0 }] }, STOCK), /positive whole number/);
});

const LISTS = [
  {
    id: "wholesale",
    groups: ["wholesale"],
    entries: [
      { sku: "MUG", minQuantity: 1, unitPrice: 9 },
      { sku: "MUG", minQuantity: 10, unitPrice: 8.5 },
    ],
  },
  { id: "acme", companies: ["acme"], entries: [{ sku: "MUG", minQuantity: 1, percentOff: 30 }] },
];

test("B2B prices follow tiers, contracts, and the public fallback", () => {
  const nine = resolvePrice({ sku: "MUG", quantity: 9, groups: ["wholesale"], basePrice: 12 }, LISTS);
  assert.equal(nine.unitPrice, 9);
  assert.deepEqual(nine.nextTier, { minQuantity: 10, unitPrice: 8.5 });
  assert.equal(resolvePrice({ sku: "MUG", quantity: 10, groups: ["wholesale"], basePrice: 12 }, LISTS).unitPrice, 8.5);
  const contract = resolvePrice({ sku: "MUG", quantity: 50, company: "acme", groups: ["wholesale"], basePrice: 12 }, LISTS);
  assert.equal(contract.source, "contract");
  assert.equal(contract.unitPrice, 8.4);
  const publicPrice = resolvePrice({ sku: "MUG", quantity: 1, basePrice: 12 }, LISTS);
  assert.deepEqual(publicPrice, { unitPrice: 12, source: "public", list: null, minQuantity: 1, nextTier: null });
  assert.throws(() => resolvePrice({ sku: "MUG", quantity: 1 }, []), /no basePrice/);
});

test("import rows catch duplicates, orphans, order, and bad prices", () => {
  const good = [
    { sku: "TEE", type: "variable", name: "Tee" },
    { sku: "TEE-M", type: "variation", parent: "TEE", regularPrice: "19.90", salePrice: "15.00", stock: 4 },
  ];
  assert.deepEqual(checkImportRows(good), []);
  const errors = checkImportRows([
    { sku: "TEE-M", type: "variation", parent: "TEE" },
    { sku: "TEE", type: "variable", name: "Tee" },
    { sku: "TEE", type: "simple", name: "Again", regularPrice: "19,90" },
    { sku: "X", type: "variation", parent: "NOPE", stock: -1 },
    { sku: "Y", name: "Sale", regularPrice: "10", salePrice: "12" },
  ]).join("\n");
  assert.match(errors, /row 1: parent TEE comes after its variation/);
  assert.match(errors, /row 3: duplicate sku TEE/);
  assert.match(errors, /row 3: regularPrice "19,90"/);
  assert.match(errors, /row 4: stock must be/);
  assert.match(errors, /row 4: parent NOPE is not a variable product/);
  assert.match(errors, /row 5: salePrice must be lower/);
});

test("Web Vitals are rated with the p75 thresholds", () => {
  assert.equal(rate("lcp", 2500), "good");
  assert.equal(rate("lcp", 2501), "needs-improvement");
  assert.equal(rate("lcp", 4001), "poor");
  assert.equal(rate("inp", 200), "good");
  assert.equal(rate("inp", 501), "poor");
  assert.equal(rate("cls", 0.1), "good");
  assert.equal(rate("cls", 0.26), "poor");
  assert.throws(() => rate("fid", 10), /unknown metric/);
  const [product, cart] = checkWebVitals([
    { template: "product", device: "mobile", lcp: 3100, inp: 180, cls: 0.02 },
    { template: "cart", lcp: 1800, inp: 120, cls: 0.01 },
  ]);
  assert.equal(product.passes, false);
  assert.equal(product.ratings.lcp, "needs-improvement");
  assert.equal(cart.passes, true);
});

test("MCP tool definitions need annotations, schemas, dry runs, and page caps", () => {
  const good = [
    {
      name: "list_orders",
      description: "List orders with filters and a page size cap.",
      inputSchema: { type: "object", properties: { perPage: { type: "integer", maximum: 100 } } },
      annotations: { readOnlyHint: true },
    },
    {
      name: "create_refund",
      description: "Refund part or all of a paid order after a dry run.",
      inputSchema: { type: "object", properties: { dryRun: { type: "boolean" }, confirm: { type: "boolean" } } },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
    },
  ];
  assert.deepEqual(checkToolDefinitions(good), []);
  const errors = checkToolDefinitions([
    { name: "List-Orders", description: "short", inputSchema: {}, annotations: {} },
    { name: "delete_product", description: "Delete a product from the catalog.", inputSchema: { type: "object" }, annotations: { readOnlyHint: true } },
    { name: "list_products", description: "List products in the catalog by page.", inputSchema: { type: "object" }, annotations: { readOnlyHint: true } },
  ]).join("\n");
  assert.match(errors, /List-Orders: name must be lowercase snake_case/);
  assert.match(errors, /annotations.readOnlyHint must be set/);
  assert.match(errors, /delete_product: looks like a write but readOnlyHint is true/);
  assert.match(errors, /delete_product: risky writes need a dryRun input/);
  assert.match(errors, /list_products: list tools need a perPage or limit/);
});
