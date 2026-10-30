# WooCommerce hooks

Confirm argument order in the WooCommerce version you are running when a signature is load-bearing. Prefer a hook that receives a `WC_Order` or `WC_Product`. If a hook passes only an id, load the object with `wc_get_order()` or `wc_get_product()` and do not touch post meta.

## Orders

| Hook | Use it for |
| --- | --- |
| `woocommerce_checkout_create_order` | Set order fields and meta during classic checkout, before the first save. |
| `woocommerce_checkout_order_processed` | React after a classic checkout order exists. |
| `woocommerce_store_api_checkout_update_order_from_request` | Same moment as classic create, for the Checkout block. |
| `woocommerce_store_api_checkout_order_processed` | React after a block checkout order exists. |
| `woocommerce_new_order` | Notice that an order id exists. Status may still be `pending` or `checkout-draft`. |
| `woocommerce_order_status_changed` | Compare previous and next status. Arguments are order id, old status, new status, and the order. |
| `woocommerce_payment_complete` | Run side effects after a verified payment. Do not use this as the only stock decrement. |
| `woocommerce_order_refunded` | React after `wc_create_refund()` has created the refund order. |
| `woocommerce_before_order_object_save` | Inspect or adjust an order about to be written through CRUD. |
| `woocommerce_process_shop_order_meta` | Save admin order fields for both storage modes. |

Do not use `save_post_shop_order` or `manage_edit-shop_order_columns` as the only integration point. The HPOS list table uses `woocommerce_shop_order_list_table_columns` and `woocommerce_shop_order_list_table_custom_column`. Register the custom-column action with two accepted arguments. The second is a `WC_Order`, not a post id.

## Products

| Hook | Use it for |
| --- | --- |
| `woocommerce_before_product_object_save` / `woocommerce_after_product_object_save` | Changes made through `WC_Product::save()`. |
| `woocommerce_new_product` / `woocommerce_update_product` | After a product id exists. |
| `woocommerce_product_options_general_product_data` | Extra fields on the product data panel. |
| `woocommerce_process_product_meta` | Save those fields. Check a nonce and `edit_products`. |
| `woocommerce_product_set_stock` / `woocommerce_variation_set_stock` | React to a stock write. Do not write stock again from the same hook. |

## Cart and checkout fields

| Hook | Use it for |
| --- | --- |
| `woocommerce_add_to_cart_validation` | Reject a line before it enters the cart. Return false and add a notice. |
| `woocommerce_before_calculate_totals` | Change line prices for this request. Guard with a flag so the hook does not recurse. |
| `woocommerce_cart_calculate_fees` | Add a fee. Fees are not a substitute for a payment surcharge unless the store shows the fee before the pay button. |
| `woocommerce_checkout_fields` | Add, remove, or relabel classic checkout fields. |
| `woocommerce_default_address_fields` | Change address fields for every country, then override per country with `woocommerce_get_country_locale`. |

## Registration

Register gateways on `woocommerce_payment_gateways`. Register settings on `woocommerce_get_settings_{tab}`.

Run WooCommerce callbacks after WooCommerce has loaded. `plugins_loaded` at the default priority is too early if your plugin file loads before WooCommerce. Prefer `woocommerce_loaded`, or a later `plugins_loaded` priority, before calling `wc_get_order()` during bootstrap.
