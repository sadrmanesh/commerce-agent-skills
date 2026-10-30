Search for an existing order by meta before posting a new one.

```json
{ "meta_data": [ { "key": "_idempotency_key", "value": "checkout-1042" } ] }
```

If `wc_get` style search on `_idempotency_key` hits, return that order instead of creating another.
