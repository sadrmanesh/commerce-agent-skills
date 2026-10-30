Load the order and write meta through CRUD.

```php
$order = wc_get_order( $order_id );
$order->update_meta_data( '_carrier_code', $carrier );
$order->save();
```

Check `edit_shop_orders` and a nonce before this write.
