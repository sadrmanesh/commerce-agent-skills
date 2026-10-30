# Tax and shipping

- Take tax rates from the store's configuration or its tax service. Do not invent a percent in the theme or the client.
- Store each tax line with its rate id and amount. Do not recompute a historical order from today's rate table.
- Respect inclusive versus exclusive catalog prices. Do not mix them on one order.
- Match shipping zones from the destination. A missing zone is not a free rate. A configured zero cost is a free method.
- Recalculate tax and shipping on the server when the address or the cart changes, and show both before payment.
- Persist the chosen shipping method id and the quoted amount on the order.
- In WooCommerce, use `WC_Tax` and `WC_Shipping_Method`. Do not write a second rate table in JavaScript.
- Refund tax from the tax that was stored on the refunded lines.
