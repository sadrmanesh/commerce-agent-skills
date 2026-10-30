Verify the signature over the raw body, then ignore a duplicate.

Store the provider payment id. If that id is already on the order, return 200 without a second capture. Use the same idempotency key when the original charge request times out.
