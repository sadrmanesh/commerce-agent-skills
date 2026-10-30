# Stripe objects and events

## Objects

| Object | Id prefix | Use |
| --- | --- | --- |
| PaymentIntent | `pi_` | One payment attempt cycle for one order. Holds `amount`, `currency`, `status`, `metadata`, and `latest_charge`. |
| Checkout Session | `cs_` | A hosted payment page. Has `payment_status` (`paid`, `unpaid`, `no_payment_required`) and a `payment_intent`. |
| Charge | `ch_` | The movement of money behind a PaymentIntent. Refunds and disputes point at it. |
| Refund | `re_` | A full or partial refund. `status` is `pending`, `requires_action`, `succeeded`, `failed`, or `canceled`. |
| Dispute | `dp_` | A chargeback. Respond with evidence before `evidence_details.due_by`. |
| Event | `evt_` | A webhook delivery body. `id` is stable across retries, so use it for deduplication. |

## Events a store usually handles

| Event | Action |
| --- | --- |
| `payment_intent.succeeded` | Mark paid after checking amount and currency |
| `payment_intent.payment_failed` | Record the decline. Keep the order unpaid. |
| `payment_intent.canceled` | Cancel the order if still unpaid |
| `checkout.session.completed` | Mark paid if `payment_status` is `paid`. Otherwise wait. |
| `checkout.session.async_payment_succeeded` | Mark paid for a delayed method |
| `checkout.session.async_payment_failed` | Mark failed for a delayed method |
| `charge.refunded` | Reconcile refunds made outside the shop admin |
| `refund.updated` | Update a pending refund to succeeded or failed |
| `charge.dispute.created` | Flag the order and start the evidence task |

Subscribe the endpoint only to the events you handle. Every other event still has to return `2xx` if it arrives.

## Signature header

```text
Stripe-Signature: t=1730300000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

Compute `HMAC-SHA256(secret, "1730300000." + rawBody)` as lowercase hex and compare it with each `v1` value. During secret rotation the header can carry two `v1` values. Ignore `v0`.

## Requests

```bash
curl https://api.stripe.com/v1/payment_intents \
  -u "$STRIPE_SECRET_KEY:" \
  -H "Idempotency-Key: order-1042-attempt-1" \
  -d amount=1999 -d currency=usd \
  -d "automatic_payment_methods[enabled]=true" \
  -d "metadata[order_id]=1042"
```

```bash
curl https://api.stripe.com/v1/refunds \
  -u "$STRIPE_SECRET_KEY:" \
  -H "Idempotency-Key: refund-1042-1" \
  -d payment_intent=pi_123 -d amount=500
```
