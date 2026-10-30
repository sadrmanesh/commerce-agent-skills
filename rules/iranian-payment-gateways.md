# Iranian payment gateways

- Create the order unpaid and store the gateway `authority` before redirecting.
- Find the order on callback by `Authority` from your own record, not by an order id in the query.
- `Status=NOK` means failed or canceled. Do not call verify.
- `Status=OK` is not proof. Verify from the server with the same `amount` and `authority`.
- Verify code `100` marks the order paid once. Code `101` means already verified: no second receipt or stock change.
- One Toman (IRT) is ten Rial (IRR). Convert in one function and send the unit the gateway expects.
- Keep `merchant_id` on the server and out of logs.
- Reconcile unverified payments with a job, so paid shoppers are not refunded by the network.
