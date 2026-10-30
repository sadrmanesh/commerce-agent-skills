# Subscription billing

- Store the subscription separately from invoices: status, interval, and period start and end in UTC.
- Activate a paid plan only after the first charge is confirmed. A trial stores its end and does not pretend a charge succeeded.
- Create one renewal invoice per period. Retry that charge with the same idempotency key. Do not advance the period until the charge succeeds.
- Map provider statuses in one function. Unknown statuses do not move the contract.
- Cancel at period end is different from canceling now. Record which one the shopper chose.
- Prorate plan changes on their own invoice lines. Do not edit a paid invoice in place.
- On the first failed renewal, follow the dunning schedule. Do not delete the entitlement immediately unless the plan says so.
- Do not implement WooCommerce renewals with `wp_insert_post`. Use the subscription product the store already runs.
