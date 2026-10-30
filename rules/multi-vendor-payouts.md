# Multi-vendor payouts

- Put a `vendor_id` on every sellable line. Do not pay a line that has no vendor.
- Record commission as ledger entries. Do not rewrite the line price to remove the fee.
- Write payable entries only after the shopper's payment is confirmed. Authorization is not a payout.
- Hold entries until the stored refund window or delivery rule. Upcoming balance is not the payout sum.
- Stamp `payout_id` on entries in the same transaction that creates the batch. Retry the provider with the batch idempotency key.
- A refund adds reversing entries. Do not delete the original sale entries.
- Keep tax and shipping in their own entries, credited to the party the marketplace named.
- Sum the ledger at payout time. Do not also sum the original order totals.
- Record who is merchant of record. Do not assume it is the vendor.
