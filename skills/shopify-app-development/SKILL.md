---
name: shopify-app-development
description: "Build a Shopify app with the configured Admin API version, session-token auth for embedded admin requests, and HMAC-verified webhooks. Use when creating or changing a Shopify app, Admin GraphQL call, app proxy, or Shopify webhook handler."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.1"
---

# Shopify app development

Use this skill for a Shopify app. Payment capture inside a shop you own is the payment skill. Webhook durability is the order and webhook skill. Storefront browsing without an admin token is the headless storefront skill.

Shopify's developer docs are the source for request authentication and webhook delivery. Re-check them when an API version or header name is load-bearing. This skill records the contracts those docs describe.

## Procedure

1. Keep app configuration in `shopify.app.toml`, including the API version and app-specific webhook subscriptions. Do not hard-code an API version in a handler. The `X-Shopify-API-Version` header says which version serialized that delivery, and the app configuration selects it.
2. Authenticate every request before using a shop domain from the query, body, or header.
3. Call the GraphQL Admin API for new admin work. Do not start a new REST Admin API client.
4. Ask for the narrowest access scopes the mutation needs.
5. Verify HTTPS webhooks with the app client secret over the raw body, then dedupe on `X-Shopify-Webhook-Id`.

Header and auth details are in [the webhook and auth notes](references/auth-and-webhooks.md). Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## Which credential

| Request | Proof |
| --- | --- |
| Embedded app in the Shopify admin | Session token (ID token) validated for signature, expiry, audience, and destination. |
| HTTPS webhook | HMAC-SHA256 of the raw body, Base64, in `X-Shopify-Hmac-Sha256`, keyed with the app client secret. Compare header names case-insensitively. |
| App proxy from a storefront | App proxy signature. It proves the shop, not the person. Do not change shop settings from an app proxy route. |
| Checkout or customer-account UI extension | That extension's session token. |
| Browser call that skips the app proxy | Anonymous. It may read public data. It must not mutate the shop. |

Reject a request that fails its check. Do not fall back to a `shop` parameter.

## Webhooks

Compute Base64 HMAC-SHA256 over the raw body with the client secret. If a JSON parser runs first, the signature will not match. Return 401 when the signature does not match.

`X-Shopify-Webhook-Id` identifies one delivery. Store it and skip a repeat. `X-Shopify-Event-Id` is shared by deliveries from the same merchant action and is not a substitute for the delivery id when you are deduping retries of one POST.

Topic and shop-domain headers are untrusted until the HMAC matches. App-specific subscriptions in `shopify.app.toml` are kept in sync by Shopify. Use `webhookSubscriptionCreate` when the subscription has to be shop-specific. You cannot set the webhook API version on that mutation; it follows the app's webhook API version.

After the app client secret rotates, Shopify can keep signing with the previous secret for up to an hour. Accept that window only if you still have the previous secret stored for verification.

Google Cloud Pub/Sub and Amazon EventBridge deliveries do not use this HMAC header. Do not pretend an HTTPS verifier applies to those transports.

## Admin writes

- Send the shop domain you got from the verified token, not from a form field.
- Treat Admin GraphQL user errors and top-level errors as separate. A 200 response can still contain `userErrors`.
- Write webhooks and billing changes so a second delivery does not create a second subscription or a second charge.
- Do not log the access token, the client secret, or the raw HMAC.

## Gotchas

- `express.json()` before verification replaces the raw body. Capture the bytes first.
- A shop domain check must be anchored. `example.myshopify.com.attacker.example` is not a shop domain.
- OAuth `state` has to be bound to the browser that started the install and checked on return.
- Scopes are not implied by installation. A missing scope is a failed call, not a reason to use a broader token you stored earlier.

## Verification

- A webhook with a changed byte returns 401 and writes nothing.
- The same `X-Shopify-Webhook-Id` applied twice creates one record.
- An embedded request with no valid session token does not run a mutation.
- An app proxy request cannot change shop settings.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
