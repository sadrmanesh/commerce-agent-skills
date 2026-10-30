# Subscription states

## Allowed transitions

| From | Event | To |
| --- | --- | --- |
| `trialing` | Trial converts and the first charge succeeds | `active` |
| `trialing` | Shopper cancels during the trial | `canceled` |
| `active` | Renewal charge succeeds | `active` with the next period |
| `active` | Renewal charge fails | `past_due` |
| `active` | Cancel at period end | `active` with `cancel_at_period_end` |
| `active` plus `cancel_at_period_end` | Period end | `canceled` |
| `past_due` | Retry or updated payment method succeeds | `active` |
| `past_due` | Retry schedule exhausted | `canceled` or access-off, as configured |
| `active` or `past_due` | Pause | `paused` |
| `paused` | Resume | `active` only after a successful charge if a period was missed |

No other transition should be reachable from a client request. Unknown provider statuses do not move the contract. Store the raw provider status beside your mapped status so a person can reconcile it.

## Platform mapping

- Shopify: selling plans and subscription contracts are the native model. Follow the subscription APIs for the app's configured version. Do not store the contract only as a metafield you update from the browser.
- WooCommerce Subscriptions: it is not WooCommerce core. Renewal orders and payment completion belong to that extension. Do not create renewal orders with `wp_insert_post` or `update_post_meta`. If you are on HPOS, use the extension's order APIs the same way the WooCommerce plugin skill requires for any other order.

## Idempotency key

`sub_{subscriptionId}_period_{periodStartIso}`. Reuse it for every retry of that period. A plan change that creates a proration invoice uses a different key that includes the change id.
