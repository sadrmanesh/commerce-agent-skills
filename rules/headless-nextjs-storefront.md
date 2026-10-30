# Headless Next.js storefront

- Render catalog price and availability in server HTML. Do not require client JavaScript for the price a crawler should see.
- Keep WooCommerce consumer secrets and Shopify Admin tokens in server environment variables. Do not import them from a client component.
- Use the public storefront API for carts. WooCommerce carts use the Store API, not `wc/v3`.
- Store the cart token in an HTTP-only cookie set by a Next.js route. Do not put it in `localStorage` when possession of the token changes the cart.
- Cache product fetches with a product tag. Do not cache cart responses on a shared public key.
- Revalidate the product tag from the server when a verified catalog webhook reports a price or stock change.
- Charge the total returned by the commerce server at checkout, not a total held only in React state.
- Format visible money for the locale, and keep machine amounts in ASCII on the request you send to payment.
