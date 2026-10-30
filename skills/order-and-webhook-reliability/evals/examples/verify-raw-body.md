Sign the comparison with the original raw body.

Compute Base64 HMAC-SHA256 over those bytes with the webhook secret. Parse JSON only after the signature matches, and compare with a constant-time check.
