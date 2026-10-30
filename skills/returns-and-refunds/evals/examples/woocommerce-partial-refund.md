Send `POST /wp-json/wc/v3/orders/{id}/refunds` with the `line_items` entry for that line, its `refund_total` and `refund_tax`, the summed `amount`, and `api_refund: true` so the gateway returns the money.

This is a partial refund. WooCommerce keeps the order processing or completed and shows the refunded amount. Check that earlier refunds plus this one do not exceed the order total before you send it.
