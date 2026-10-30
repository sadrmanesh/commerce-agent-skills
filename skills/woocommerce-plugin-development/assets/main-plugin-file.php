<?php
/**
 * Plugin Name: Example Commerce Plugin
 * Description: Skeleton. Replace the name, slug, and compatibility flags before shipping.
 * Version: 0.1.0
 * Author: Replace with the plugin author
 * Text Domain: example-plugin
 * Requires Plugins: woocommerce
 * Replace x.y.z below with the WooCommerce version you actually tested.
 * WC tested up to: x.y.z
 *
 * @package ExamplePlugin
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'before_woocommerce_init',
	static function () {
		if ( ! class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			return;
		}
		// Keep true only when order access stays on CRUD. Otherwise pass false.
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		// Keep true only when checkout changes also run for the Checkout block.
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', __FILE__, true );
	}
);
