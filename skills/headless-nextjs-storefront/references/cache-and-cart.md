# Cache and cart boundaries

## Product cache

Tag each product fetch with a stable id:

```js
const response = await fetch(productUrl, {
  next: { tags: [`product:${id}`] },
});
```

The exact `fetch` cache options depend on the installed Next.js version. Read that version's data-cache docs before copying the option names. The rule that does not change: a public product response may be cached; a cart response may not share that cache entry.

Invalidate from a server route that has already verified the catalog webhook:

```js
import { revalidateTag } from "next/cache";

revalidateTag(`product:${id}`);
```

Revalidate the parent and each variant tag when a variable product changes. Revalidating only the parent leaves a variant URL stale.

## Cart route

```text
Browser -> Next.js route -> Store API
                |                |
         HTTP-only cart cookie   Cart-Token header
```

The route reads the cookie, calls the Store API, and returns the cart JSON the UI needs: lines, totals, and messages. It does not return the commerce admin credential.

Set the cookie with `HttpOnly`, `Secure`, and `SameSite=Lax` (or `Strict` if your checkout flow stays on the same site). `SameSite=None` requires `Secure` and is only for a checkout that is actually cross-site.

## Checkout handoff

When the shopper pays, create or update the order on the server and pass the server-calculated total to the payment skill. If the Store API total and your cached product prices disagree, trust the cart or order total from the commerce server for the charge, then revalidate the product.
