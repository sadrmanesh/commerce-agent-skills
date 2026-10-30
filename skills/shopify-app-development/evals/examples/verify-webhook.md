Compute the HMAC over the raw body with the app client secret and compare it to `X-Shopify-Hmac-Sha256`.

Reject the request when the digest does not match. Read `X-Shopify-Topic` only after that check.
