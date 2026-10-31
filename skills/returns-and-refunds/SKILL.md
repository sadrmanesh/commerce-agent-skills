---
name: returns-and-refunds
description: "Run returns as a tracked RMA from request to inspection, refund only what the policy and payment allow, and restock only inspected items. Use when building a returns portal, refund rules, exchanges, store credit, or restocking after a return."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.2"
---

# Returns and refunds

A return is a small workflow with its own record, not a status on the order. Keep the return, the refund, and the stock movement separate, and link them. Statuses and the refund calculation are in [the RMA notes](references/rma-states.md).

## Procedure

1. Create a return record (an RMA) with the order, the lines and quantities, the reason, and the requested outcome: refund, exchange, or store credit.
2. Check eligibility on the server: the return window from the delivery date, the product's returnable flag, quantities not already returned, and final-sale items.
3. Approve or reject with a reason. Approval issues return instructions or a label.
4. When the parcel arrives, inspect each line and record the condition: resellable, damaged, or missing.
5. Refund from the inspection result, not from the request. Use the refund calculation in the notes.
6. Restock only resellable units, as a `return` stock movement. Damaged units go to a separate location or are written off.
7. Close the return. The order shows refunded amounts and return history but keeps its original lines.

## Refunding

- Refund through the original payment method, using the gateway's refund API and an idempotency key per refund. Store the provider refund id.
- The total refunded on an order can never exceed what was captured. Check the sum of earlier refunds first.
- Refund tax in proportion to the refunded lines. Refund shipping only when the policy says so, such as for a wrong or damaged item.
- A partial refund leaves the order paid for the rest. Use the platform's refunded status only when everything is refunded.
- Store credit is a liability. Record it in a ledger with an expiry if the law allows one, not as a negative order.
- In WooCommerce, create refunds with `wc_create_refund()` or `POST /wp-json/wc/v3/orders/{id}/refunds`. Set `api_refund` to `true` only when the gateway should return the money; otherwise it is a manual refund record.

## Exchanges

An exchange is a return plus a new order for the replacement, linked to the return. Reserve the replacement when the exchange is approved so it does not sell out while the parcel is in transit. Charge or refund the price difference on the new order.

## Gotchas

- Restocking at approval puts units that never come back, or come back broken, on sale.
- Refunding at request time pays out for parcels that never arrive.
- A refund that is created only in the payment provider's dashboard leaves the shop showing the order as fully paid. Import provider refunds by webhook.
- Two staff members refunding the same line at once can exceed the captured amount. Lock the order or check the refund total inside the transaction.
- Some laws give a minimum withdrawal period for distance sales, such as 14 days in the EU. The store's window cannot be shorter for those customers.

## Verification

- A return outside the window is refused with the reason shown.
- A line cannot be returned twice beyond its purchased quantity.
- A damaged unit is refunded per policy but not added to sellable stock.
- The sum of refunds never exceeds the captured amount, even with two concurrent requests.
- A partial refund leaves the order paid, with the refunded amount shown.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
