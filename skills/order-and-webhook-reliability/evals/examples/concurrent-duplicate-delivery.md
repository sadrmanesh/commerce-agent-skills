Replace the check-then-insert with one atomic claim on the unique key.

Insert the inbox row for topic, order id, and `date_modified_gmt` with `INSERT ... ON CONFLICT DO NOTHING`. Only the request whose insert created the row applies the paid transition, and it records the fulfillment, the email, and the stock change in the same transaction that marks the row `applied`. The concurrent request whose insert hit the conflict returns 2xx with the stored result and runs no side effect, so the order is fulfilled once.
