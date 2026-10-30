# WooCommerce REST API

- Call `/wp-json/wc/v3/` from the server. Do not send consumer secrets to the browser or to the Store API (`/wp-json/wc/store/v1/`).
- Authenticate over HTTPS with HTTP Basic auth: consumer key as the username, consumer secret as the password. Use query-string credentials only when the host strips `Authorization`, and never over plain HTTP.
- Bind each key to a user and a Read, Write, or Read/Write permission that matches the job. A deleted user disables the key.
- Page with `per_page` at most 100 and stop on `X-WP-TotalPages`. Compare times with the `*_gmt` fields.
- Treat creates as unsafe to retry. Store your own idempotency key in meta and look it up before posting again.
- Read every item in a batch response. A batch is not one transaction.
- Register webhooks with an explicit secret. Acknowledge the activation ping with 2xx and do not create an order from it.
- Verify `X-WC-Webhook-Signature` on the raw body. Do not dedupe solely on `X-WC-Webhook-Delivery-ID`.
