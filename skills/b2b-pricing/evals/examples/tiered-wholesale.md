The unit price is resolved on the server by one function used by the product page, the cart, and order placement. The wholesale group has a price list with two entries for the mug: `minQuantity` 1 at 9.00 and `minQuantity` 10 at 8.50.

A wholesale buyer ordering 9 mugs gets 9.00 each and sees "10 or more: 8.50 each". At 10 mugs the line is priced at 8.50 each. A guest matches no list and pays the public 11.00. The product page cache varies by group so the wholesale price is never shown to guests.
