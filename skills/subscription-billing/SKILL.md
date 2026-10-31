---
name: subscription-billing
description: "Model subscription state, renewal charges, proration, and dunning without treating a renewal as a new one-time checkout. Use when adding or changing recurring billing, plan changes, cancellation, or failed renewal recovery."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.2"
---

# Subscription billing

Use this skill for recurring charges. The first payment still follows the payment skill. A renewal is another charge with its own idempotency key, not a replay of the checkout.

WooCommerce core does not include subscriptions. WooCommerce Subscriptions is a separate extension. Shopify subscriptions use selling plans. Use the product the store already runs. Do not invent a cron job that inserts orders with `wp_insert_post`.

## Procedure

1. Store the contract separately from any one invoice: customer, plan, quantity, currency, interval, current period start and end, and status.
2. Charge the initial invoice with the payment skill. Move the contract to `active` or `trialing` only after that payment is confirmed, unless the plan really has a trial with no charge.
3. When a period ends, create one renewal invoice and one charge. The idempotency key is the subscription id plus the period start.
4. On success, advance the period. On failure, follow the dunning schedule. Do not delete the entitlement on the first failure.
5. Cancel either at period end or immediately, and record which one the shopper chose. Prorate only when the plan change says to.

State transitions are in [the state notes](references/states.md). Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## Status

Use these statuses unless the platform already has its own set. Map the platform's names onto them in one function.

| Status | Meaning |
| --- | --- |
| `trialing` | Access is on. No charge yet, and a trial end is stored. |
| `active` | The latest renewal succeeded and the period end is in the future. |
| `past_due` | A renewal failed and retries remain. Access policy is explicit. |
| `paused` | The merchant or shopper paused billing. No renewal is attempted. |
| `canceled` | No further renewals. Access ends now or at the stored period end. |

Do not overload `active` to mean "card on file but the last charge failed".

## Renewals

- One renewal invoice per period. A retried charge uses the same idempotency key.
- The amount is the plan price at renewal time, plus tax from the tax skill, unless a scheduled price change says otherwise.
- Store the provider payment id on that invoice. A second webhook does not create a second invoice.
- Advance `current_period_end` only after the charge is confirmed.

## Changes and cancellation

- Upgrade or downgrade mid-period either waits until period end or prorates. Record the policy on the plan. Do not do both.
- Proration is a signed amount on an invoice: unused time credited, new time debited. It is not a silent edit of a paid invoice.
- Cancel at period end sets `cancel_at_period_end`. The status stays `active` until the period ends, then becomes `canceled`.
- Immediate cancel stops renewal and sets the entitlement end to now. Refund the unused time only if the policy says so, through the payment skill's refund path.

## Dunning

- Retry a failed renewal on a short written schedule, for example day 1, day 3, and day 7. Those days are a default to configure, not a measured optimum.
- After the last retry fails, set `canceled` or leave `past_due` with access off, according to the plan. Tell the shopper which one happened.
- A shopper who updates the payment method retries the open invoice. It does not open a second period.

## Gotchas

- Treating the webhook for the first payment as every renewal will extend the period on a retry.
- Billing today and also billing at period end double-charges the first cycle.
- Local midnight is not a period boundary. Store period ends in UTC.
- A paused subscription that still runs the renewal job will charge a shopper who asked to stop.

## Verification

- Two workers processing the same period create one invoice and one charge.
- A failed renewal does not advance `current_period_end`.
- Cancel at period end leaves access on until that timestamp and does not create another invoice.
- A plan change records proration as its own invoice lines.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
