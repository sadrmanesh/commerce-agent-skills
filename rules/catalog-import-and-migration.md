# Catalog import and migration

- Key every row on a stable SKU or source id. Never on the product name.
- Check rows and run a dry run before writing.
- Import categories and attributes, then parents, then variations, then images and relations.
- Write in batches and store the source key to target id map after each batch.
- A second run must update, not duplicate.
- Treat SKUs and barcodes as text. Use `.` for decimals and ISO 8601 dates.
- Upload images to the target. Do not hotlink the old store.
- Create 301 redirects for every old product and category URL.
- Compare counts, stock totals, and sampled prices after the run.
