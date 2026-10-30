Register the route with a real permission callback.

```php
'permission_callback' => static function () {
    return current_user_can( 'edit_shop_orders' );
},
```

Sanitize the note and load the order on the server before writing.
