# Shopify auth and webhooks

These notes follow Shopify's app authentication and webhook delivery docs. Header names are case-insensitive on the wire.

## HTTPS webhook headers

| Header | Use |
| --- | --- |
| `X-Shopify-Topic` | Topic, such as `products/update`. Untrusted until the HMAC matches. |
| `X-Shopify-Hmac-Sha256` | Base64 HMAC-SHA256 of the raw body using the app client secret. |
| `X-Shopify-Shop-Domain` | `myshopify.com` domain. Untrusted until the HMAC matches. |
| `X-Shopify-API-Version` | Version used to serialize the payload. |
| `X-Shopify-Webhook-Id` | Unique per delivery. Dedupe retries with this. |
| `X-Shopify-Triggered-At` | When Shopify triggered the delivery. |
| `X-Shopify-Event-Id` | Shared by deliveries from the same merchant action. |

Manual check:

```js
import { createHmac, timingSafeEqual } from "node:crypto";

export function shopifyWebhookValid(secret, rawBody, header) {
  const digest = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(String(header), "base64");
  if (digest.length !== received.length) {
    return false;
  }
  return timingSafeEqual(digest, received);
}
```

Compare the decoded digest bytes. A string compare of the Base64 text can disagree on padding. Reject when `header` is missing.

## Session tokens

For an embedded admin request, validate the ID token's signature, expiry, audience, and destination. The destination shop is the shop you may call. A `shop` query parameter is not that proof.

## App configuration

Prefer app-specific webhook subscriptions in `shopify.app.toml` when every install should receive the same topics. Use the Admin GraphQL `webhookSubscriptionCreate` mutation for a subscription that differs per shop. The webhook API version is the app's configured version in both cases.

## Shop domain

Accept a shop domain only when it matches a pattern anchored at both ends, such as a single label plus `.myshopify.com`. Do not use a substring or a suffix check that allows an extra domain on the right.
