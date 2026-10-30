# Returns and refunds

- Keep each return as its own record (RMA) linked to the order, with lines, reason, and state.
- Check the return window, returnable flags, and already returned quantities on the server.
- Refund from the inspection result, not from the request.
- Restock only resellable units, as a `return` stock movement. Quarantine damaged units.
- Refund through the original payment method with an idempotency key. Store the provider refund id.
- Never refund more than was captured. Check earlier refunds inside the transaction.
- Refund tax in proportion. Refund shipping only when the policy says so.
- A partial refund keeps the order paid for the rest.
