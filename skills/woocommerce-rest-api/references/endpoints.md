# WooCommerce REST API endpoints

Base path: `/wp-json/wc/v3/`. All routes below are relative to that base. Authenticate every call as described in `SKILL.md`.

## Resources

| Path | Typical use |
| --- | --- |
| `products` | Create and update the parent product. |
| `products/<id>/variations` | Create and update purchasable variants. |
| `products/attributes` | Global attributes. Taxonomy name is `pa_` plus the slug. |
| `products/categories` | Product categories. |
| `products/<id>/reviews` | Product reviews. |
| `orders` | Order header, line items, shipping lines, fee lines, and coupons. |
| `orders/<id>/notes` | Customer or private notes. `customer_note: true` emails the customer. |
| `orders/<id>/refunds` | Create a refund. This is the REST equivalent of `wc_create_refund()`. |
| `customers` | WordPress users who are customers. Guest orders are not customers until an account exists. |
| `coupons` | Coupon definitions. Applying a coupon still happens in checkout or by editing the order. |
| `webhooks` | Register, pause, or delete a webhook. `secret` is write-only. |
| `taxes`, `shipping/zones`, `payment_gateways`, `settings` | Store configuration. Prefer the admin UI unless you are provisioning stores. |
| `system_status` | Environment diagnostic. Do not require it on the hot path. |
| `reports/sales` | Aggregates. For large extracts, page through `orders` instead of assuming one report call is complete. |

`<id>` is the integer resource id.

## Batch

`POST products/batch`, `orders/batch`, `customers/batch`, and `coupons/batch`.

```json
{
  "create": [],
  "update": [{ "id": 10, "status": "draft" }],
  "delete": [11]
}
```

Inspect `create`, `update`, and `delete` in the response. An item error does not roll back its siblings.

## Pagination and filters

- `page` starts at 1. `per_page` defaults to 10 and cannot exceed 100.
- Order list filters include `status`, `customer`, `product`, `after`, `before`, `modified_after`, and `modified_before`. Pass the date filters as ISO-8601 timestamps.
- Use `modified_after` for an incremental sync. A record can change while you are paging. Keep an overlap and dedupe by id plus `date_modified_gmt`. If the installed WooCommerce rejects `modified_after`, fall back to `after` and `before`.

## Status values

Order statuses used by core: `pending`, `processing`, `on-hold`, `completed`, `cancelled`, `refunded`, `failed`, and `checkout-draft`. Custom statuses registered with `woocommerce_register_shop_order_post_statuses` also appear. Do not send the `wc-` internal prefix.

Product `status` uses WordPress post statuses such as `publish`, `draft`, and `private`. Catalog visibility is `catalog_visibility` (`visible`, `catalog`, `search`, `hidden`), which is not the same field.

## Webhook topics

Common topics: `order.created`, `order.updated`, `order.deleted`, `product.created`, `product.updated`, `product.deleted`, `customer.created`, `customer.updated`, `coupon.created`, `coupon.updated`. Action topics bind a webhook to a WooCommerce action name. Prefer a resource topic unless you need a specific action.

Headers on delivery:

- `X-WC-Webhook-Source`
- `X-WC-Webhook-Topic`
- `X-WC-Webhook-Resource`
- `X-WC-Webhook-Event`
- `X-WC-Webhook-Signature`
- `X-WC-Webhook-ID`
- `X-WC-Webhook-Delivery-ID`

`X-WC-Webhook-Delivery-ID` changes on every attempt. Do not use it as the only idempotency key.
