---
name: woocommerce-plugin-development
description: "Build and change WooCommerce plugins with hooks, CRUD data stores, HPOS-safe order access, nonces, capabilities, and gettext. Use when writing or reviewing a plugin that reads or writes WooCommerce products, orders, customers, or checkout."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.1"
---

# WooCommerce plugin development

Use this skill for a WordPress plugin that depends on WooCommerce. Use the REST API skill for an external HTTP client. Use the payment and webhook skills for capture and notification handling. Use the WordPress plugin security skill for the authorization details of any new endpoint.

## Procedure

1. Declare the dependency in the main plugin file. WordPress 6.5+ understands `Requires Plugins: woocommerce`. Set `WC tested up to` as well. WooCommerce only surfaces High-Performance Order Storage (HPOS) compatibility in the plugins list when that header is present.
2. Stop direct requests with `defined( 'ABSPATH' ) || exit;`.
3. Read and write products and orders through CRUD. Load with `wc_get_product()` or `wc_get_order()`, change setters, then call `save()` once. List orders with `wc_get_orders()`. Do not query `wp_posts` for `shop_order`.
4. From the main plugin file, on `before_woocommerce_init`, declare feature compatibility. Pass `__FILE__` from that main file. Declare `custom_order_tables` only when every order read and write uses CRUD or `OrderUtil`. Declare `cart_checkout_blocks` only when checkout behavior also runs for the Checkout block.
5. Hook the specific action. Cover both checkout stacks when the code runs during checkout. Open [the hook notes](references/hooks.md) before choosing one.
6. Authorize every write with a capability and a nonce. A nonce is not authentication.
7. Send user-facing strings through gettext with the plugin text domain.

A skeleton header and the compatibility declaration are in [`assets/main-plugin-file.php`](assets/main-plugin-file.php). Copy it into a new plugin only after you delete the declaration you cannot yet keep.

## Order and product writes

```php
$order = wc_get_order( $order_id );
if ( ! $order ) {
    return;
}
$order->update_meta_data( '_carrier_code', sanitize_text_field( $carrier ) );
$order->save();
```

Do not call `update_post_meta()`, `get_post_meta()`, `wp_insert_post()`, or `get_posts()` for orders. Those use the posts tables. Under HPOS the order may be absent there, or the row may be a stale compatibility copy.

HPOS is the default for new installations from WooCommerce 8.2 onward. Older shops may still use posts storage. CRUD serves both. Compatibility mode can mirror orders into posts; code that reads those posts still fails when a merchant turns the mirror off.

Open [the HPOS notes](references/hpos.md) before adding an admin order screen, a custom order query, or SQL.

## Checkout hooks

Classic shortcode checkout and the Checkout block do not share one hook.

- Classic checkout, before the first save: `woocommerce_checkout_create_order` receives the `WC_Order` and the posted data.
- Classic checkout, after the order exists: `woocommerce_checkout_order_processed`.
- Checkout block and Store API: `woocommerce_store_api_checkout_update_order_from_request` and `woocommerce_store_api_checkout_order_processed`.

A plugin that hooks only the classic actions does not run during block checkout.

## Admin order screens

`wc_get_page_screen_id( 'shop-order' )` returns `shop_order` on posts storage and the HPOS orders screen id otherwise. Use it for metaboxes. The callback may receive a `WP_Post` or a `WC_Order`. Normalize with `wc_get_order()` and ignore the original argument after that. Link to an order with `$order->get_edit_order_url()`.

`save_post_shop_order` does not run for HPOS orders. Persist admin fields from `woocommerce_process_shop_order_meta`, then `wc_get_order()` and `save()`.

## Internationalization

- The text domain matches the plugin slug. Set the `Text Domain` header.
- Print with `esc_html__()`, `esc_attr__()`, and `esc_html_e()`. Use `sprintf` placeholders. Do not concatenate translated fragments.
- Language packs for plugins hosted on WordPress.org load from the slug. For any other distribution, call `load_plugin_textdomain()` on `init`. WordPress 6.7 reports a notice when translations load earlier.
- RTL layout is a separate task. Use the Persian and RTL skill when the storefront needs it.

## Gotchas

- `save()` writes the object. Set the fields for this change, then save once.
- Refunds are orders of type `shop_order_refund`. Create them with `wc_create_refund()`. Flipping the parent status to `refunded` does not record a refund.
- Stock reduction is tied to payment completion and status transitions. A second decrement double-counts. Core tracks this with `_order_stock_reduced` inside `wc_maybe_reduce_stock_levels()`.
- `woocommerce_checkout_update_order_meta` still runs. Examples that call `update_post_meta()` inside it are not HPOS-safe.
- Declaring `custom_order_tables` compatibility `true` is a promise. If any order path still uses post APIs, declare `false` until that path is gone.
- SQL against `{$wpdb->prefix}wc_orders` skips caches and the posts fallback. Limit it to a measured report, and branch with `OrderUtil::custom_orders_table_usage_is_enabled()`.

## Verification

- With HPOS on and compatibility mode off, create and edit an order through the plugin. The change is visible in admin and in `wc_get_order()`.
- If both checkouts are enabled, place one classic order and one block order.
- A user without the required capability cannot perform the write. A missing or reused nonce is rejected.
- New strings are escaped where printed and are picked up by `wp i18n make-pot`.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
