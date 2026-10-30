# Vector product search

- Embed one vector per purchasable unit, not one vector per parent when variants differ.
- Use the same model, dimension, and similarity metric for the index and the query. Store `model_id` and a hash of the embedded text.
- Normalize text the same way as lexical search before embedding, including Persian folds.
- Keep SKU and GTIN lookup ahead of vector ranking. An exact identifier match wins.
- Filter facets and stock in the vector query. Do not rely on the embedding to enforce them.
- Leave price and stock out of the embedded text so a price change does not force a new vector.
- Re-embed when the text hash or the model id changes. Delete vectors for deleted units.
- Write down the lexical and vector weights. Do not treat a default weight as a measured result.
