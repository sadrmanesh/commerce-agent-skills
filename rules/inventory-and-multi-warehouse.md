# Inventory and multi-warehouse

- Key stock by SKU or variation and location.
- Keep `on_hand`, `reserved`, and safety stock. Sell only from `available`.
- Change stock through movement rows with a kind, quantity, and reference. Do not overwrite totals.
- Reserve with one conditional update or a row lock. Never read and then write in separate steps.
- Reservations expire. Release them on failed payment or timeout.
- Allocate to one location when it can fill the whole order. Split across the fewest locations otherwise.
- Stock in transit is not available at either end of a transfer.
- Returns go to inspection before they become available again.
