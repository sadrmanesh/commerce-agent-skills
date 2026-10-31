---
name: woocommerce-rest-api
description: "Call the WooCommerce REST API at wc/v3, including authentication, pagination, batch writes, and webhook registration, and keep it separate from the Store API. Use when an external system integrates with a WooCommerce store over HTTP."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.2"
---

# WooCommerce REST API

Use this skill for a server-side client of a WooCommerce store. The browser checkout uses a different API. Payment notification handling belongs to the webhook reliability skill.

## Which API

| API | Namespace | Who calls it |
| --- | --- | --- |
| WooCommerce REST API | `/wp-json/wc/v3/` | Your server, with a consumer key and secret. |
| Store API | `/wp-json/wc/store/v1/` | The storefront, with a cart token and nonce. |
| Legacy REST API | `/wc-api/v3/` | Old clients only. Do not start new work here. |

The current REST API requires WooCommerce 3.5+, WordPress 4.4+, and pretty permalinks. Default permalinks do not serve these routes.

Never put a consumer secret in browser JavaScript, a mobile binary, or a Store API request.

## Authentication

Create a key at **WooCommerce > Settings > Advanced > REST API**. The key inherits the WordPress user you bind it to, and the permission you select: Read, Write, or Read/Write. Deleting that user disables the key. The consumer secret is shown once.

Over HTTPS, send HTTP Basic authentication with the consumer key as the username and the consumer secret as the password.

```bash
curl --user "$WC_CONSUMER_KEY:$WC_CONSUMER_SECRET" \
  "https://shop.example/wp-json/wc/v3/orders?per_page=20"
```

Some FastCGI hosts drop the `Authorization` header and WooCommerce then reports that the consumer key is missing. Only then, and only over HTTPS, send `consumer_key` and `consumer_secret` as query parameters. Query secrets land in access logs and caches. Prefer fixing the host header.

Over plain HTTP, WooCommerce expects one-legged OAuth 1.0a. For a new integration, use HTTPS instead of adding an OAuth client.

Store the secret in the server environment or a secret manager. Do not commit it.

## Reads

- Follow pages with `page` and `per_page`. `per_page` above 100 is rejected. Read `X-WP-Total` and `X-WP-TotalPages`.
- Request only the fields you need when the endpoint supports `_fields`.
- Compare instants with `date_created_gmt` and `date_modified_gmt`. The unsuffixed fields are in the site timezone.
- Product variations are a child resource: `/wp-json/wc/v3/products/<id>/variations`.
- Error bodies use the WordPress shape `{ "code", "message", "data": { "status" } }`. Branch on `code` and HTTP status, not on the message string.

Endpoint groups and the batch body are in [the endpoint notes](references/endpoints.md).

## Writes

The REST API does not provide a general idempotency key. A retried `POST /orders` can create a second order.

1. Put your own key in meta, for example `meta_data: [{ "key": "_idempotency_key", "value": "<key>" }]`.
2. Before creating, search orders by that meta. Treat a hit as the original result.
3. Meta search is not a unique index. Two concurrent creates can still both miss. For payments, dedupe on the provider transaction id as well. See the order and webhook skill.

Batch routes (`POST /products/batch`, `/orders/batch`, and the customer and coupon equivalents) accept `create`, `update`, and `delete`. The batch is not one database transaction. Read each item result. A 200 response can still contain per-item errors.

Update orders and products with the resource id. Do not match a later update on SKU alone unless you have already resolved the SKU to one id. SKUs can change.

## Webhooks registered over REST

`POST /wp-json/wc/v3/webhooks` with `name`, `topic`, `delivery_url`, and `secret`. The secret is write-only on later reads. If you omit it, WooCommerce falls back to the API user's consumer secret. Set an explicit secret.

The first save of an active webhook delivers a ping, not a full order or product. Acknowledge that ping with a 2xx response and do not create an order from it.

Topic names look like `order.updated` and `product.created`. The delivered resource body matches the REST representation. Verify `X-WC-Webhook-Signature` against the raw body before trusting it. The signature procedure is in the order and webhook skill.

## Gotchas

- A Read key cannot create products. A Write key cannot list orders. Check the key permission and the user's capability when you get `401` or `403`.
- Order status names in the API omit the `wc-` prefix (`processing`, not `wc-processing`).
- Prices are strings in major currency units, such as `"19.00"`. Do not send a float.
- HPOS does not change the REST shape. Clients should keep using this API rather than reading the database.
- Webhook delivery that returns `301` or `302` can be counted as success while `WC_Webhook::deliver()` sends the body with redirects disabled. Serve the JSON handler on the exact `delivery_url`.

## Verification

- A request with the wrong secret returns 401 and creates nothing.
- Listing orders walks every `X-WP-TotalPages` page without duplicating or skipping ids.
- Repeating the same create with the same idempotency key returns one order.
- A webhook ping does not create an order. A signed `order.updated` delivery updates the matching local record.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
