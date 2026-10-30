# Stripe payments

- Create the PaymentIntent or Checkout Session on the server from the order total, with `metadata[order_id]` and an `Idempotency-Key` per attempt.
- Send amounts as integers in the currency's smallest unit. Respect zero-decimal currencies.
- Only the `client_secret` or Checkout `url` reaches the browser. The `sk_` key stays on the server.
- Mark orders paid from a verified webhook: `payment_intent.succeeded`, or `checkout.session.completed` with `payment_status` `paid`.
- Verify `Stripe-Signature` on the raw body with the `whsec_` secret, a 300 second tolerance, and a constant-time compare.
- Deduplicate on `event.id`. Compare `amount_received` and `currency` with the order.
- Refund with `POST /v1/refunds` and an idempotency key. Track pending refunds from `refund.updated`.
- Never treat the `return_url` visit as proof of payment.
