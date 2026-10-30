# Merchant Center item attributes

Source: Google Merchant Center product data specification. Limits below are the ones that specification states for the common required attributes.

## Identity

- `id`: at most 50 characters, unique per product, stable across updates, same id for the same product across countries or languages when it is the same unit.
- `item_group_id`: shared by variants. Required for variant free listings, and for variants in Brazil, France, Germany, Japan, the United Kingdom, and the United States.
- `gtin`: submit only a real GTIN. The specification strongly recommends it when one exists. Maximum 50 numeric characters, at most 14 digits per value, ignoring added spaces and dashes.

## Text

- `title`: at most 150 characters. No promotional text such as "free shipping", and no all-capital slogans.
- `description`: at most 5000 characters. Product information only. No store links, sale copy, or other products.
- Generated text uses `structured_title` or `structured_description`. Set `digital_source_type` to `trained_algorithmic_media` and put the words in `content`. `default` means the text was not generated. If you omit `digital_source_type`, Google treats it as `default`.

## Offer

- `price`: `19.00 USD`. Period as the decimal separator. ISO 4217 currency code.
- `sale_price`: same format, lower than `price`, and only while the landing page shows that sale.
- `availability`: `in_stock`, `out_of_stock`, `preorder`, `backorder`.
- `availability_date`: required for `preorder`. Also send it for `backorder`.
- `link` and `image_link`: absolute `http` or `https` URLs. `link` is the landing page on the verified domain, not an interstitial.

## Condition

`condition` is required when the product is used or refurbished. Allowed values are `new`, `refurbished`, and `used`. Do not omit `new` on a new product if the target program asks for it; check the current specification for that program rather than guessing.

## Checker

`scripts/check-feed-item.mjs` checks one JSON object:

- required keys `id`, `title` or structured title content, `description` or structured description content, `link`, `image_link`, `availability`, `price`
- length limits for `id`, `title`, and `description`
- price pattern and availability vocabulary
- `availability_date` when availability is `preorder` or `backorder`
- `https` or `http` URLs

It does not upload the item, fetch the image, or know whether a category needs `color` or `gender`.
