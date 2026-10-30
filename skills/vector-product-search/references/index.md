# Vector index beside lexical search

## Document

| Field | Role |
| --- | --- |
| `unit_id` | Purchasable unit. Primary key. |
| `parent_id` | Set for variants. |
| `sku`, `gtin` | Exact match. Not part of the embedded text. |
| `text_hash` | Hash of the normalized text that was embedded. |
| `model_id` | Embedding model identifier and its dimension. |
| `embedding` | Vector from that model only. |
| `facet_ids`, `in_stock`, `price`, `currency` | Filters and display. Not a reason to re-embed. |

## Embedded text

```text
{title}
{brand}
{category names}
{attribute labels}
```

Normalize with the marketplace search normalizer before hashing and embedding. The hash is of the normalized text. If you change the normalizer, rebuild the index. Old hashes would not match the new text.

## Fusion

Normalize each retrieval's scores onto `[0, 1]` within that result set, then:

```text
fused = (lexical_weight * lexical) + (vector_weight * vector)
```

Start at `lexical_weight = 0.6` and `vector_weight = 0.4` if you have no labeled queries yet. This is a starting point, not a measured optimum. Units that appear in only one list use `0` for the missing score.

Exact SKU or GTIN matches skip fusion and are placed first.

## Metric

Write down cosine similarity or the index's metric next to `model_id`. Query with that metric. Do not mix cosine in one environment and inner product in another unless both sides use normalized vectors and you have recorded that they match.
