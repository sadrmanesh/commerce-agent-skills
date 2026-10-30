Format the stored amount with the store currency.

```php
echo wp_kses_post( wc_price( $amount ) );
```

The ISO code is `IRR` when the shop charges rials. Do not divide the charged amount in the template.
