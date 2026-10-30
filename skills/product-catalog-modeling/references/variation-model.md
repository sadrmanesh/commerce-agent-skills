# Mapping the catalog model to WooCommerce

WooCommerce product types match this model: `simple`, `variable`, `external`, and `grouped`.

## Global attributes

Create a global attribute once, then attach terms. The taxonomy name is `pa_` plus the attribute slug. Variation attribute values stored on a `WC_Product_Variation` are term slugs, not translated labels.

```php
$product = new WC_Product_Variable();
$product->set_name( 'Cotton shirt' );
$product->set_status( 'publish' );

$attribute = new WC_Product_Attribute();
$attribute->set_id( wc_attribute_taxonomy_id_by_name( 'pa_color' ) );
$attribute->set_name( 'pa_color' );
$attribute->set_options( array( $blue_term_id, $red_term_id ) );
$attribute->set_visible( true );
$attribute->set_variation( true );
$product->set_attributes( array( $attribute ) );
$product->save();

$variation = new WC_Product_Variation();
$variation->set_parent_id( $product->get_id() );
$variation->set_attributes( array( 'pa_color' => 'blue' ) );
$variation->set_sku( 'SHIRT-BLUE' );
$variation->set_regular_price( '19.00' );
$variation->set_manage_stock( true );
$variation->set_stock_quantity( 4 );
$variation->set_backorders( 'no' );
$variation->save();

WC_Product_Variable::sync( $product->get_id() );
```

Call `WC_Product_Variable::sync()` after variant writes so the parent price range and stock status match the children. Skip it and the catalog can show the parent as out of stock while a variant has quantity.

Local attributes (not a `pa_` taxonomy) are valid for a single product. Prefer global attributes when the same facet must be shared across products and search.

## Simple products

```php
$product = new WC_Product_Simple();
$product->set_name( 'Gift card' );
$product->set_sku( 'GIFT-25' );
$product->set_regular_price( '25.00' );
$product->set_manage_stock( false );
$product->set_stock_status( 'instock' );
$product->save();
```

`set_regular_price()` takes a decimal string. Sale price is `set_sale_price()`. The active price follows WooCommerce sale schedule rules. Do not overwrite `_price` meta by hand.

## SKU lookup

`wc_get_product_id_by_sku()` resolves both parent products and variations. Uniqueness is enforced unless `wc_product_has_unique_sku` is filtered. Do not filter it to allow duplicates unless the shop has a separate identity for the sellable unit.

## Stock

- `set_manage_stock( true )` plus `set_stock_quantity()` is managed stock.
- `set_stock_status()` is the manual status used when stock is not managed, and the cached status when it is.
- Reducing stock for an order is `wc_reduce_stock_levels()` / `wc_maybe_reduce_stock_levels()`, which no-ops when `_order_stock_reduced` is already set. Call it from payment completion only if core has not already done so.
- `woocommerce_hold_stock_minutes` (default 60) holds stock on unpaid pending orders. Importers and availability displays should use WooCommerce's availability helpers rather than subtracting `stock_quantity` a second time.

## Grouped and external

Grouped products store child ids. The price is the child's price. External products store a product URL and an optional button label. They are not stock-managed inside the shop.

## Imports

Resolve SKU to id before update. Create when absent. Wrap a large import in batches and call `WC_Product_Variable::sync()` per parent after its variants, not once for the whole catalog at the start. Delete a variant that left the model. Leaving it published sells a combination the model no longer allows.
