# WooCommerce payment gateway

Extend `WC_Payment_Gateway` and register it on `woocommerce_payment_gateways`.

```php
class Example_Gateway extends WC_Payment_Gateway {
    public function __construct() {
        $this->id                 = 'example';
        $this->method_title       = __( 'Example', 'example-gateway' );
        $this->method_description = __( 'Pay with Example.', 'example-gateway' );
        $this->has_fields         = false;
        $this->supports           = array( 'products' );
        $this->init_form_fields();
        $this->init_settings();
        add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
    }

    public function process_payment( $order_id ) {
        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            wc_add_notice( __( 'Order not found.', 'example-gateway' ), 'error' );
            return array( 'result' => 'failure' );
        }

        // Create or reuse the provider payment with an idempotency key.
        // Do not mark the order paid here unless the provider response is a confirmed capture.
        // A hosted payment page uses the provider URL. An offline method uses get_return_url().
        $redirect_url = $this->get_return_url( $order );

        return array(
            'result'   => 'success',
            'redirect' => $redirect_url,
        );
    }

    public function process_refund( $order_id, $amount = null, $reason = '' ) {
        // Add 'refunds' to $supports only after this calls the provider and returns true on acceptance.
        // On decline: return new WP_Error( 'example_refund_failed', __( 'The provider declined the refund.', 'example-gateway' ) );
        return new WP_Error( 'example_refund_failed', __( 'Refunds are not implemented yet.', 'example-gateway' ) );
    }
}
```

## Paid, held, and failed

- Confirmed capture: `$order->payment_complete( $transaction_id )`. That stores the transaction id, chooses `processing` or `completed` through `woocommerce_payment_complete_order_status`, and fires `woocommerce_payment_complete`.
- Awaiting a bank transfer or webhook: `$order->update_status( 'on-hold', $note )`. Do not call `payment_complete()` for money you do not have.
- Decline: `$order->update_status( 'failed', $note )` and `wc_add_notice()`.
- Do not call `update_status( 'processing' )` for a successful capture. That skips the payment-complete path.

`payment_complete()` is not a substitute for an idempotency check. Guard it with the stored transaction id or `$order->is_paid()` so a replay does not treat the order as newly paid. `is_paid()` is true for statuses in `woocommerce_order_is_paid_statuses`, which defaults to `processing` and `completed`.

Empty the cart with `WC()->cart->empty_cart()` only after the shop accepts the attempt (redirect created, or payment confirmed), matching the policy in `SKILL.md`. Use `$this->get_return_url( $order )` when you return the shopper to the site. Do not call `wp_redirect()` inside `process_payment()`.

## Blocks checkout

A classic gateway is not automatically offered in the Checkout block. Register a payment method integration that extends `Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType` on `woocommerce_blocks_payment_method_type_registration`, and declare `cart_checkout_blocks` compatibility from the main plugin file. Until that exists, say so in the plugin and test classic checkout separately.

## Webhooks

WooCommerce API callbacks under `/?wc-api=example` are not cookie-authenticated. Verify the provider signature there. The same rule applies to a custom REST route. Nonces do not apply.

Store the transaction id with `payment_complete()`. Do not call `add_post_meta( $order_id, '_transaction_id', ... )`. That misses HPOS.

## Refunds

`process_refund()` must talk to the provider and return `true` only after the provider accepts the refund. Returning `true` without a provider call marks the WooCommerce refund as done while the money has not moved. Omit `refunds` from `$supports` until the method is real.
