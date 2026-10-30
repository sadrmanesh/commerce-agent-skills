# Ecommerce SEO structured data

- Emit one Product node that matches the visible product. Do not add a second Product JSON-LD block on a WooCommerce page that already prints one.
- Prefer the `woocommerce_structured_data_product` filter on WooCommerce. On a custom storefront, render JSON-LD in the server HTML.
- Use a JSON number for `price` and an ISO 4217 `priceCurrency`. Do not put currency symbols or Persian digits in the price.
- A variant page marks up that variant's price, SKU, and availability. Do not mark a sold-out unit as `InStock`.
- Merchant listings need `name`, `image`, and one `Offer` with a price greater than zero. Product snippets can use `AggregateOffer` for a visible price range.
- If both `offers.price` and `priceSpecification` are set, the offer price is the one Google uses. Keep it positive for a merchant listing.
- Set `availability` from the unit's stock status. Map WooCommerce `onbackorder` to `BackOrder`.
- Keep `name` and `description` in the page language. Keep `hreflang` and canonical URLs consistent for translated pages.
- Run `scripts/check-product-jsonld.mjs` for the `merchant` or `snippet` profile before shipping the markup.
