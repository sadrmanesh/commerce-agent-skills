# WooCommerce tax and shipping

Use WooCommerce's tax and shipping services. Do not reimplement a rate table in the theme.

## Tax

- Prices inclusive or exclusive are a store setting (`woocommerce_prices_include_tax`). Read it. Do not hard-code one mode in a plugin.
- Tax classes live on the product. Shipping tax class is its own setting.
- `WC_Tax::calc_tax()` and `WC_Tax::calc_shipping_tax()` take the store's rates. Pass amounts the way those methods document for the installed version, and keep minor-unit rounding consistent with `wc_get_price_decimals()`.
- Order item tax is stored on the line (`total_tax`, `subtotal_tax`, and the rate id maps). Read it back from the order item. Do not recompute history from the current rates.
- Checkout recalculates totals through `WC_Cart::calculate_totals()`. A custom fee or price change belongs in `woocommerce_before_calculate_totals` or a fee hook so tax runs after it.

## Shipping

- Zones, locations, and method instances are configured in WooCommerce. A method extends `WC_Shipping_Method` and implements `calculate_shipping( $package )`.
- `calculate_shipping` adds rates with `add_rate()`. The `cost` is a decimal string in the store currency. A cost of `0` is a free rate you intend to offer.
- The package destination is in `$package['destination']`. If the country is empty, do not add a domestic rate as if it were final.
- The chosen rate is stored on the shipping order item (`method_id`, `instance_id`, `total`). HPOS does not change that. Use the order item API.

## Display

`wc_price()` formats amounts. Tax labels come from the rate's label. Do not concatenate a hard-coded percent next to a price that WooCommerce has already formatted with or without tax.
