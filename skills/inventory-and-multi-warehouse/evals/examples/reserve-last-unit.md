Keep `on_hand` and `reserved` per SKU and location, and compute `available` as on hand minus reserved minus safety stock.

Reserve with one conditional update: `UPDATE stock_levels SET reserved = reserved + 1 WHERE sku = 'MUG-RED' AND location_id = 'main' AND on_hand - reserved - safety_stock >= 1`. The first checkout updates one row and continues. The second updates zero rows and is told the item is out of stock. Insert a `reserve` movement in the same transaction, and release it if payment fails.
