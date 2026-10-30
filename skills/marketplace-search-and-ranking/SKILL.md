---
name: marketplace-search-and-ranking
description: "Index purchasable catalog units and rank them with text relevance, facets, stock, and language-aware matching for Persian and other languages. Use when building marketplace search, filters, relevance, or multilingual product discovery."
license: MIT
compatibility: "The search-text normalizer requires Node.js 20 or newer. No network access."
metadata:
  author: Naser Sadrmanesh
  version: "0.3.0"
---

# Marketplace search and ranking

Use this skill for product discovery in a marketplace or catalog. It does not assume a particular search engine. Apply the same document and ranking rules whether the index is a dedicated search service or a database index. Text normalization for Persian and mixed digits lives in [`scripts/normalize-search-text.mjs`](scripts/normalize-search-text.mjs). Field and scoring details are in [the ranking notes](references/document-and-ranking.md).

## Procedure

1. Index the purchasable unit. A simple product is one document. Each variant is its own document, with parent title, brand, and categories copied onto it. Do not index only the parent when prices and stock differ by variant.
2. Normalize text the same way at index time and query time. Run `normalize-search-text.mjs` logic before analysis.
3. Give every facet a stable id and a localized label. Filter on the id.
4. Rank with text relevance first, then stock and explicit business rules. Start from the factors in the ranking notes and tune them with labeled queries. Do not treat those factors as measured conversion rates.
5. Return a keyset (search-after) page, not a deep offset. Offsets skip or repeat documents when the index changes.

## Document

Each document needs:

- `unit_id` and `sku`
- `parent_id` when the unit is a variant
- `title`, `brand`, and a short `description` per language you actually search
- `attributes` as `{ code, value_id, label }`
- `price` and `currency` of the unit
- `in_stock` and `backorder` as booleans derived from the catalog stock record
- `category_ids`
- `updated_at`

Do not index a display string that already contains a currency symbol as the price. Keep the number and the currency.

## Query

1. Normalize the query.
2. If the normalized query equals a SKU or GTIN, return that unit first.
3. Otherwise run a text query across title, brand, attribute labels, and description, with title weighted above description.
4. Apply selected facets as filters, not as optional boosts. A shopper who chose "blue" should not see red.
5. Apply stock policy. Hide out-of-stock units when the shop is configured to hide them. Demote them when the shop still wants them visible.
6. Page with a stable sort. Add `unit_id` as a tiebreaker so a page boundary does not shuffle.

## Facets

- Compute facet counts from the current text query and the other selected facets. Do not compute counts from the unfiltered catalog if the UI shows them next to a filtered result set.
- A facet value with a zero count may be hidden. Do not let the shopper select a value that would empty the result unless you explain that.
- Multi-select inside one facet is usually OR. Across facets it is AND. Say which one the UI implements and make the query match it.
- Price facets use the unit price in the shopper's display currency only after conversion. The filter still has to be reproducible from stored prices.

## Multilingual and RTL

- Use a language-specific analyzer. Do not stem Persian with an English stemmer, and do not stem English with a Persian stemmer.
- Store `title_fa` and `title_en` (or one field per language you support) rather than one mixed field.
- Detect the query language only as a hint. If the shopper is browsing the Persian catalog, search Persian fields first.
- Normalize Arabic Yeh `ي` to Persian Yeh `ی`, Arabic Kaf `ك` to Persian Kaf `ک`, Persian and Arabic-Indic digits to ASCII, and remove ZWNJ for matching so `می‌روم` matches `میروم`. Keep ZWNJ in the source catalog text. The normalizer does this.
- Strip bidi marks from indexed and query text. They arrive from copied titles and should not change a match.
- RTL affects rendering of the search UI, not the score. Use the Persian and RTL skill for layout.

## Ranking factors

Use these as a starting point, then change them when labeled queries show a miss:

- Exact SKU or GTIN match outranks a fuzzy title match.
- Title matches outrank description-only matches.
- An in-stock purchasable unit outranks an out-of-stock unit when both match.
- A newer `updated_at` can break ties. It should not outrank a clearly better text match.
- Sponsored placements are labeled as sponsored in the UI and are not mixed into the organic score silently.

Write the formula down in the service that serves results. A boost that exists only in an indexer config and not in review notes will be retuned by accident.

## Gotchas

- Indexing the parent product shows one price and one stock figure for every variant. Shoppers then open a color that is not the price they saw.
- Updating a variant price without updating the document leaves search and the product page in conflict. Update the document in the same flow as the catalog write, or from an outbox.
- Synonyms belong in a managed list (`tee` / `t-shirt`). Do not add a synonym because one query failed once.
- Typo tolerance on short queries (two or three characters) matches unrelated brands. Tighten fuzziness for short strings and for SKU fields.
- Facet labels in Persian still need stable ids. Searching the translated label as if it were the id breaks when the translation changes.

## Verification

- A SKU query returns that unit even if the title uses different digits or Yeh/Kaf forms.
- A color facet returns only units with that color's value id.
- Out-of-stock policy matches the shop setting on page 1 and on the next page.
- An English stemmer is not applied to a Persian title field.
- A sponsored unit is visibly marked and is not the only explanation for an organic ranking change.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
