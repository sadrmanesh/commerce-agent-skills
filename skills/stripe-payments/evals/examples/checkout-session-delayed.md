On `checkout.session.completed`, read `payment_status`. For a bank debit it is `unpaid`, so record the PaymentIntent id and leave the order on hold without fulfilling it.

When `checkout.session.async_payment_succeeded` arrives, verify it, check the amount, and mark the order paid. If `checkout.session.async_payment_failed` arrives instead, mark the order failed and email the shopper a link to pay again.
