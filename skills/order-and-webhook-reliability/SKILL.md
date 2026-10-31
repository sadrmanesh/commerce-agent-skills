---
name: order-and-webhook-reliability
description: "Accept order and payment webhooks with a raw-body signature check, durable deduplication, and reconciliation against the source of truth. Use when handling order events, payment notifications, or outbound webhook delivery."
license: MIT
compatibility: "The signature checker requires Node.js 20 or newer. No network access."
metadata:
  author: Naser Sadrmanesh
  version: "0.3.2"
---

# Order and webhook reliability

Use this skill for inbound payment or order notifications and for outbound webhooks your shop sends. Provider-specific state mapping stays in the payment skill. WooCommerce header names and the failure limit are in [the WooCommerce webhook notes](references/woocommerce-webhooks.md).

Verify a WooCommerce signature locally with [`scripts/verify-hmac-signature.mjs`](scripts/verify-hmac-signature.mjs).

## Procedure

1. Read the raw body before any JSON parser reorders or re-encodes it.
2. Verify the signature with a constant-time compare. Reject unsigned or invalid requests before you look at the event type.
3. Store the event in a durable inbox, unique on the provider event id when that id is stable across retries.
4. Acknowledge with 2xx only after that store succeeds. Do the order update after the store, in the same transaction when you can, or in a worker that can retry.
5. Apply the change only if this event is newer than what you stored, or if the fetched resource still matches the event.
6. When the event is incomplete or out of order, fetch the order or payment from the source of truth and write that.

## Inbox

A practical unique key:

- Provider event id, when the provider reuses it for retries of the same event.
- Otherwise a hash of topic, resource id, and the resource's `date_modified_gmt` or equivalent version.

Do not dedupe only on a delivery attempt id. Those change when the sender times out and posts again.

Store: event id, topic, resource id, raw body, signature verification time, and processing status (`stored`, `applied`, `ignored`). Ignore a duplicate by returning 2xx and the original result. A second apply is a bug.

The most common duplicate is a redelivery after a timeout. The handler stored and applied the event, but the sender timed out before the 2xx arrived and posts the same event again, often with a new delivery id. The retry must find the inbox row already `applied`, return 2xx, and run no side effect: no second fulfillment, no second confirmation email, no second stock decrement. This only holds when each side effect is recorded in the same transaction that marks the row `applied`, or is keyed on the event id where it runs.

## Apply rules

- Compare amounts in integer minor units before marking an order paid.
- Do not move an order backward because a late `pending` event arrived after `paid`, unless the source fetch shows the payment was reversed.
- Record the provider payment id on the first paid transition. The paid transition itself is idempotent.
- Outbound side effects (email, stock, fulfillment) run inside that same idempotent transition, not in the HTTP handler after a commit you might repeat.

## Outbound webhooks

When your shop sends webhooks:

- Sign the exact bytes you send.
- Include your event id and the resource version.
- Retry with backoff on connection failures and 5xx. Stop on a 4xx that means the subscription is invalid.
- Use an outbox row written in the same transaction as the order change. A webhook built only in memory is lost when the process dies after the order commit.
- Receivers will see duplicates and gaps. Document the event id so they can dedupe.

## Failures

- Invalid signature: 401 or 403, and do not store the body as a trusted event. You may log the rejection id.
- Unknown resource: 200 after you record the event as ignored, or 404 if the provider treats 404 as "do not retry" and you are sure the resource will never exist. Prefer recording it and fetching. A retry storm from a 500 is worse than an ignored row you can inspect.
- Database down: 503 so the sender retries. The unique key makes the retry safe.
- Handler bug after a durable store: leave the row unapplied and retry the worker. Do not ask the sender to redeliver once you have the bytes, unless you failed to store them.

## WooCommerce receivers

WooCommerce signs `base64(hmac_sha256(secret, raw_body))`. The secret is passed through `wp_specialchars_decode( $secret, ENT_QUOTES )` before the MAC. `decodeWebhookSecret()` in the checker matches that decode.

```bash
WEBHOOK_SECRET="..." node scripts/verify-hmac-signature.mjs \
  --body payload.json \
  --signature "$SIGNATURE"
```

You can pass `--secret-file` instead of the environment variable. The checker does not print the secret.

`X-WC-Webhook-Delivery-ID` is a new log id per attempt. Dedupe on the resource id plus `date_modified_gmt` and the topic, then fetch `/wp-json/wc/v3/orders/<id>` if the payload is not enough.

The activation ping is not an order event. Return 2xx and do not create an order.

WooCommerce counts a delivery as failed when the status is outside `2xx`, `301`, and `302`. After more than five consecutive failures it disables the webhook. The threshold filter is `woocommerce_max_webhook_delivery_failures` (default 5). `WC_Webhook::deliver()` posts with redirects disabled, so a 301 does not mean the JSON was delivered to the next URL. Answer on the registered URL.

There is no separate backoff retry of one payload described here. Timeouts and repeated order saves still deliver more than once. Handle duplicates anyway.

## Gotchas

- Parsing JSON and signing `JSON.stringify(object)` will not match. The sender signed the original bytes, including key order and spacing.
- Returning 200 before the inbox write loses the event if the process dies.
- A slow handler that applies the event and sends the email before answering invites a timeout, and the redelivery sends the email again unless the email is tied to the `applied` row.
- Applying events in arrival order without a version can reopen a canceled order.
- Logging the raw body of a payment webhook can capture data you did not mean to keep. Store the body in the inbox with restricted access, and keep card data out of application logs.
- A shared webhook secret across shops makes a signature from shop A valid on shop B. Use one secret per subscription.

## Verification

- The checker accepts a known body and secret and rejects a one-byte change.
- A duplicated delivery creates one inbox row and one state change.
- A redelivery after a sender timeout, where the first attempt was stored and applied but the 2xx never arrived, returns 2xx and repeats no side effect: one fulfillment, one email, one stock decrement.
- An older event received after a newer one does not downgrade a paid order.
- A wrong amount does not mark the order paid.
- Stopping the database makes the handler return a retryable status and, after recovery, the redelivered event still applies once.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
