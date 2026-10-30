# RMA states and refund calculation

## States

| State | Next | Notes |
| --- | --- | --- |
| `requested` | `approved`, `rejected` | Created by the shopper or staff |
| `approved` | `in_transit`, `canceled` | Instructions or label issued. Reserve exchange items here. |
| `in_transit` | `received` | Carrier tracking attached |
| `received` | `inspected` | Parcel arrived |
| `inspected` | `refunded`, `exchanged`, `credited`, `rejected` | Condition recorded per line |
| `refunded`, `exchanged`, `credited`, `rejected`, `canceled` | none | Final |

Only move forward. Record who changed the state and when.

## Refund calculation

For each inspected line:

```text
line_refund = unit_price_paid * accepted_quantity
            - restocking_fee (if the policy has one and the item was not faulty)
tax_refund  = line_tax_paid * accepted_quantity / purchased_quantity
```

- `unit_price_paid` is after discounts. An order-level coupon is spread across lines in proportion to their price, the same way the order calculated it.
- Add shipping only for faulty or wrong items, or when the whole order is returned and the policy refunds shipping.
- Round each line in minor units, then add. Cap the total at `captured - already_refunded`.

## Records

| Record | Holds |
| --- | --- |
| Return | order id, lines, quantities, reason, state, outcome |
| Inspection | line, condition, notes, photos, inspector |
| Refund | amount, tax, shipping, provider refund id, status |
| Stock movement | `return` into a sellable or quarantine location |
