# B2B pricing

- Resolve every B2B price on the server with one function shared by catalog, cart, and order.
- Model prices as price lists with currency, validity, groups or companies, and quantity tiers.
- Contract prices win when they exist. Otherwise apply one documented rule: lowest price or priority.
- Use the highest tier whose `minQuantity` the line meets. Show the next tier to the buyer.
- Enforce minimum quantities and order multiples in the cart.
- Never cache a group price page for everyone. Vary by group.
- Net terms need a credit limit check against open invoices.
- Store tax exemption evidence or the validated VAT id on the order.
- The price on a placed order line never changes when a list changes.
