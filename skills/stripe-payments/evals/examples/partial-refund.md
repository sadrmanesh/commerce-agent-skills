Call `POST /v1/refunds` with `payment_intent=pi_123` and `amount=500`, because Stripe amounts are integers in cents. Send `Idempotency-Key: refund-1042-1` so a retried request does not refund twice.

Create the shop refund record as pending with the returned `re_` id. Update it to succeeded or failed from `refund.updated`. The order stays paid for the remaining 14.99 USD.
