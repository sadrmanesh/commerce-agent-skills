After the first accepted submit, disable the pay control and send a stable idempotency key for that attempt.

The server returns the original order when the same key is retried. The cart remains if the provider declines.
