# WordPress plugin security

- Check a capability with `current_user_can()`, not a role name. Use `edit_shop_orders`, `edit_products`, or `manage_woocommerce` for shop operations.
- Verify a nonce on cookie-authenticated state changes. A nonce does not authenticate the user and does not belong on a server-to-server webhook.
- Unslash request data, sanitize it to a known type, and escape on output for the HTML, attribute, or URL context you are writing.
- Pass SQL values through `$wpdb->prepare()`. Never build a table name or filesystem path from request input.
- Give every private REST route a `permission_callback` that checks a capability. Do not use `__return_true` for order, customer, or payment data.
- Authorize the specific object after you load it. A posted order id is not proof that this user may edit that order.
- Store structured meta as JSON or scalars. Do not `unserialize()` request data.
- Keep secrets, card data, and full `$_POST` payloads out of logs and order notes.
