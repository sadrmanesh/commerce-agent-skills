Use the SKU as the key and check every row first: duplicate SKUs, variations whose `Parent` is missing, and comma decimals. Then do a dry run that reports create, update, or skip for each row without writing.

Import categories and attributes, then variable parents, then variations under each parent. Write with the batch endpoint, 100 items per request, and after each batch save the map from source key to WooCommerce id. If the job crashes, rerunning it looks up each SKU first and updates instead of creating duplicates.
