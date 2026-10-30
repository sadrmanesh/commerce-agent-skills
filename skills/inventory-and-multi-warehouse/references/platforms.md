# Platform notes

## WooCommerce

WooCommerce core keeps one `stock_quantity` per product or variation, with `manage_stock` and `stock_status`. A variation with `manage_stock` set to `parent` uses the parent's quantity. Core has no locations. Multi-location stock comes from an extension or an external inventory system that writes the summed `available` back to WooCommerce.

- Core reduces stock when an order is paid or moves to processing, completed, or on hold. During checkout it reserves stock for pending orders, and the **Hold stock** setting cancels unpaid pending orders after that many minutes.
- When an external system is the source of truth, turn off core stock reduction for those products or the store will reduce twice.
- Write stock through the REST API `products/{id}` or `products/{id}/variations/{id}` with `stock_quantity`, or the batch endpoint for many items.

## Shopify

Shopify tracks quantities per inventory item per location with named states, including `available`, `committed`, `incoming`, `on_hand`, and `reserved`. Change them with the Admin GraphQL inventory mutations, such as `inventoryAdjustQuantities` for deltas, and give every change a reason. Fulfillment orders assign order lines to locations, and a merchant can move them.

## Your own system

A minimal schema:

```sql
CREATE TABLE stock_levels (
  sku TEXT NOT NULL,
  location_id TEXT NOT NULL,
  on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  safety_stock INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (sku, location_id)
);

CREATE TABLE stock_movements (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT NOT NULL,
  location_id TEXT NOT NULL,
  kind TEXT NOT NULL,          -- receipt, reserve, release, ship, return, adjust, transfer_out, transfer_in
  quantity INTEGER NOT NULL,   -- signed
  reference TEXT,              -- order, transfer, or count id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Update `stock_levels` and insert the movement in one transaction.
