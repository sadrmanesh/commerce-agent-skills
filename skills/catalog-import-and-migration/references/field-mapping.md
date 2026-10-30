# Field mapping

## WooCommerce CSV importer columns

The built-in product CSV importer reads these columns, among others.

| Column | Notes |
| --- | --- |
| `ID` | Existing product id. Leave empty to create. |
| `Type` | `simple`, `variable`, `variation`, `grouped`, `external` |
| `SKU` | Unique per product and variation. Used to match existing products when "Update existing products" is checked. |
| `Name` | Product name. Variations can leave it empty. |
| `Parent` | For a variation: the parent's SKU, or `id:123` |
| `Regular price`, `Sale price` | Decimal with `.` |
| `Stock`, `In stock?` | Quantity, and `1` or `0` |
| `Categories` | Comma-separated, `>` for hierarchy: `Clothing > Shirts` |
| `Images` | Comma-separated URLs. The first is the main image. |
| `Attribute 1 name`, `Attribute 1 value(s)`, `Attribute 1 visible`, `Attribute 1 global` | Variable products list all values. Variations list their one value. |
| `Meta: _custom_key` | Custom meta |

For more control, use the REST API: create the parent with `POST products`, then variations with `POST products/{id}/variations/batch`.

## Common platform mappings

| Concept | WooCommerce | Shopify | Generic JSON |
| --- | --- | --- | --- |
| Product | product | product | `product` |
| Sellable unit | variation | variant | `variant` |
| Option | attribute | option (up to 3 per product) | `options` |
| Price | `regular_price` | `price` | `price` |
| Compare-at price | `regular_price` with a `sale_price` | `compareAtPrice` | `listPrice` |
| Stock | `stock_quantity` | inventory level per location | `stock` |
| Handle or slug | `slug` | `handle` | `slug` |

Shopify allows at most three options per product, and a limited number of variants per product, so a WooCommerce product with four attributes must be split or flattened before migrating.

## Report file

Write one line per source row:

```json
{"key":"TEE-BLUE-M","action":"update","targetId":5123,"warnings":[]}
```
