# Marketplace search and ranking

- Index each purchasable unit. A variant with its own price or stock is its own document, with parent title and brand copied on.
- Normalize query text and indexed text the same way: Persian Yeh and Kaf, ASCII digits, ZWNJ removed for matching, bidi marks stripped.
- Do not stem Persian with an English analyzer, or English with a Persian analyzer.
- Filter facets by stable value ids. Localize labels. Multi-select inside one facet is OR unless the UI says otherwise. Across facets, combine with AND.
- An exact SKU or GTIN match outranks a fuzzy title match. In-stock units outrank out-of-stock units when both match.
- Mark sponsored placements in the UI. Do not fold them into the organic score without a label.
- Page with a keyset and a stable tiebreaker (`unit_id`), not a deep offset.
- Reindex from the catalog write path. A deleted variant must leave the index.
