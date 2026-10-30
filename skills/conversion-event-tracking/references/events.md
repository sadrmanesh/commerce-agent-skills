# Commerce events

Names follow GA4 recommended ecommerce events: `view_item`, `add_to_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`, `refund`.

## Purchase parameters

| Parameter | Rule |
| --- | --- |
| `transaction_id` | Required, non-empty, unique per order. Not an email and not an empty string. |
| `currency` | ISO 4217. Required when `value` is set. |
| `value` | Sum of `price * quantity` for `items`. Exclude `tax` and `shipping`. |
| `tax` | Optional number. Not included in `value`. |
| `shipping` | Optional number. Not included in `value`. |
| `items` | At least one item with `item_id` or `item_name`. |

GA4's event reference marks `value` and `currency` with conditions. This project requires them on `purchase` so revenue is not an unlabeled number. `view_item` may omit `value`. If it includes `value`, it includes `currency`.

## Checker

`scripts/check-event.mjs` reads:

```json
{
  "name": "purchase",
  "params": {
    "transaction_id": "1042",
    "currency": "USD",
    "value": 19.0,
    "tax": 0,
    "shipping": 0,
    "items": [{ "item_id": "SHIRT-BLUE", "item_name": "Cotton shirt", "price": 19.0, "quantity": 1 }]
  }
}
```

It checks the name, the items, the purchase id, and the value sum when every item has a numeric price and quantity. It does not call an analytics API.
