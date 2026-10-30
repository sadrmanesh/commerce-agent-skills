# Conversion event tracking

- Use the event names `view_item`, `add_to_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`, and `refund`.
- Send `items` with a stable `item_id` for the purchasable unit.
- Set `value` to the sum of item price times quantity. Exclude tax and shipping. Send those as their own purchase fields.
- Require an ISO currency whenever `value` is set.
- Fire `purchase` only after payment is confirmed. `transaction_id` is the order number and must be non-empty.
- Reuse that `transaction_id` on reload and on `refund`. Do not mint a new id per page view.
- Do not put customer name, email, or phone on the event.
- Follow the shop's consent settings before loading advertising tags.
- Run `scripts/check-event.mjs` on the payload. It does not call an analytics service.
