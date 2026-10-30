# WooCommerce webhook delivery

Source of this note: WooCommerce webhook documentation and `WC_Webhook::deliver()`. Confirm header names against the shop's WooCommerce version when you debug a live miss.

## Request

- Method: `POST`
- Content type: `application/json`
- Body: the REST representation of the resource, or a ping payload when the webhook is first activated
- User-Agent contains `WooCommerce` and `Hookshot`. Do not authenticate with the User-Agent.

Headers:

| Header | Role |
| --- | --- |
| `X-WC-Webhook-Source` | Store home URL. |
| `X-WC-Webhook-Topic` | For example `order.updated`. |
| `X-WC-Webhook-Resource` | For example `order`. |
| `X-WC-Webhook-Event` | For example `updated`. |
| `X-WC-Webhook-Signature` | Base64 HMAC-SHA256 of the raw body. |
| `X-WC-Webhook-ID` | Webhook id. |
| `X-WC-Webhook-Delivery-ID` | This attempt's log id. Not stable across attempts. |

The signature is computed after JSON encoding. The hash algorithm filter is `woocommerce_webhook_hash_algorithm` and defaults to `sha256`. If a shop changes that filter, a receiver that always uses SHA-256 will reject valid deliveries. Prefer leaving the filter at the default.

The secret is the webhook's configured secret. If the secret was left empty, WooCommerce uses the current API user's consumer secret. Set an explicit secret when you register the webhook.

## Signature check

```js
import { verifyWooCommerceSignature } from "../scripts/verify-hmac-signature.mjs";

const result = verifyWooCommerceSignature({
  secret,
  rawBody,
  signature: headerValue,
});
```

`rawBody` is a Buffer or string of the exact POST body. `decodeWebhookSecret()` decodes `&quot;`, `&#039;`, `&#39;`, `&lt;`, `&gt;`, and `&amp;` to match `wp_specialchars_decode( $secret, ENT_QUOTES )`.

## Success and automatic disable

WooCommerce treats `2xx`, `301`, and `302` as success. Other statuses add to the consecutive failure count. The webhook is disabled after more than five consecutive failures. Filter: `woocommerce_max_webhook_delivery_failures`, default `5`.

Disabled webhooks stay disabled until someone sets them back to active. A receiver outage that returns 500 long enough will stop delivery until the merchant notices. Return 2xx once the event is durable, and do slow work afterward.

`deliver()` sets HTTP redirection to 0. Do not put a redirect on the delivery URL and expect the body to be posted to the target.

## Ping

Saving an active webhook sends a ping. Treat a body that is only a webhook probe as a health check. Acknowledge it. Do not require an order id.

## Topics

Resource topics include `order.created`, `order.updated`, `order.deleted`, `product.created`, `product.updated`, `product.deleted`, `customer.created`, `customer.updated`, and the coupon equivalents. `order.updated` fires for many status and meta changes. Your handler has to tolerate repeats with a newer `date_modified_gmt`.

Deleted resources may arrive after your local copy is already gone. Record the delete and return 2xx.
