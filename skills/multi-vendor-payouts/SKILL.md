---
name: multi-vendor-payouts
description: "Split a marketplace order by vendor, record commission as ledger entries, and pay vendors only settled amounts. Use when adding vendor catalogs, commissions, refunds that cross vendors, or payout batches."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.2.0"
---

# Multi-vendor payouts

Use this skill when more than one vendor sells on one order. Catalog shape is the product-catalog skill. Charging the shopper is the payment skill. This skill records who is owed what after that charge.

Do not name a vendor plugin's internal functions unless that plugin is in the project and you have read them. The ledger below is the model to implement, including when the store uses an existing multi-vendor extension.

## Procedure

1. Put `vendor_id` on every sellable line. A line without a vendor cannot be paid out.
2. On payment, write ledger entries. Do not edit the line price to "take commission". Commission is its own entry.
3. Decide, in data, who is merchant of record for the goods, the tax, and the shipping. Do not assume the vendor is.
4. Hold entries until the refund window or the delivery rule you stored. A payout batch sums only entries that are payable.
5. Send the payout with an idempotency key. A second run of the same batch does not pay twice.
6. A refund writes reversing entries. It does not delete the original lines.

The entry types are in [the ledger notes](references/ledger.md). Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## Ledger entry

Each entry has: `id`, `order_id`, `vendor_id` or `platform`, `type`, `amount` in integer minor units, `currency`, `available_at`, and `payout_id` once paid.

Amounts are signed. A sale credit to the vendor is positive. Commission the platform keeps is negative on the vendor and positive on the platform, or two explicit entries that sum to the same result. Pick one representation and use it everywhere.

`amount` uses the order currency. Do not convert to a payout currency inside the entry. Conversion, if it exists, is a later payout step with its own rate and timestamp.

## When money becomes payable

- Authorization is not a sale. Write no payable entry until the payment skill marks the order paid.
- `available_at` is at least the refund window, or the delivery confirmation, whichever the marketplace rule uses.
- Pending entries can be displayed as upcoming. They are excluded from the payout sum.

## Payout batch

- Select entries where `available_at` is in the past, `payout_id` is null, and the vendor account is allowed to receive funds.
- Group by vendor and currency.
- Persist the batch and stamp `payout_id` in the same transaction as the decision to pay.
- Call the payout provider with `payout_{batchId}`. If the call times out, retry with that key and do not create a second batch.
- A provider failure clears nothing silently. The batch stays `processing` or moves to `failed` with the entries still reserved, so a retry cannot select them into a new batch.

## Refunds

- Refund the shopper through the payment skill for the amount they paid.
- Reverse the vendor net and the commission in proportion to the refunded lines, including tax if the vendor was credited for tax.
- If the payout already left, the reversal is a negative balance on the next batch, not a deleted history.

## Gotchas

- One order can contain two vendors. A single commission percent on the order total assigns one vendor's shipping to the other.
- Paying the gross and also forgetting to retain commission overpays the vendor.
- Summing order totals again at payout time double-counts if the ledger is also summed.
- Blocking a vendor after entries are `processing` must not release those entries back into the selectable pool.

## Verification

- A paid two-vendor order produces entries whose vendor nets plus platform commission equal the goods total you intended to split.
- An unpaid order produces no payable entries.
- Running the payout job twice creates one provider payout per vendor.
- A refund after payout reduces the next batch and leaves the original entries in place.
