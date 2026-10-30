import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { checkProductJsonLd } from "../skills/ecommerce-seo-structured-data/scripts/check-product-jsonld.mjs";

const example = new URL("../skills/ecommerce-seo-structured-data/assets/example-product.jsonld", import.meta.url);

test("the shipped merchant example passes", async () => {
  const data = JSON.parse(await readFile(example, "utf8"));
  const result = checkProductJsonLd(data, "merchant");
  assert.deepEqual(result.errors, []);
});

test("merchant listings reject a zero price and an aggregate offer", () => {
  const zero = checkProductJsonLd(
    {
      "@type": "Product",
      name: "Shirt",
      image: "https://shop.example/shirt.jpg",
      offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    },
    "merchant",
  );
  assert.ok(zero.errors.some((error) => error.includes("greater than zero")));

  const aggregate = checkProductJsonLd(
    {
      "@type": "Product",
      name: "Shirt",
      image: "https://shop.example/shirt.jpg",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: 10,
        highPrice: 20,
        priceCurrency: "USD",
        offerCount: 2,
      },
    },
    "merchant",
  );
  assert.ok(aggregate.errors.some((error) => error.includes("AggregateOffer")));
});

test("product snippets accept a rating without an offer", () => {
  const result = checkProductJsonLd(
    {
      "@type": "Product",
      name: "Shirt",
      aggregateRating: { "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 12 },
    },
    "snippet",
  );
  assert.deepEqual(result.errors, []);
});
