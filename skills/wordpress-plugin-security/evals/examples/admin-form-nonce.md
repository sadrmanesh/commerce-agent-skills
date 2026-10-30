Verify the user and the nonce, then sanitize the field.

```php
if ( ! current_user_can( 'edit_shop_orders' ) ) {
    wp_die( esc_html__( 'You cannot edit orders.', 'example-plugin' ) );
}
check_admin_referer( 'example_order_panel' );
$note = sanitize_text_field( wp_unslash( $_POST['desk_note'] ?? '' ) );
```
