# HPOS order access

High-Performance Order Storage keeps orders in dedicated tables:

- `{prefix}wc_orders`
- `{prefix}wc_order_addresses`
- `{prefix}wc_order_operational_data`
- `{prefix}wc_orders_meta`

Posts storage keeps the same objects in `wp_posts` and `wp_postmeta` as the `shop_order` post type. Refunds use `shop_order_refund` in both modes. CRUD hides that choice. Direct SQL and post APIs do not.

## Detect the active store

```php
use Automattic\WooCommerce\Utilities\OrderUtil;

$hpos = class_exists( OrderUtil::class ) && OrderUtil::custom_orders_table_usage_is_enabled();
```

Use this to branch SQL or admin screen registration. Do not use it to decide whether `wc_get_order()` works. That function works in both modes.

## Declare compatibility

Call this from the main plugin file. `declare_compatibility()` returns false outside `before_woocommerce_init`.

```php
add_action( 'before_woocommerce_init', function () {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
    }
} );
```

If the declaration lives in another file, pass the main plugin file path, such as `example-plugin/example-plugin.php`, instead of `__FILE__`.

## Queries

```php
$results = wc_get_orders(
    array(
        'status'   => array( 'processing', 'completed' ),
        'limit'    => 50,
        'paginate' => true,
        'return'   => 'objects',
    )
);
```

Filter custom meta with `meta_query` only when the cardinality is small enough to measure. There is no unique index on arbitrary meta keys. An idempotency lookup by meta is not a uniqueness constraint.

Identify an order with `OrderUtil::is_order()` and `OrderUtil::get_order_type()`. Do not call `get_post_type()` for this.

## Admin metabox

```php
add_action( 'add_meta_boxes', function () {
    if ( ! function_exists( 'wc_get_page_screen_id' ) ) {
        return;
    }
    add_meta_box(
        'example_order_panel',
        __( 'Shipping desk', 'example-plugin' ),
        'example_render_order_panel',
        wc_get_page_screen_id( 'shop-order' ),
        'side'
    );
} );

function example_render_order_panel( $post_or_order ) {
    if ( ! current_user_can( 'edit_shop_orders' ) ) {
        return;
    }
    $order = $post_or_order instanceof WC_Order ? $post_or_order : wc_get_order( $post_or_order->ID ?? 0 );
    if ( ! $order ) {
        return;
    }
    wp_nonce_field( 'example_order_panel', 'example_order_nonce' );
    echo esc_html( $order->get_order_number() );
}
```

## Sync mode is not compatibility

While "Enable compatibility mode" is on, WooCommerce copies orders between the two stores. A plugin can appear to work because it reads the copy. Turn compatibility mode off in a staging shop and repeat the order flow before declaring `custom_order_tables` compatible.
