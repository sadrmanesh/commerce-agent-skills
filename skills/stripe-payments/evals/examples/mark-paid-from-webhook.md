Create the PaymentIntent on the server from the order total with `metadata[order_id]` and an `Idempotency-Key` per attempt.

The order becomes paid only in the webhook handler. Verify the `Stripe-Signature` header against the raw body with the endpoint secret, then insert `event.id` into a table with a unique constraint. If the insert conflicts, return `200` and stop, because the event was already handled.

For `payment_intent.succeeded`, load the order from `metadata.order_id`, compare `amount_received` and `currency` with the order total in minor units, and mark it paid once. The browser redirect only shows a pending page until the order record says paid.
