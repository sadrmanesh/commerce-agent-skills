# Shopify app development

- Configure the API version and app-specific webhooks in `shopify.app.toml`. Do not hard-code an API version in a handler.
- Authenticate before trusting a shop domain. Embedded admin requests need a validated session token. App proxy signatures do not authorize shop changes.
- Use the GraphQL Admin API for new admin work, with the narrowest scope that mutation needs.
- Verify HTTPS webhooks with HMAC-SHA256 of the raw body and the app client secret. The header is `X-Shopify-Hmac-Sha256`. Compare header names case-insensitively.
- Dedupe webhook retries with `X-Shopify-Webhook-Id`. Do not trust topic or shop headers before the HMAC matches.
- Read GraphQL `userErrors` even when the HTTP status is 200.
- Keep the previous client secret only for the rotation window Shopify documents, up to an hour, and do not log tokens or secrets.
- Reject shop domains that are not anchored to one `myshopify.com` host.
