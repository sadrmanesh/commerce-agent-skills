Run the shared normalizer on both sides.

```js
const query = normalizeSearchText(rawQuery);
```

Fold Yeh and Kaf, map digits to ASCII, and remove ZWNJ before analysis. Use a Persian analyzer for Persian titles.
