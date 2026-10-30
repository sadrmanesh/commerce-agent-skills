---
name: product-catalog-modeling
description: "Model a sellable catalog of simple products, variants, attributes, SKUs, and stock, and check the model before importing it. Use when designing product data, variation matrices, inventory rules, or catalog imports."
license: MIT
compatibility: "The catalog checker requires Node.js 20 or newer. No network access."
metadata:
  author: Naser Sadrmanesh
  version: "0.1.0"
---

# Product catalog modeling

Use this skill before writing import code or a product schema. The document checked by [`scripts/validate-catalog.mjs`](scripts/validate-catalog.mjs) is a planning model. It is not a WooCommerce export. Map it to WooCommerce with [the variation notes](references/variation-model.md). An example that passes the checker is [`assets/example-catalog.json`](assets/example-catalog.json).

## Procedure

1. Decide the purchasable unit. A simple product is purchased as itself. A variable product is purchased as one variant. A grouped product is a collection of other products. An external product is sold somewhere else.
2. Give every purchasable unit one SKU. SKUs are unique across the catalog, including variants.
3. Model variation attributes as a fixed set of options. Every variant picks exactly one option for every variation attribute. Two variants cannot share a combination.
4. Put the price and the stock record on the purchasable unit. A variable parent does not have its own price or SKU in this model.
5. Run `node scripts/validate-catalog.mjs --file catalog.json` from this skill directory and fix every reported error before importing.

## Document shape

```json
{
  "products": [
    {
      "id": "shirt",
      "type": "variable",
      "sku": null,
      "name": "Cotton shirt",
      "attributes": [
        { "code": "color", "name": "Color", "options": ["blue", "red"], "variation": true }
      ],
      "variants": [
        {
          "id": "shirt-blue",
          "sku": "SHIRT-BLUE",
          "attributes": { "color": "blue" },
          "price": "19.00",
          "currency": "USD",
          "stock": { "managed": true, "quantity": 4, "backorders": "no", "status": "instock" }
        }
      ]
    }
  ]
}
```

Rules the checker enforces:

- `type` is `simple`, `variable`, `external`, or `grouped`.
- `price` is a major-unit string with two decimal places, such as `"19.00"`. `currency` is an ISO 4217 code. Map to the store's decimal setting at the boundary. Do not send this string through a binary float.
- Simple and external products require `sku`, `price`, and `currency`. External products also require `productUrl`.
- Variable products require `sku: null`, no parent `price`, at least one attribute with `"variation": true`, and at least one variant. Each variant sets exactly those attributes.
- Grouped products list `children` ids and do not carry a price.
- `stock.managed: true` requires an integer `quantity` of zero or more. `stock.managed: false` requires `quantity: null`. `backorders` is `no`, `notify`, or `yes`.
- Optional `stock.status` is `instock`, `outofstock`, or `onbackorder`. When quantity is managed, status should agree with quantity and backorders. The checker does not infer status for you.

## Inventory rules

- Managed stock is a quantity you decrement on paid orders and restore on cancel or refund, using the platform's stock API once.
- Unmanaged stock is a status you set by hand (`instock` or `outofstock`). Do not also store a quantity.
- Backorders mean you accept orders at zero. `notify` shows the shopper that the item is on backorder. `yes` allows it quietly. `no` stops the sale at zero.
- A variable parent's availability is the rollup of its variants. Do not maintain a second parent quantity that can disagree with the variants.
- Reservation during checkout, when the platform holds stock for unpaid orders, is part of available-to-sell. Do not subtract that hold a second time in your importer.

## Attributes

- A variation attribute changes the purchasable unit (size, color). It belongs in `attributes` with `variation: true` and on each variant.
- A descriptive attribute (material, care) is not a variant axis. Store it with `variation: false` or as content. Do not create a variant per descriptive value.
- Keep option values stable. Translate the display label, not the option code. The search skill depends on stable facet ids.

## Gotchas

- A parent price range is derived from variants. Writing a parent price and different variant prices hides which amount will be charged.
- Duplicate SKUs across a simple product and a variant make stock and fulfillment ambiguous.
- Cartesian explosions are real. Three attributes with ten options are a thousand variants. Split the product or drop an axis before generating them.
- Currency is a property of the price, not of the shopper's browser. A multi-currency display converts from the stored currency. It does not create a second SKU.

## Verification

- The checker exits 0 on the catalog file.
- Every SKU resolves to one purchasable unit.
- A variant combination that is not for sale is absent, not stored with a blank price.
- After import, the storefront price and stock for one variant match that variant's record, not the parent.
