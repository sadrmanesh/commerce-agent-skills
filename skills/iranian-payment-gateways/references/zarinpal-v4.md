# Zarinpal v4 notes

Base URL: `https://payment.zarinpal.com/pg/v4/payment/`. Bodies are JSON. Send `Content-Type: application/json` and `Accept: application/json`. A sandbox runs on `sandbox.zarinpal.com` with the same paths.

## Request

`POST request.json`

| Field | Required | Notes |
| --- | --- | --- |
| `merchant_id` | yes | 36-character merchant code. Keep it on the server. |
| `amount` | yes | Whole number |
| `currency` | no | `IRR` (Rial) or `IRT` (Toman) |
| `description` | yes | Shown to the shopper |
| `callback_url` | yes | Return page on the registered domain |
| `metadata` | no | `mobile`, `email`, and `order_id` |

Success: `data.code` is `100` and `data.authority` holds the payment token. Then redirect to `https://payment.zarinpal.com/pg/StartPay/{authority}`.

## Callback

The shopper returns to `callback_url?Authority=...&Status=OK` or `Status=NOK`. Only `OK` is worth verifying.

## Verify

`POST verify.json` with `merchant_id`, `amount`, and `authority`.

| Field | Notes |
| --- | --- |
| `data.code` | `100` verified now, `101` verified before |
| `data.ref_id` | Payment reference to show the shopper and store on the order |
| `data.card_pan` | Masked card number, such as `502229******5995` |
| `data.card_hash` | SHA-256 hash of the card, useful for risk checks without the number |
| `data.fee_type`, `data.fee` | Who paid the fee, and how much |

Errors arrive in `errors` with a negative `code` and a message. Log the code and message with the order id, never the `merchant_id`.

## Example

```bash
curl -X POST https://payment.zarinpal.com/pg/v4/payment/verify.json \
  -H 'content-type: application/json' -H 'accept: application/json' \
  -d '{"merchant_id":"'"$ZARINPAL_MERCHANT_ID"'","amount":1250000,"authority":"A000000000000000000000000000abcdef"}'
```
