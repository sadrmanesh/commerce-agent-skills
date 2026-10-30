Call the current REST API from the server.

```bash
curl --user "$WC_CONSUMER_KEY:$WC_CONSUMER_SECRET" \
  "https://shop.example/wp-json/wc/v3/orders"
```

Send the consumer key and secret as HTTP Basic authentication over HTTPS only.
