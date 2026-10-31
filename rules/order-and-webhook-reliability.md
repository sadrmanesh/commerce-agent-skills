# Order and webhook reliability

- Verify webhook signatures against the raw body with a constant-time compare, before trusting the JSON.
- Persist the event in a unique inbox, then return 2xx. A delivery attempt id is not an idempotency key.
- Dedupe WooCommerce webhooks on resource id, topic, and `date_modified_gmt`. `X-WC-Webhook-Delivery-ID` changes every attempt.
- Fetch the order or payment when the event is out of order or incomplete. Do not apply an older status over a newer one.
- Compare paid amounts in integer minor units.
- Make the paid transition idempotent so stock and receipt email run once.
- Treat a redelivery after a timeout as a duplicate: if the inbox row is already `applied`, return 2xx and run no side effect again.
- Write outbound webhooks from an outbox in the same transaction as the order change.
- Acknowledge a WooCommerce activation ping with 2xx and do not create an order from it.
- Return a retryable error only when the event was not stored. WooCommerce disables a webhook after more than five consecutive failures.
- Serve the handler on the exact delivery URL. WooCommerce does not follow redirects when it posts the body.
