---
name: iranian-payment-gateways
description: "Integrate Zarinpal and other Shaparak redirect gateways with a server-side verify call, Rial and Toman amounts, and one paid transition per authority. Use when adding an Iranian payment gateway or fixing callback, verify, or amount handling for IRR or IRT stores."
license: MIT
compatibility: "The verify checker needs Node.js 20 or newer and no packages."
metadata:
  author: Naser Sadrmanesh
  version: "0.3.0"
---

# Iranian payment gateways

Iranian card payments run through Shaparak, the national card switch, behind a payment facilitator or bank gateway such as Zarinpal. They share one flow: request a token, redirect the shopper, receive a callback, and **verify** on the server. Zarinpal request and verify fields are in [the Zarinpal notes](references/zarinpal-v4.md). The general rules in the payment gateway skill still apply.

## Procedure

1. Create the shop order first, unpaid, with the total in the store currency.
2. Convert the total to the unit the gateway expects. Zarinpal accepts `currency` `IRR` (Rial) or `IRT` (Toman). Bank gateways usually take Rial only. One Toman is ten Rial.
3. Send the request call from the server with `merchant_id`, `amount`, `callback_url`, `description`, and the order id in `metadata`. Store the returned `authority` on the order before redirecting.
4. Redirect to the gateway's start page, for Zarinpal `https://payment.zarinpal.com/pg/StartPay/{authority}`.
5. On the callback, look up the order by `Authority`. If `Status` is `NOK`, the payment failed or was canceled: keep the order unpaid.
6. If `Status` is `OK`, call verify from the server with the same `amount` and `authority`. The callback query is not proof of payment.
7. Mark the order paid only when verify returns success, and store `ref_id`, the masked `card_pan`, and the gateway fee.

## Verify results

| Verify `code` | Meaning | Shop effect |
| --- | --- | --- |
| `100` | Verified now | Mark paid once. Show `ref_id` to the shopper. |
| `101` | Already verified earlier | Paid. Do not send a second receipt or reduce stock again. |
| Any other code | Not verified | Leave unpaid and show the gateway message. |

Run `node scripts/check-verify.mjs order.json verify.json` to see what a stored order and a verify response mean together. It flags a mismatched amount, a mismatched authority, and the codes above.

## Amounts and currency

- Store `IRR` or `IRT` on the order and convert in one function. A store priced in Toman that sends Toman to a Rial-only gateway charges a tenth of the price.
- Amounts are whole numbers. Reject a fractional amount instead of rounding it silently.
- Send the same `amount` and unit in request and verify. Verify fails when they differ.
- Show prices in the store's unit with Persian digits if the storefront is Persian, but keep Latin digits in API calls.

## Unverified payments

If the shopper pays but your server never verifies (a closed tab, a timeout, a crash), Shaparak gateways return the money to the payer after a window the provider sets. Run a job that lists unverified authorities for recent unpaid orders and verifies them, so a paid shopper is not refunded by mistake. Zarinpal offers an unverified transactions call for this.

## Gotchas

- Verifying in the browser exposes `merchant_id` and lets a shopper fake success. Verify only from the server.
- The callback URL can be opened twice: on a refresh, or by the shopper going back. The second verify returns `101`, so treat it as already paid, not as an error.
- Matching the callback by order id in the query string lets a shopper swap orders. Match by `Authority` from your own record.
- Some gateways reject callback URLs on a different domain from the registered site. Register the exact domain.
- Gateways often need an Iranian server IP or a whitelisted IP for API calls. A timeout from abroad is not a declined payment.

## Verification

- A callback with `Status=NOK` leaves the order unpaid and does not call verify.
- A callback with `Status=OK` but a verify code other than `100` or `101` leaves the order unpaid.
- Opening the callback URL twice sends one receipt.
- A Toman store sends `currency: "IRT"` to Zarinpal, or ten times the amount in Rial to a Rial-only gateway.
- An order paid without a callback is found and verified by the reconciliation job.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
