Filter the existing markup.

```php
add_filter( 'woocommerce_structured_data_product', function ( $markup, $product ) {
    $markup['brand'] = array( '@type' => 'Brand', 'name' => 'Example' );
    return $markup;
}, 10, 2 );
```
