import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateCatalog } from "../skills/product-catalog-modeling/scripts/validate-catalog.mjs";

const example = new URL("../skills/product-catalog-modeling/assets/example-catalog.json", import.meta.url);

test("the shipped catalog example is valid", async () => {
  const document = JSON.parse(await readFile(example, "utf8"));
  assert.deepEqual(validateCatalog(document), []);
});

test("rejects a repeated variant combination and a parent price", () => {
  const errors = validateCatalog({
    products: [
      {
        id: "shirt",
        type: "variable",
        sku: "PARENT",
        name: "Shirt",
        price: "10.00",
        currency: "USD",
        attributes: [{ code: "color", name: "Color", options: ["blue"], variation: true }],
        variants: [
          {
            id: "a",
            sku: "A",
            attributes: { color: "blue" },
            price: "10.00",
            currency: "USD",
            stock: { managed: true, quantity: 1, backorders: "no" },
          },
          {
            id: "b",
            sku: "A",
            attributes: { color: "blue" },
            price: "10.00",
            currency: "USD",
            stock: { managed: true, quantity: 1, backorders: "no" },
          },
        ],
      },
    ],
  });
  assert.ok(errors.some((error) => error.includes("sku must be null")));
  assert.ok(errors.some((error) => error.includes("price must live")));
  assert.ok(errors.some((error) => error.includes("duplicates SKU")));
  assert.ok(errors.some((error) => error.includes("repeats combination")));
});
