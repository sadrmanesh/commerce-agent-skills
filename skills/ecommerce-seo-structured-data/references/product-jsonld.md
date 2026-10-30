# Product JSON-LD

## One node on a WooCommerce product page

WooCommerce builds product structured data in `WC_Structured_Data` and prints it with the single product template. Filter the array before it is encoded:

```php
add_filter(
    'woocommerce_structured_data_product',
    function ( $markup, $product ) {
        if ( ! $product instanceof WC_Product ) {
            return $markup;
        }
        $markup['brand'] = array(
            '@type' => 'Brand',
            'name'  => 'Example',
        );
        return $markup;
    },
    10,
    2
);
```

Only add fields you can see on the page. If a variable product page shows a range, do not force a single variant price into the parent markup.

For a custom storefront, emit one `<script type="application/ld+json">` block from the server. Do not also emit WooCommerce's block if the theme already loaded it.

## Merchant listing shape

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Cotton shirt",
  "image": "https://shop.example/shirt.jpg",
  "sku": "SHIRT-BLUE",
  "description": "Short-sleeve cotton shirt.",
  "offers": {
    "@type": "Offer",
    "url": "https://shop.example/shirt?color=blue",
    "priceCurrency": "USD",
    "price": 19.0,
    "availability": "https://schema.org/InStock"
  }
}
```

`price` is a JSON number. `priceCurrency` is ISO 4217. Merchant listing documentation requires a positive price. Product snippets can use `AggregateOffer` with `lowPrice`, `highPrice`, `priceCurrency`, and `offerCount` when the page shows a range.

## Availability values

Use a single value:

- `https://schema.org/InStock`
- `https://schema.org/OutOfStock`
- `https://schema.org/PreOrder`
- `https://schema.org/BackOrder`
- `https://schema.org/LimitedAvailability`
- `https://schema.org/SoldOut`
- `https://schema.org/Discontinued`
- `https://schema.org/InStoreOnly`
- `https://schema.org/OnlineOnly`
- `https://schema.org/PreSale`

The short name, such as `InStock`, is also accepted by the checker. Map WooCommerce `instock` to `InStock`, `outofstock` to `OutOfStock`, and `onbackorder` to `BackOrder`.

## Checker

`checkProductJsonLd(data, profile)` in `scripts/check-product-jsonld.mjs` reads a Product object or a `@graph` that contains one. Profiles:

- `merchant` requires `name`, `image`, and one positive `Offer`.
- `snippet` requires `name` and at least one of `review`, `aggregateRating`, or `offers`.

Warnings do not fail the process. Errors do. A warning on a missing `availability` still means you should set it when the page shows stock.

## Breadcrumbs

WooCommerce can also emit `BreadcrumbList`. Add a breadcrumb node only when the visible breadcrumb is absent from existing structured data. Do not invent crumbs that are not on the page.

## What this checker does not do

It does not fetch the image URL, does not call Google's rich results test, and does not validate return-policy or shipping-policy shapes. Those policies have their own required fields in Google's documentation. Add them when the shop displays that policy, and re-read the current field list before shipping them.
