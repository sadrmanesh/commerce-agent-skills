---
name: ecommerce-seo-structured-data
description: "Add product JSON-LD that matches the visible offer, including price, currency, availability, and images, without a second conflicting Product node. Use when editing product-page SEO, schema.org markup, or merchant listing data."
license: MIT
compatibility: "The JSON-LD checker requires Node.js 20 or newer. No network access."
metadata:
  author: Naser Sadrmanesh
  version: "0.1.0"
---

# Ecommerce SEO structured data

Use this skill when a product page needs schema.org data that matches what the shopper sees. Google's merchant listing and product snippet features have different required fields. Check a document with [`scripts/check-product-jsonld.mjs`](scripts/check-product-jsonld.mjs). The field list and the WooCommerce hook are in [the JSON-LD notes](references/product-jsonld.md). A passing merchant example is [`assets/example-product.jsonld`](assets/example-product.jsonld).

Requirements below follow Google's Search Central product structured data documentation as reviewed for this skill. Rich result rules change. Re-check that documentation when a page is rejected, and do not promise a rich result.

## Procedure

1. Find existing Product markup before adding any. WooCommerce core prints Product data through `WC_Structured_Data` on the single product template. A second Product node for the same item conflicts with the first.
2. Change WooCommerce output with the `woocommerce_structured_data_product` filter. Add a new JSON-LD script only on a headless or custom storefront that does not already emit one.
3. Mark up the offer the page actually sells. A variant page uses that variant's price, currency, SKU, and availability. A parent page that spans several prices uses an `AggregateOffer` only for a product snippet, not as the sole offer for a merchant listing.
4. Put JSON-LD in the server-rendered HTML. Google documents that Product markup built only in the browser can make shopping crawls less reliable for price and availability.
5. Run the checker in the profile you are targeting:

```bash
node scripts/check-product-jsonld.mjs --file product.json --profile merchant
node scripts/check-product-jsonld.mjs --file product.json --profile snippet
```

## Merchant listing profile

The checker requires, for each Product:

- `name`
- `image` as a crawlable URL, an `ImageObject` with `url`, or a list of those
- `offers` as one `Offer`, not an `AggregateOffer` and not an array
- a numeric `price` greater than zero, or the same under `priceSpecification` when `offers.price` is absent
- `priceCurrency` as a three-letter ISO 4217 code on the same object that carries the price

If both `offers.price` and `offers.priceSpecification.price` are present, Google uses `offers.price`. The checker flags a non-positive `offers.price` in that case.

`availability` is recommended. Use one schema.org value such as `https://schema.org/InStock` or `https://schema.org/OutOfStock`. Do not mark an out-of-stock variant as `InStock`.

## Product snippet profile

The checker requires `name` and at least one of `review`, `aggregateRating`, or `offers`.

- An `Offer` needs a numeric price and `priceCurrency`.
- An `AggregateOffer` needs numeric `lowPrice` and `highPrice`, `priceCurrency`, and a positive `offerCount`.
- `aggregateRating`, when present, needs numeric `ratingValue` and either `reviewCount` or `ratingCount`.

A snippet may describe a price range. A merchant listing, in the documentation this skill follows, needs a specific offer with a positive price.

## Visible agreement

- The price in JSON-LD is the price on the page, in the currency the shopper would be charged, without a thousands separator inside the JSON number.
- The image URL returns the product image to an anonymous crawler.
- `name` and `description` are the language of the page. Translate the schema with the page. Do not leave English schema on a Persian page unless the visible title is English.
- RTL does not change the JSON. Do not insert Persian digits into `price` or `sku`. Display digits in HTML. Keep ASCII in the structured data.
- Do not mark up products that are not on the page. A category page is not a single Product with one offer unless the page is actually one product.

## Canonical and language

- The page has one canonical URL, and the offer `url` matches the page the shopper landed on, including the selected variant when the variant has its own URL.
- When several languages exist, each language URL's canonical and `hreflang` annotations have to agree. Structured data does not replace `hreflang`.

## Gotchas

- A formatted string such as `"19,00 USD"` or `"۱۹.۰۰"` is not a price. Use a JSON number.
- `availability: InStock` on a parent while every variant is sold out contradicts the page.
- Copying a review `ratingValue` you do not display, or marking up reviews the page does not show, is not a fix for a missing offer.
- Sitewide `Organization` or return-policy markup is separate from the product offer. Add it once, on the pages where it is visible, rather than inventing a return policy inside every offer.

## Verification

- The checker exits 0 for the profile you ship.
- View source shows one Product for the item, inside server-rendered HTML.
- The price, currency, and availability match the variant on the page, including an out-of-stock variant.
- A Persian product page keeps Persian text in `name` and ASCII in `price` and `priceCurrency`.
- Disabling JavaScript still leaves the JSON-LD in the document.
