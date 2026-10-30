Create the purchasable variation and give it the SKU.

```php
$variation = new WC_Product_Variation();
$variation->set_parent_id( $product->get_id() );
$variation->set_attributes( array( 'pa_color' => 'blue' ) );
$variation->set_sku( 'SHIRT-BLUE' );
$variation->set_regular_price( '19.00' );
$variation->save();
```
