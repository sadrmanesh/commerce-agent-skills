# Search documents and a starting rank

This is an implementation note for the marketplace search skill. The weights are a default to review with real queries, not a measured optimum.

## Field weights

| Field | Weight | Analyzer |
| --- | --- | --- |
| `sku`, `gtin` | Exact only. No stemmer, no typo tolerance above one transposition on long codes. | Keyword |
| `title_{lang}` | 5 | Language analyzer after `normalizeSearchText` |
| `brand` | 3 | Keyword plus a normalized text copy |
| `attribute_labels_{lang}` | 2 | Language analyzer |
| `description_{lang}` | 1 | Language analyzer |

Copy parent title and brand onto each variant document so a query for the parent name still finds the purchasable unit. Store `variant_label` separately so the result can show "Cotton shirt, blue".

## Stock factor

After the text score:

- In stock: multiply by 1.
- Backorder and the shop shows backorders: multiply by 0.85.
- Out of stock and the shop still lists it: multiply by 0.25.
- Out of stock and the shop hides it: drop the document.

Change the multipliers when you have query judgments. Keep the policy of "in stock ahead of out of stock" unless the shop explicitly wants sold-out items promoted.

## Tie break

Sort by score descending, then `updated_at` descending, then `unit_id` ascending. The final key makes keyset pagination stable.

## Keyset page

Request a page with the last seen sort tuple, not with `offset`. An offset page skips documents when a product is indexed during the session and repeats documents when one is deleted.

## What not to put in the text score

- Margin, unless the shop has agreed that margin may influence organic rank and the influence is documented.
- Seller rating, until the rating exists on the document and has a defined missing value. A missing rating is not zero stars and is not five stars.
- Click history from the current shopper, unless the feature is explicitly personalization and can be turned off.

## Normalization

`normalizeSearchText` in `scripts/normalize-search-text.mjs`:

- Applies Unicode NFC.
- Maps Arabic Yeh and Kaf to the Persian forms.
- Maps Persian digits `۰-۹` and Arabic-Indic digits `٠-٩` to `0-9`.
- Removes ZWNJ (`U+200C`) and common bidi marks.
- Lowercases Latin text and collapses whitespace.

Run it on index text and on the query. Do not also remove ZWNJ from the catalog source of truth. Display text still needs it.

## Reindex

On catalog write, enqueue the parent id. The worker loads the parent and its variants and replaces that parent's documents as a set. Replacing one variant document and leaving a deleted variant in the index sells a combination that no longer exists.
