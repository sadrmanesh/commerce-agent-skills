# Marketplace ledger

## Entry types

| Type | Who is credited | When it is written |
| --- | --- | --- |
| `goods` | Vendor | Order is paid, for that vendor's line totals after line discounts |
| `commission` | Platform | Same moment, as the platform's share of those lines |
| `shipping` | Vendor or platform | Whoever the marketplace rule says keeps the shipping the shopper paid |
| `tax` | Vendor or platform | Whoever is responsible for remitting that tax |
| `refund_goods` | Reverses `goods` | Refund is confirmed |
| `refund_commission` | Reverses `commission` | Refund is confirmed |
| `adjustment` | Either | A person records a correction with a reason |

`goods` plus `commission` for a line equals the line total the shopper paid for those goods, before the shipping and tax entries. If commission is stored as a negative vendor entry instead of a platform entry, the vendor net is `goods + commission` and the platform total is the absolute commission. Do not store it both ways.

## Worked numbers

Shopper pays 100.00 for vendor goods. Commission is 10%. Vendor shipping is 0. The currency has two minor units.

- Vendor `goods`: `10000`
- Vendor `commission`: `-1000` if commission is a negative vendor entry
- Vendor payable after the hold: `9000`

Tax and shipping stay out of that 100.00 until their own entries exist. Do not subtract commission from the tax entry unless the contract says the commission base includes tax.

## Payout record

`id`, `vendor_id`, `currency`, `amount` (sum of reserved entries), `status` (`processing`, `paid`, `failed`), `idempotency_key`, `provider_payout_id`.

`paid` requires the provider id. `failed` keeps `idempotency_key` so the retry is the same payout.

## Merchant of record

Store `merchant_of_record` on the order or the line as `platform` or `vendor`. This is a business and legal choice the marketplace has already made. The ledger follows that flag. It does not decide it.
