---
name: wordpress-plugin-security
description: "Review and implement WordPress plugin security: capabilities, nonces, sanitization, escaping, prepared SQL, and REST permission callbacks. Use when adding admin screens, AJAX, uploads, hooks, or REST routes in a WordPress or WooCommerce plugin."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.1"
---

# WordPress plugin security

Apply this skill to every new entry point: admin form, admin-ajax, admin-post, REST route, Store API extension, file upload, and any hook that reads `$_POST`, `$_GET`, or `$_REQUEST`.

WooCommerce data access is covered by the WooCommerce plugin skill. This skill is the authorization and input/output layer around it.

## Procedure

1. Name the actor and the capability. Check `current_user_can()` with a capability, not a role name. WooCommerce capabilities include `manage_woocommerce`, `edit_shop_orders`, `edit_products`, and `edit_shop_coupons`.
2. For a state change that uses a cookie session, require a nonce. Nonces stop cross-site request forgery. They do not identify the user and they expire.
3. Sanitize input into a known type, then pass that value to CRUD or to `$wpdb->prepare()`. Escape at the point of HTML, attribute, or URL output.
4. Give every REST route a real `permission_callback`. `__return_true` is only acceptable for data you would publish to anonymous visitors.
5. Fail closed. A missing order, a failed nonce, or a missing capability returns without writing.

Use [the review checklist](references/review-checklist.md) before finishing a change.

## Forms and admin-post

```php
function example_save_desk_note() {
    if ( ! current_user_can( 'edit_shop_orders' ) ) {
        wp_die( esc_html__( 'You cannot edit orders.', 'example-plugin' ) );
    }
    check_admin_referer( 'example_order_panel', 'example_order_nonce' );

    $order = wc_get_order( absint( wp_unslash( $_POST['order_id'] ?? 0 ) ) );
    if ( ! $order ) {
        wp_die( esc_html__( 'Order not found.', 'example-plugin' ) );
    }

    $note = sanitize_text_field( wp_unslash( $_POST['desk_note'] ?? '' ) );
    $order->update_meta_data( '_desk_note', $note );
    $order->save();
}
add_action( 'admin_post_example_save_desk_note', 'example_save_desk_note' );
```

Unslash, then sanitize. `wp_unslash()` reverses magic quotes behavior that WordPress still normalizes for. Cast ids with `absint()`. Allow limited HTML only with `wp_kses()` or `wp_kses_post()` against an explicit allow list.

## AJAX

- Logged-in actions use `wp_ajax_{action}`.
- Anonymous actions use `wp_ajax_nopriv_{action}` and must not trust the visitor with shop data.
- Verify with `check_ajax_referer()`.
- Return JSON with `wp_send_json_success()` or `wp_send_json_error()`. Do not echo SQL, file paths, or secrets in the error payload.

## REST routes

```php
register_rest_route(
    'example/v1',
    '/orders/(?P<id>\\d+)/desk-note',
    array(
        'methods'             => WP_REST_Server::EDITABLE,
        'callback'            => 'example_rest_save_desk_note',
        'permission_callback' => static function () {
            return current_user_can( 'edit_shop_orders' );
        },
        'args'                => array(
            'id'        => array( 'sanitize_callback' => 'absint' ),
            'desk_note' => array( 'sanitize_callback' => 'sanitize_text_field' ),
        ),
    )
);
```

The permission callback must authorize the object, not only the route. A user who can `edit_shop_orders` may still be blocked by a custom order cap. Check the specific order when the shop uses per-order restrictions.

Do not accept a user id, order id, or price from the client as proof of identity. Load the object and derive the price on the server.

## SQL

```php
$email = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
$rows  = $wpdb->get_results(
    $wpdb->prepare(
        'SELECT id FROM ' . $wpdb->prefix . 'wc_orders WHERE billing_email = %s',
        $email
    )
);
```

Pass every variable through `prepare()`. Do not concatenate table names from request data. Hard-code a known suffix and prefix it with `$wpdb->prefix`. Prefer `wc_get_orders()` for order lookup. The SQL above is only a pattern for a report you have already decided must run against the HPOS orders table.

## Uploads and files

- Use `wp_handle_upload()` and check the returned error.
- Allow a short extension list. Do not trust the browser MIME type alone.
- Store uploads outside executable locations when they are not meant to be public. Never use a request parameter as a filesystem path.
- `include` and `require` only files whose paths are built from constants you control.

## Gotchas

- `check_ajax_referer()` dies on failure by default. That is fine for AJAX. For a REST request, return a `WP_Error` with status 403 instead of dying.
- Nonces in HTML must be created for the same action string you later verify. Copying a WooCommerce nonce from another screen will fail, and it should.
- `current_user_can( 'administrator' )` misses shop managers who legitimately have `manage_woocommerce`, and it matches the wrong concept. Check the capability.
- `esc_html()` does not make a URL safe. Use `esc_url()`. `esc_attr()` does not make HTML body text safe. Escape for the context you are in.
- `unserialize()` on stored or posted data can instantiate objects. Store JSON, or use `maybe_unserialize()` only on data your own code wrote, and prefer JSON for new meta.
- A hidden form field such as `order_id` is attacker-controlled. Capability checks happen after you load that order, not instead of loading it.
- Logging `$_POST` on a checkout request can capture payment fields. Log ids and your own error codes.

## Verification

- Repeat the write while logged out. It does not change data.
- Repeat the write as a subscriber or customer. It does not change shop data.
- Repeat the write with the nonce removed. It does not change data.
- A REST callback with the permission callback removed is a failed review, even if the happy path works.
- An error response does not include a secret, a stack trace, or another customer's data.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
