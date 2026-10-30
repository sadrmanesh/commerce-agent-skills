---
name: checkout-ux-and-conversion
description: "Design checkout so the full cost is visible before payment, guest purchase works, and field or payment errors can be corrected without losing the cart. Use when changing the checkout flow, address form, payment choice, or order confirmation page."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.0"
---

# Checkout UX and conversion

Use this skill when changing the checkout a shopper sees. Payment capture rules live in the payment skill. Persian and RTL layout lives in the localization skill. Field-level review questions are in [the checkout review](references/checkout-review.md).

This skill does not claim a conversion rate. It states conditions the checkout has to meet so a shopper can finish an order they already decided to place.

## Procedure

1. Show merchandise, discounts, shipping, tax, and the amount that will be charged before the pay control.
2. Allow a guest purchase. Offer account creation after the order, or as an optional choice that does not block payment.
3. Validate fields inline, next to the field, in the shopper's language. Move focus to the first error.
4. Keep the cart and the entered address when payment is declined.
5. Disable the pay control after the first accepted submit, and make the order request idempotent so a double submit creates one order.
6. Confirm with an order number and a plain statement of what was charged. Do not offer a second pay control on that page.

## Cost

- Shipping method and shipping cost are chosen before payment. If the address changes the cost, update the total before the shopper pays.
- A fee or payment surcharge is a line in the total, not a surprise on the provider's page.
- The currency is visible. If you display a second currency, the charged currency is the one in the pay button label.
- Coupon entry does not clear the address or the selected shipping method.

## Address and contact

- Ask for the fields the order needs. Drop a field rather than marking it optional and ignoring it.
- Use autocomplete attributes from the HTML specification: `given-name`, `family-name`, `address-line1`, `address-line2`, `address-level1`, `address-level2`, `postal-code`, `country`, `email`, `tel`.
- Set input types: `email`, `tel`, and an appropriate keyboard for the postal code. Do not force a North American phone mask on other countries.
- When the country changes which fields are required, update the form before submit. WooCommerce does this through country locale settings. Do not keep a second hard-coded field list that disagrees with `woocommerce_get_country_locale`.
- The country control comes before fields whose labels and requirements depend on it.

## Payment choice

- List only methods the shop can capture and refund.
- Each method shows its name and, when it adds a cost, that cost.
- Card entry uses the provider's hosted fields or a redirect. The merchant page does not collect PAN or CVV.
- The primary control states the action and the amount, for example "Pay 19.00 USD". A generic "Submit" is not enough when more than one control is on the page.
- Express wallets, when you offer them, create the same server-side order and idempotency path as the regular form.

## Errors

- Field errors name the field and how to fix it. Do not rely on color alone.
- A payment decline says that the payment was not taken and that the shopper can try another method. Do not say the order was placed.
- A network timeout says the outcome is unknown and points to the order status or a retrieve. Do not immediately start a second charge. Reuse the same idempotency key.
- Keep the shopper's typed values. Re-render the form with those values and the error.

## Confirmation

- Show the order number, the charged total, and the shipping destination.
- Send the receipt email once, from the paid transition, not from the browser page load.
- A reload of the confirmation page does not place another order.

## Mobile and accessibility

- One column when the viewport is narrow. The total stays visible near the pay control.
- Tap targets are large enough to hit without zooming. Error text is not only a tooltip.
- Every control has a label. Errors use `aria-invalid` and are referenced from the field.
- Focus order follows the visual order, including in RTL layouts.

## Gotchas

- Hiding shipping cost until after the pay button is the usual reason a shopper abandons at the last step. Show it earlier.
- Creating the account, and requiring the shopper to leave checkout to verify email, loses the order in progress. Save the order first.
- A pay button that stays enabled can create two pending orders. Disable it and dedupe on the server.
- Validation that only runs in the browser will be skipped. Repeat every rule on the server.
- Third-party badge images do not replace a real returns or shipping policy link.

## Verification

- A guest can pay without creating a password.
- Changing the address updates shipping and the pay-button amount before payment.
- A declined payment preserves the cart and the address.
- Submitting twice creates one order and charges once.
- Keyboard-only use reaches every field, the error, and the pay control. In a narrow viewport the total is still visible with the pay control.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
