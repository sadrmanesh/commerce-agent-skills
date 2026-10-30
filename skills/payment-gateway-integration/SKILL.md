---
name: payment-gateway-integration
description: "Integrate a payment provider with idempotent charges, signature-checked webhooks, and an explicit map from provider states to order states. Use when adding or changing checkout payment, capture, refund, or payment notification handling."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.2.0"
---

# Payment gateway integration

Apply this skill to any provider: card acquirer, wallet, bank redirect, or buy-now-pay-later. The WooCommerce class layout is in [the WooCommerce gateway notes](references/woocommerce-gateway.md). Read it when the store runs WooCommerce. The webhook inbox, signature check, and retries are in the order and webhook skill.

## Procedure

1. Keep card entry on the provider. Use hosted fields, a redirect, or a native wallet. Do not post the PAN or CVV to the merchant server and do not store them. Taking card data on the merchant server changes the store's PCI scope.
2. Create the shop order before redirecting or confirming, with a status that means unpaid (`pending` or the platform's equivalent).
3. Send the charge with an idempotency key tied to that order and attempt. Reuse the key if the HTTP call times out. Generate a new key only when the shopper starts a new attempt.
4. Treat the browser return URL as a hint. Mark the order paid only from a signed server notification or from a server-side retrieve of the provider payment.
5. Compare amount and currency in minor units on the server. Reject a notification whose amount or currency does not match the order.
6. Record the provider payment id once. A second notification for the same payment id must not capture, email, or decrement stock again.
7. Map provider states through one table. Do not sprinkle status writes through the client and the webhook.

## State map

Use one function from provider event to shop transition.

| Provider observation | Shop effect |
| --- | --- |
| Authorized, not captured | Leave the order unpaid or set the platform's on-hold equivalent. Store the authorization id. |
| Captured or paid | Mark paid through the platform's payment-complete path. Store the capture id. |
| Pending asynchronous payment | On hold. Do not empty the cart until the policy says the order is accepted. |
| Declined or failed | Failed. Keep the cart so the shopper can retry. |
| Canceled by the shopper | Cancel only if the order is still unpaid. |
| Refunded, full or partial | Create a refund record for the amount. Do not only change the status string. |
| Chargeback or dispute opened | Record a dispute flag. Do not automatically refund unless the shop's policy says so. |

Unknown states are logged and left unchanged. Do not default an unknown state to paid.

## Idempotency

- The provider idempotency key is a stable string for one attempt, such as `order-{id}-attempt-{n}`.
- Persist `attempt -> provider payment id` before you depend on the response, or immediately after the first success, inside a unique constraint when the database allows it.
- The webhook uniqueness key is the provider event id when that id is stable across retries. A delivery attempt id that changes on every POST is not enough.
- If the notification arrives before your create call returns, the webhook must be able to find the order by the idempotency key or by metadata you sent to the provider.

## Amounts

Convert the shop total to integer minor units with the currency's exponent (`100` for a two-decimal currency, `1` for a zero-decimal currency). Read the exponent from the store or from the provider's currency table. Do not compare PHP floats.

Reject the notification when the paid minor units differ from the order total. A mismatch is an exception for a person, not an automatic partial capture, unless the product explicitly sells partial payments.

## Browser return

The return URL may include a payment id. Use it only to look up the provider payment from your server. Ignore `status=success` query parameters. A shopper, or a third party, can send those.

Show a pending confirmation when the webhook has not arrived yet. Poll your own order record, or retrieve the payment once from the provider. Do not poll the provider in a tight loop from the browser.

## Refunds

- Refund from the shop admin through the provider API. Do not ask staff to refund only in the provider dashboard unless the shop has a reconciliation job that pulls those refunds back.
- Send an idempotency key per refund attempt.
- Store the provider refund id on the shop refund record.
- A partial refund leaves the order paid for the remainder. A full refund uses the platform's refunded state after the provider confirms it.

## Secrets and logs

- Webhook secrets and API keys stay in the server environment.
- Log the order id, provider payment id, event id, and your decision. Do not log the PAN, CVV, full card number, or the webhook secret.
- Verify signatures on the raw request body before parsing. The order and webhook skill includes a WooCommerce HMAC checker. For other providers, follow that provider's documented MAC and compare with a constant-time compare.

## Gotchas

- Emptying the cart before the provider confirms payment loses the shopper's items when they abandon the redirect.
- Marking paid inside the browser return, and again in the webhook, sends two receipts and can reduce stock twice. The paid transition has to be idempotent.
- Trusting the amount in the client payload lets a modified request pay a different total than the order.
- A `200` to the provider means you stored the event, not that you have already fulfilled the order. Fulfillment can run after the response if the event is durable. A `4xx` for a signature failure is appropriate. A `5xx` asks the provider to retry, so the handler must tolerate a duplicate.
- Test the failed, canceled, and duplicate paths. A sandbox success charge is not coverage.

## Verification

- Two identical charge requests with the same idempotency key create one provider payment.
- A replayed signed webhook does not send a second receipt or reduce stock again.
- A signed webhook with the wrong amount does not mark the order paid.
- A forged browser return without a matching provider payment does not mark the order paid.
- A declined payment returns the shopper to checkout with the cart intact and the order not paid.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
