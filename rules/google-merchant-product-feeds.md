# Google Merchant product feeds

- Emit one item per purchasable unit. Keep `id` stable and at most 50 characters. Share `item_group_id` across variants.
- Require `id`, `title` or `structured_title`, `description` or `structured_description`, `link`, `image_link`, `availability`, and `price`.
- Write `price` as major units with a period and an ISO code, such as `15.00 USD`. Availability is `in_stock`, `out_of_stock`, `preorder`, or `backorder`.
- Send `availability_date` for `preorder` and `backorder`.
- Match the landing page title, description, price, and availability. Do not put promotional text in the title.
- Put generated titles and descriptions in the structured attribute with `digital_source_type` `trained_algorithmic_media`.
- Submit a real GTIN when the product has one. Do not invent digits.
- Use images of at least 500 by 500 pixels. Merchant Center's stated enforcement date for that minimum is 31 January 2027.
- Run `scripts/check-feed-item.mjs` before export. It does not call Google.
