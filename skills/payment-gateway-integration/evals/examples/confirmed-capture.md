Confirm capture through the payment-complete path.

```php
if ( ! $order->is_paid() ) {
    $order->payment_complete( $transaction_id );
}
```

Do not treat the browser return query as proof that the capture succeeded.
