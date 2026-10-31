Treat the retry after a timeout as a duplicate of an event you already applied.

Look up the inbox row by topic, order id, and `date_modified_gmt`. When its status is already `applied`, return 2xx with the original result and run no side effect: no second fulfillment, no second confirmation email, and no second stock decrement. Record the fulfillment, the email, and the stock change in the same transaction that marks the row `applied`, so the first attempt either did all of them once or none of them.
