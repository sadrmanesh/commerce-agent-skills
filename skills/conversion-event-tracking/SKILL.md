---
name: conversion-event-tracking
description: "Send commerce analytics events with stable names, item ids, and a purchase event that fires once from a confirmed order. Use when adding or changing view_item, add_to_cart, begin_checkout, purchase, or refund tracking."
license: MIT
compatibility: "The event checker requires Node.js 20 or newer. No network access."
metadata:
  author: Naser Sadrmanesh
  version: "0.2.0"
---

# Conversion event tracking

Use this skill for measurement events. Checkout behavior is the checkout skill. Firing `purchase` before the payment skill confirms the order will count money you did not take.

Event names and parameter rules below follow Google's GA4 recommended ecommerce events. Other analytics tools should use the same payload shape in this project so there is one server-side record. Re-check GA4's event reference if a report disagrees with a parameter.

## Procedure

1. Use the recommended names: `view_item`, `add_to_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`, and `refund`.
2. Send `items` with `item_id` (the SKU or stable unit id) and `item_name`. Include `price` and `quantity` when you send `value`.
3. Set `value` to the sum of `price * quantity`. Do not include shipping or tax in `value`. Send those as `shipping` and `tax` on `purchase`.
4. If `value` is set, set `currency` to the order's ISO 4217 code.
5. Fire `purchase` once, from the server-confirmed payment, with a non-empty `transaction_id` equal to the order number.
6. Respect the shop's consent settings before loading advertising tags. Do not describe that as a universal legal rule. The shop's policy decides where consent is required.

Parameter checks are in [the event notes](references/events.md). Run `node scripts/check-event.mjs --file event.json`. Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## Purchase

`transaction_id` is required for `purchase`. GA4 deduplicates purchases that share a transaction id on web streams. An empty string is a bad id: Google documents that purchases with `transaction_id=""` are deduplicated together. Never send an empty id.

The thank-you page may render the event only if a reload will send the same `transaction_id`. Prefer sending `purchase` from the server when payment is confirmed, and treat the browser event as a duplicate of that id rather than a second order.

`value` excludes tax and shipping. A 10.00 item, 1.00 tax, and 2.00 shipping is `value: 10`, `tax: 1`, `shipping: 2`, not `value: 13`.

## Items

- `item_id` is the purchasable unit, not only the parent, when variants have different prices.
- `quantity` is an integer greater than zero for a purchase line.
- Do not put the customer's name, email, or phone on the item or the event.

## Consent and duplicates

- If the shop requires consent for advertising measurement, do not load those tags before the choice is stored.
- Order-state analytics the merchant runs on their own server can still record the paid order. Keep that separate from a browser advertising tag.
- `refund` uses the same `transaction_id` as the purchase and the refunded `items` or value. Do not reuse a purchase event to mean a refund.

## Gotchas

- Firing `purchase` on button click counts failed payments.
- A new transaction id on every page load defeats deduplication and over-counts.
- Summing tax into `value` overstates item revenue in GA4's definition.
- Debug views that use a constant transaction id will collapse real orders together if that code ships.

## Verification

- The checker accepts a purchase whose `value` equals the item sum and rejects a purchase with an empty `transaction_id`.
- A declined payment does not emit `purchase`.
- Reloading the confirmation page does not create a second transaction id.
- Item ids on variant products are variant SKUs.
