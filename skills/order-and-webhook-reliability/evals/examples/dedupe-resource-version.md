Store the topic, the order id, and `date_modified_gmt` as the inbox key.

A repeat with the same version is acknowledged and not applied again. Fetch the order when the payload is older than the row you already stored.
