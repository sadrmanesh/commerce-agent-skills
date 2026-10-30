# MCP store tooling

- One tool per job, named `verb_noun`. Never a free-form REST passthrough.
- Set `readOnlyHint`, `destructiveHint`, `idempotentHint`, and `openWorldHint` honestly. They are hints, so enforce scopes on the server too.
- Every tool has an object `inputSchema` with bounds; structured results use `outputSchema` and `structuredContent`.
- Report tool failures with `isError: true` and an actionable message.
- Default to read-only. Require a scope per write area.
- Refunds, deletes, and bulk changes take `dryRun` and need `confirm: true`.
- Cap list page sizes and return a way to get the next page.
- Redact personal data without the customer scope. Keep API keys out of output and logs.
- Remote servers use Streamable HTTP, check `Origin`, and use OAuth with RFC 9728 metadata.
