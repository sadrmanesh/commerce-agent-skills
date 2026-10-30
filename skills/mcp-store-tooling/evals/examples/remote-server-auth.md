Use Streamable HTTP behind TLS, and validate the `Origin` header on every request. Protect it with OAuth 2.1 and PKCE: answer unauthenticated requests with 401 and a `WWW-Authenticate` header pointing to Protected Resource Metadata (RFC 9728), which names the authorization server.

Accept only tokens issued for this server, map token scopes to tool groups (orders read, orders write, customers), keep store API keys on the server side, and log tool calls without personal data.
