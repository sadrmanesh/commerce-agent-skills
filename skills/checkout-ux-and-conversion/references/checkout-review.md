# Checkout review

Walk a real order in the browser. Record pass or fail. Do not treat a screenshot of the empty form as a review.

## Before payment

- Guest checkout is available, or the shop has a written reason it is not.
- Line items, discounts, shipping, tax, and total match what the pay control will charge.
- The shipping method can be changed without retyping the address.
- A coupon or gift card failure leaves the rest of the form intact.
- The pay button names the amount and currency.

## Address

- Required fields match the selected country.
- Autocomplete attributes are set on contact and address fields.
- Phone and postal code inputs do not apply a mask from a different country.
- Error text is next to the field and is announced to assistive technology.

## Payment

- Only live, refundable methods are listed.
- Card data is entered in hosted fields or on the provider page.
- The first submit disables the pay control.
- A second submit does not create a second order.
- A decline keeps the cart.

## After payment

- The confirmation page shows the order number and the charged total.
- Reloading confirmation does not charge again.
- The receipt email is sent once.
- The order is unpaid until the payment skill's server-side confirmation runs. The confirmation page does not itself mark the order paid.

## RTL

- Totals align to the correct side for the document direction.
- The pay control is in the focus order a shopper expects for that direction.
- Payment marks and card logos are not mirrored.

Use the Persian and RTL skill for the layout rules behind these checks.
