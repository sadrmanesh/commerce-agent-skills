# Payment gateway integration

- Keep card numbers and CVV on the payment provider. Do not post or store them on the merchant server.
- Create the shop order in an unpaid status before redirecting the shopper.
- Send a stable idempotency key for each payment attempt, and reuse it when retrying that same attempt.
- Mark an order paid only from a signed webhook or a server-side retrieve of the provider payment. Ignore success flags on the browser return URL.
- Compare the paid amount and currency in integer minor units. Reject a mismatch.
- Make the paid transition idempotent. A second notice for the same provider payment id must not capture, email, or reduce stock again.
- Map provider states in one place. Unknown states stay unchanged and are logged.
- Create real refund records through the provider API. Do not only change the order status string.
- In WooCommerce, confirm capture with `$order->payment_complete( $transaction_id )`. Use `on-hold` when money is not confirmed. Do not write `_transaction_id` with `add_post_meta()`.
- Register a Checkout block payment method before declaring the gateway ready for block checkout.
