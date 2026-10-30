Declare compatibility on the WooCommerce init hook from the main plugin file.

```php
add_action( 'before_woocommerce_init', function () {
    \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
} );
```

Include a WC tested up to header set to the version you actually tested.
