Find the order by the `Authority` query value stored when the request call returned. If `Status` is `NOK`, keep the order unpaid and show a retry link.

If `Status` is `OK`, call `verify.json` from the server with `merchant_id`, the same `amount`, and the `authority`. Code `100` marks the order paid and stores `ref_id` and the masked `card_pan`. Code `101` means it was verified before, so show the receipt without sending another email or reducing stock. Any other code leaves the order unpaid.
