Cache product, category, and home pages only for shoppers without a session, and bypass the cache for cart, checkout, and my-account pages, and for any request carrying the `woocommerce_items_in_cart`, `woocommerce_cart_hash`, or `wp_woocommerce_session_` cookie, or a logged-in cookie.

Load the mini-cart count with a small uncached request after the page loads, so cached HTML never holds a shopper's cart. Purge a product's page when its price or stock changes.
