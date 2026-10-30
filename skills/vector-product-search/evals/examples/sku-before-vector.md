Normalize the query and look up `sku` and `gtin` first.

Only if that lookup misses, run the vector query. The embedding text does not include the price.
