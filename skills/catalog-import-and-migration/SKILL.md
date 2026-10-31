---
name: catalog-import-and-migration
description: "Import, export, and migrate product catalogs with stable SKU keys, a dry run, parent-before-variation order, batched writes, and URL redirects. Use when moving a store between platforms, bulk importing CSV or JSON products, or exporting a catalog for another system."
license: MIT
compatibility: "The row checker needs Node.js 20 or newer and no packages."
metadata:
  author: Naser Sadrmanesh
  version: "0.3.2"
---

# Catalog import and migration

An import is a repeatable job, not a one-off script. Run it against a copy first, make it safe to run twice, and keep a report of every row. Column maps between platforms are in [the field mapping notes](references/field-mapping.md).

## Procedure

1. Export the source with every field you need: products, variations, attributes, categories, images, stock, prices, SEO fields, and old URLs. Keep the raw export unchanged.
2. Map fields to the target in one file. Normalize units, currencies, decimals, and booleans there, not in ad hoc fixes.
3. Choose a stable key. Use the SKU when every sellable unit has a unique one; otherwise keep the source id in a dedicated field such as `meta:source_id`. Never key on the product name.
4. Check every row before writing anything: `node scripts/check-import-rows.mjs rows.json` reports duplicate SKUs, variations without a parent, invalid prices, and negative stock.
5. Do a dry run that reports creates, updates, and skips per row without writing.
6. Import in order: categories and attributes, then parent products, then variations, then images and relations (upsells, bundles). A variation needs its parent's id.
7. Write in batches (the WooCommerce batch endpoint takes up to 100 items per request) and record the target id for every source key, so a rerun updates instead of duplicating.
8. Create 301 redirects from every old product and category URL to the new one.
9. Compare counts and totals: products, variations, stock units, and a sample of prices.

## Idempotent runs

Look up each row by its key before deciding create or update. Store `source key -> target id` after every batch. A crash halfway through then resumes without duplicates.

## Images

Download source images once, deduplicate by content hash, and upload them to the target media library before linking them. Hotlinking to the old store breaks when it shuts down.

## Exports

Export with a documented column set and UTF-8. Include ids, SKUs, and parent references so the file can be imported back. Use `.` as the decimal separator and ISO 8601 dates. Escape fields with quotes according to RFC 4180 when writing CSV.

## Gotchas

- Spreadsheet programs strip leading zeros from SKUs and barcodes and turn long numbers into scientific notation. Treat them as text.
- Importing variations before their parent creates orphans or fails. Sort parents first.
- Prices with a comma decimal (`19,90`) parse as 1990 or fail in some importers.
- Running the import twice without a key creates every product twice.
- Missing redirects lose search rankings and break links in old emails.
- Customer passwords usually cannot move between platforms. Plan a reset email instead of copying hashes the target cannot read.

## Verification

- The row checker reports no errors before the real run.
- A second run of the same file updates rows and creates nothing.
- Product, variation, and stock totals match the source.
- Every old URL in a sample returns 301 to the right new page.
- A variable product shows the same options and per-variation prices as the source.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
