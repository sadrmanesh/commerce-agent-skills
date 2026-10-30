# Checkout UX and conversion

- Show shipping, tax, discounts, and the charged total before the pay control. Update that total when the address or shipping method changes.
- Allow guest checkout unless the shop has a written reason not to. Do not force account creation before payment.
- Validate on the server. Show field errors next to the fields and move focus to the first error.
- Keep the cart and the typed address when a payment is declined.
- Make submit idempotent and disable the pay control after the first accepted click.
- Label the pay control with the action, amount, and currency.
- Collect card data only in the provider's hosted fields or redirect.
- Use HTML autocomplete attributes and input types that match the country. Do not force another country's phone or postal-code mask.
- Confirm with an order number. A reload of the confirmation page must not create or charge an order.
- Repeat every check in a narrow viewport and with a keyboard. RTL layouts follow the document direction.
