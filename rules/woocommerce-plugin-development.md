# WooCommerce plugin development

- Read and write orders and products with WooCommerce CRUD (`wc_get_order`, `wc_get_product`, setters, one `save()`). Do not use `get_post`, `get_post_meta`, `update_post_meta`, or `get_posts` for orders.
- Declare HPOS compatibility from the main plugin file on `before_woocommerce_init` via `FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true )` only after every order path is CRUD-based. Include a `WC tested up to` header.
- Hook both classic checkout and the Store API checkout. `woocommerce_checkout_create_order` does not run for the Checkout block.
- Register order admin UI on `wc_get_page_screen_id( 'shop-order' )`. Do not rely on `save_post_shop_order`.
- Authorize writes with a capability (`edit_shop_orders`, `edit_products`, `manage_woocommerce`) and a nonce. A nonce is not authentication.
- Create refunds with `wc_create_refund()`. Do not only set the order status to `refunded`.
- Leave stock reduction to WooCommerce payment and status transitions. Do not decrement quantity again in your hook.
- Wrap user-facing strings in gettext calls with the plugin text domain. Load a privately distributed text domain on `init`.
