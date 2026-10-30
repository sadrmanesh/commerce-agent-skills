# Fraud and risk basics

- Let the payment provider collect card data. Do not store PAN or CVV. Store the provider payment id and result codes.
- Treat AVS, CVV, and 3-D Secure results as signals. Do not treat a match as proof or a mismatch as automatic fraud.
- Do not capture while 3-D Secure is still pending.
- Put high-amount AVS or CVV mismatches and velocity spikes into a review queue. Do not auto-capture the queue on a timer.
- Ignore a risk flag supplied by the browser.
- A payment amount or currency mismatch is not captured.
- Velocity keys use account, address hash, or provider customer id. They do not use a card number.
- Review decisions record the reviewer and call the provider idempotently for capture or void.
- Keep the cart and leave the order unpaid when the provider declines. Do not retry the charge in a loop.
