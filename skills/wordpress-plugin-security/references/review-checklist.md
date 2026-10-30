# Plugin security review

Check each new entry point. Skip a line only when it does not apply, and say why.

## Entry

- The file starts with `defined( 'ABSPATH' ) || exit;` or is loaded only from a file that does.
- Admin-post, admin-ajax, REST, and form handlers each have their own capability check.
- State-changing browser requests verify a nonce bound to that action.
- The REST `permission_callback` is a named function or closure that returns a capability check, never `__return_true`, for private data.

## Input

- Request values go through `wp_unslash()` and then a sanitizer: `absint`, `sanitize_text_field`, `sanitize_email`, `esc_url_raw`, `wp_kses_post`, or a strict allow list.
- Prices, quantities, and statuses are validated against server-side rules. The client amount is not stored as the charged amount.
- Sort columns, table names, and file paths are chosen from a fixed map, not from the request string.
- Uploads use `wp_handle_upload()` and an extension allow list.

## Output and storage

- HTML text uses `esc_html()`. Attributes use `esc_attr()`. URLs use `esc_url()`. Translated strings use the escaping gettext variant.
- SQL variables use `$wpdb->prepare()`.
- New meta and options are JSON or scalars. No `unserialize()` of request data.
- Secrets and card data are not written to logs, order notes, or the browser.

## WooCommerce-specific

- Order and product writes use CRUD.
- The handler works for HPOS when it touches orders.
- Checkout logic that must run for blocks is hooked to the Store API, not only to classic checkout.
- Webhook handlers verify a signature instead of using a nonce. Nonces are for cookie sessions. Webhooks are not cookie sessions.
