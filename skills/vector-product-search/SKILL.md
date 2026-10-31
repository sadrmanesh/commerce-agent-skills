---
name: vector-product-search
description: "Add vector retrieval beside lexical product search, with one embedding per purchasable unit and exact SKU lookup kept first. Use when adding embedding search, hybrid ranking, or re-embedding after catalog edits."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.2"
---

# Vector product search

Use this skill when lexical search is not enough for paraphrased queries. Facets, stock, and lexical ranking stay in the marketplace search skill. This skill adds a vector index. It does not replace SKU and GTIN lookup.

Do not claim a recall or conversion number. Choose a model, record its id and dimension, and measure queries you have labeled.

## Procedure

1. Embed one text per purchasable unit. A variant with its own title or attributes gets its own vector. Copy the parent name into that text.
2. Use the same model, dimension, and similarity metric for indexing and querying. Record `model_id` and a hash of the embedded text on the document.
3. Keep price, stock, and facet ids as filter fields. Do not rely on the embedding to enforce "blue" or "in stock".
4. Resolve an exact normalized SKU or GTIN before any vector query. If it hits one unit, return that unit first.
5. Combine lexical and vector scores with a formula you write down. Re-embed when the text hash changes, not when only the price changes.

Normalization and hybrid scoring are in [the index notes](references/index.md). Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## What is embedded

Include the fields a shopper might paraphrase: title, brand, category names, and attribute labels. Run the same text normalization as lexical search, including Persian Yeh, Kaf, digits, and ZWNJ removal, before you embed.

Exclude price, stock counts, and SKUs from the embedded text. Price and stock change without the words changing, and a SKU is handled by exact match. If you later include them, the content hash must change when they change.

## Query

1. Normalize the query.
2. Exact identifier match wins.
3. Otherwise run the lexical query and the vector query with the same filters (facet ids, stock policy, category).
4. Fuse the two ranked lists. A default you may start from is a weighted sum after each list is normalized to the same scale. Change the weight only when labeled queries say so.
5. Page with a keyset on the fused score plus `unit_id`.

Apply filters in both retrievals. A vector hit that ignores the selected color is a bug.

## Re-embedding

- Store `model_id`, dimension, metric (`cosine` unless the index documents another), and `text_hash`.
- A catalog write recomputes the hash. If the hash or the model id differs, enqueue that unit.
- Switching models rebuilds the index. Do not query an index with a different model than the one that wrote it.
- Delete the vector when the unit is deleted. A parent rebuild replaces that parent's vectors as a set.

## Gotchas

- Embedding only the parent returns one vector for every size and color.
- Cosine and dot product are not interchangeable unless the vectors are normalized and you meant that equivalence.
- A vector score must not outrank an exact SKU match.
- Indexing the raw Persian string and querying the normalized string misses. Normalize both.
- Do not log shopper queries next to identifiers you are not allowed to retain. The query text can contain an address or a name the shopper pasted.

## Verification

- A SKU query returns that unit even when a nearer vector belongs to another product.
- A color filter removes other colors from the vector results, not only from the lexical results.
- Changing the price does not change `text_hash`. Changing the title does, and that unit is re-embedded.
- Deleting a variant removes its vector.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
