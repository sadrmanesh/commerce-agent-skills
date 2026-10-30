---
name: google-merchant-product-feeds
description: "Build a Google Merchant Center product feed item with the required id, title, description, link, image, availability, and price fields. Use when exporting products to Merchant Center, Content API items, or a product feed file."
license: MIT
compatibility: "The feed item checker requires Node.js 20 or newer. No network access."
metadata:
  author: Naser Sadrmanesh
  version: "0.2.0"
---

# Google Merchant product feeds

Use this skill when a catalog becomes a Merchant Center item. On-page JSON-LD is the structured-data skill. Generated titles and descriptions follow the description-guardrails skill, then the structured-title rules below.

Attribute names and limits below follow Google's Merchant Center product data specification. Re-check that specification when a disapproval cites an attribute this skill does not list. The local checker does not call Google.

## Procedure

1. Emit one item per purchasable unit. A variant gets its own `id`. Variants that shoppers choose among share `item_group_id`.
2. Fill the required attributes: `id`, `title` or `structured_title`, `description` or `structured_description`, `link`, `image_link`, `availability`, and `price`.
3. Match the landing page. The title, description, price, and availability a shopper sees are the values in the feed.
4. Run `node scripts/check-feed-item.mjs --file item.json` from this skill directory.
5. Keep `id` stable for the life of that unit. A new id on every export creates a new product and drops history.

Field limits and the variant rules are in [the attribute notes](references/attributes.md). An item that passes the checker is in [`assets/example-item.json`](assets/example-item.json). Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## Required values

| Attribute | Rule |
| --- | --- |
| `id` | Unique, stable, at most 50 characters. Use the SKU when the SKU fits. |
| `title` | Plain text, at most 150 characters, or `structured_title` when the title was generated. |
| `description` | Plain text, at most 5000 characters, or `structured_description` when the description was generated. |
| `link` | `http` or `https` URL of the product landing page on the verified domain. |
| `image_link` | `http` or `https` URL of the main product image. |
| `availability` | `in_stock`, `out_of_stock`, `preorder`, or `backorder`. |
| `price` | Decimal major units with a period, a space, and an ISO 4217 code, such as `15.00 USD`. |

`availability_date` is required when `availability` is `preorder`. Provide it for `backorder` as well. The product data specification asks for that date on both.

## Variants

Set `item_group_id` to the parent id for every variant. Google's specification marks `item_group_id` as required for variants in free listings, and for variants targeted at Brazil, France, Germany, Japan, the United Kingdom, and the United States. Put the variant's color or size in `color` and `size` when those attributes distinguish the unit. Apparel in those countries has extra required attributes (`color`, `size`, `gender`, `age_group`). Do not guess them. Read them from the catalog or leave the item out of the feed until they exist.

## Generated text

If a title or description was produced by a generative system, do not put it only in `title` or `description`. Use `structured_title` or `structured_description` and set `digital_source_type` to `trained_algorithmic_media`. The ordinary `title` and `description` attributes are for text that was not created that way. The content still has to match the landing page and stay within 150 and 5000 characters.

## Images

Merchant Center has announced a minimum image size of 500 by 500 pixels, with enforcement beginning 31 January 2027. Export images that already meet that size instead of waiting for the disapproval. The checker validates the URL, not the pixel size. Check dimensions in the image pipeline.

## Gotchas

- A formatted price such as `$15.00` or `15,00 USD` is not the `price` attribute. Use `15.00 USD`.
- Changing `id` when the SKU gains a prefix splits the product in Merchant Center.
- Out-of-stock items still need a price, and the landing page still needs to show that price.
- Do not put "free shipping" or a competitor name in `title` or `description`.
- GTIN is not universally required. Submit a real GTIN when the product has one. Do not invent digits. `identifier_exists` is the attribute Google documents when you do not have a GTIN; confirm the current rule for that category before setting it false.

## Verification

- The checker exits 0 on the feed file.
- Each variant id is unique and stable, and shares `item_group_id` with its siblings.
- A spot-check opens `link` and sees the same price text and availability.
- A generated description is in `structured_description`, not only in `description`.
