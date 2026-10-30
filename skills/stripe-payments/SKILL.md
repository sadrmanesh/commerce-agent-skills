---
name: stripe-payments
description: "Take card and wallet payments with Stripe PaymentIntents or Checkout Sessions, idempotency keys, and signed webhooks that move the order to paid. Use when adding Stripe to a store, handling Stripe webhooks, or refunding through the Stripe API."
license: MIT
compatibility: "The signature checker needs Node.js 20 or newer and no packages."
metadata:
  author: Naser Sadrmanesh
  version: "0.3.0"
---

# Stripe payments

This skill applies the general rules in the payment gateway skill to Stripe. Event names, objects, and status values are in [the Stripe objects notes](references/stripe-objects.md).

## Procedure

1. Pick one integration per checkout. A **Checkout Session** is a Stripe-hosted page. A **PaymentIntent** with the Payment Element keeps the shopper on your page. Both keep card data on Stripe.
2. Create the shop order first, unpaid. Then create the PaymentIntent or Checkout Session on the server with the amount from the order, never from the browser.
3. Put the shop order id in `metadata` (`metadata[order_id]`) and send an `Idempotency-Key` header derived from the order and attempt, such as `order-1042-attempt-1`.
4. Return only the `client_secret` (PaymentIntent) or the session `url` (Checkout) to the browser. The secret key `sk_...` stays on the server.
5. Mark the order paid from a verified webhook: `payment_intent.succeeded` for PaymentIntents, or `checkout.session.completed` with `payment_status` equal to `paid` for Checkout.
6. Pin the API version for the account and the webhook endpoint, so a dashboard upgrade does not change payloads under you.

## Amounts

Stripe amounts are integers in the currency's smallest unit: `1999` is 19.99 USD. Zero-decimal currencies such as JPY are sent as the whole amount: `500` is 500 JPY. Compute the integer from the order total with the currency's exponent and compare the webhook's `amount_received` and `currency` with the order before marking it paid.

## Webhooks

- Read the raw body. A JSON parser that reformats the body breaks the signature.
- Verify the `Stripe-Signature` header with the endpoint secret `whsec_...`. The header has a timestamp `t` and one or more `v1` signatures. The signed payload is `t`, a dot, and the raw body, hashed with HMAC-SHA256 and hex encoded. Reject timestamps older than the tolerance, 300 seconds by default.
- Run `node scripts/verify-stripe-signature.mjs <body-file> "<Stripe-Signature header>"` with `STRIPE_WEBHOOK_SECRET` set to check a captured delivery.
- Store `event.id` in a table with a unique constraint before acting. Stripe can send the same event more than once, and out of order.
- Return `2xx` quickly after storing the event, then do slow work in a job.
- For events where order matters, retrieve the object (`GET /v1/payment_intents/{id}`) and act on its current status instead of the event's snapshot.

## Status

| PaymentIntent `status` | Shop effect |
| --- | --- |
| `requires_payment_method` | Unpaid. After a decline, the shopper can try again with the same intent. |
| `requires_action` | Unpaid. The shopper must finish 3-D Secure or a redirect. |
| `processing` | On hold. Bank debits and some wallets settle later. |
| `requires_capture` | Authorized only. Capture before the authorization expires, or release it. |
| `succeeded` | Paid. Store the latest charge id. |
| `canceled` | Cancel the order only if it is still unpaid. |

## Refunds and disputes

- Refund with `POST /v1/refunds` and `payment_intent`, plus `amount` for a partial refund. Send an idempotency key per refund attempt and store the refund id.
- A refund can stay `pending` and can later fail. Update the shop refund from `refund.updated` or `charge.refund.updated`, not from the create response alone.
- `charge.dispute.created` opens a dispute. Flag the order and collect evidence. Do not refund automatically, because a refund does not close a dispute.

## Gotchas

- Creating a new PaymentIntent on every checkout page load leaves many incomplete intents and can charge twice if two are confirmed. Reuse the intent stored on the order.
- Marking the order paid on the `return_url` page is wrong. The redirect arrives before, after, or without the webhook.
- Test-mode and live-mode keys, webhook secrets, and object ids are separate. A live event never verifies with the test secret.
- A `v1` signature compare with `==` leaks timing. Use a constant-time compare.
- Idempotency keys are kept for at least 24 hours. Reusing a key with different parameters returns an error, not a new payment.

## Verification

- A forged webhook, or a real one older than five minutes, is rejected with `400`.
- Delivering the same `payment_intent.succeeded` event twice sends one receipt and reduces stock once.
- A `payment_intent.succeeded` whose `amount_received` differs from the order total leaves the order unpaid and flags it.
- A Checkout Session with `payment_status` `unpaid` (a delayed bank method) does not mark the order paid until `checkout.session.async_payment_succeeded`.
- A partial refund through `POST /v1/refunds` leaves the order paid for the remainder.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
