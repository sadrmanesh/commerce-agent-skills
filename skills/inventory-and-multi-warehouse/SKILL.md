---
name: inventory-and-multi-warehouse
description: "Track stock per location with on-hand, reserved, and available quantities, reserve at checkout, and allocate orders across warehouses without overselling. Use when adding warehouses or stores as stock locations, reservations, transfers, or order routing."
license: MIT
compatibility: "The allocation checker needs Node.js 20 or newer and no packages."
metadata:
  author: Naser Sadrmanesh
  version: "0.3.2"
---

# Inventory and multi-warehouse

A single stock number per product stops working once there are two places that ship, or a checkout that holds stock while the shopper pays. Model quantities per location and per state, and change them only through movements. Platform notes are in [the platform notes](references/platforms.md).

## Procedure

1. Key stock by purchasable unit (SKU or variation) **and** location. A product with sizes has one row per size per location.
2. Keep separate quantities: `on_hand` (physically there), `reserved` (held for unpaid or unshipped orders), and `available = on_hand - reserved - safety_stock`. Sell only from `available`.
3. Change stock only by writing a movement row: receipt, sale reservation, release, shipment, return, adjustment, or transfer. The current quantity is the sum of movements, or a cached total updated in the same transaction.
4. Reserve at order creation with a conditional update, such as `UPDATE stock SET reserved = reserved + :qty WHERE sku = :sku AND location = :loc AND on_hand - reserved - safety_stock >= :qty`. Zero rows updated means not enough stock.
5. Give each reservation an expiry. Release it when payment fails or the hold expires. Convert it to a shipment when the order ships.
6. Allocate an order to locations with an explicit policy, then reserve at those locations. Store the allocation on the order lines.

## Allocation

A common policy, in order:

1. Only locations that can ship to the destination and are active.
2. One location that can fill every line, the closest or cheapest first.
3. Otherwise split by line across the fewest locations.
4. Otherwise back-order or reject the line, as the store policy says. Never reserve more than `available`.

Run `node scripts/allocate-stock.mjs order.json stock.json` to test a policy on sample data. It returns the allocation per line and any shortfall, and never allocates more than a location has available.

## Transfers

A transfer is two movements: out of the source when it ships, and into the destination when it is received. Stock in transit is in neither `available` figure. Record `incoming` at the destination if buyers need to see it.

## Counts and adjustments

A stock count writes an adjustment movement for the difference, with a reason and the user. Do not overwrite `on_hand` directly, or the history and any reservations made during the count are lost.

## Gotchas

- Reading available stock and then writing it in a second statement oversells under load. Check and reserve in one conditional update or a row lock.
- Decrementing `on_hand` at checkout and again at shipment counts the sale twice. Reserve at checkout, then move reserved to shipped.
- A parent product's total is not a sellable quantity. Sell from the variation's row.
- Safety stock that is not subtracted from `available` lets the last units sell online while the store floor still shows them.
- Returns go back into stock only after inspection. Use a separate location or state such as `quality_control` until then.

## Verification

- Two concurrent checkouts for the last unit: one reserves, the other is refused.
- An expired unpaid reservation returns its quantity to `available`.
- An order for two lines that one warehouse can fill is not split.
- A transfer in transit does not appear as available at either location.
- The movement log sums to the current `on_hand` for every SKU and location.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
