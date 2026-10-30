---
name: headless-nextjs-storefront
description: "Build a Next.js storefront that loads catalog data on the server, keeps admin secrets off the client, and revalidates price and stock. Use when adding product, cart, or checkout UI in a Next.js App Router storefront for WooCommerce or another headless commerce API."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.1"
---

# Headless Next.js storefront

Use this skill for a Next.js storefront that talks to a commerce API. WooCommerce HTTP details are in the REST API skill. Shopify admin apps are a different skill. Checkout field behavior is the checkout skill.

This skill assumes the App Router (`app/`). Do not pin a Next.js major version you have not installed. Use the cache and route APIs that version documents.

## Procedure

1. Render product and category pages from the server. The HTML should contain the price and availability a shopper and a crawler see.
2. Keep admin credentials and WooCommerce consumer secrets in server environment variables. Never import them into a client component.
3. Use the public storefront API for the cart. For WooCommerce that is the Store API (`/wp-json/wc/store/v1/`), with its cart token and nonce. It is not `wc/v3`.
4. Cache catalog reads. Invalidate that cache when price or stock changes. Do not cache a cart response as if it were a public product.
5. Re-check the charged total on the server when checkout starts. The figure in React state is not the amount to capture.

Cache and cart boundaries are in [the cache notes](references/cache-and-cart.md). Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## Data split

| Data | Where it is read | Cache |
| --- | --- | --- |
| Product title, price, stock, images | Server component or a route handler | Public cache with a tag such as `product:<id>` |
| Cart and checkout session | Server route that forwards the shopper's cart token | Do not use the public product cache |
| Admin writes | Server only, with the admin credential | Do not expose the route to the browser without your own auth |

Call `revalidateTag('product:<id>')` or `revalidatePath` from the server path that handles the catalog webhook. A client component cannot import `next/cache` revalidation and run it in the browser.

## WooCommerce storefront

- Product pages may use a read-only integration on the server. Prefer a key that cannot write, or a public product endpoint your store already exposes.
- Cart requests send the `Cart-Token` the Store API returned. Store that token in an HTTP-only cookie set by your server route, not in `localStorage`, if the token would let someone else modify the cart.
- The browser calls your Next.js route. Your route calls WooCommerce. Do not point the browser at `wc/v3` with a consumer secret.

## Shopify storefront

- Use the Storefront API for product and cart reads. The Storefront access token is still a secret if it can create checkouts. Follow the token type Shopify documents for that API.
- Do not send the Admin API token to the browser.

## Rendering

- Format money with the storefront locale on the server so the HTML and the JSON-LD match. Persian digits belong in visible text, not in the amount you post to checkout. See the RTL skill.
- Variant selection updates the visible price to that variant before add-to-cart.
- Out-of-stock variants stay disabled even if a cached page is briefly stale. The add-to-cart route checks stock again.

## Gotchas

- `cache: 'force-cache'` on a cart GET will show one shopper another shopper's cart if the URL does not vary. Do not cache cart responses on a shared key.
- A webhook that updates stock must revalidate the product tag. Restarting the Next.js process is not an invalidation strategy.
- Client-side `fetch` to a route that embeds the admin secret in the response will leak it into the browser. Return only the fields the UI needs.
- Draft-mode or preview cookies should not be cached as public product HTML.

## Verification

- The built HTML for a product contains the price without requiring client JavaScript.
- Searching the client bundle finds no consumer secret and no Admin API token.
- Updating a price and delivering the catalog webhook changes the next product response without a redeploy.
- Two browsers do not share a cart token.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
