# MCP notes

## Tool definition

```json
{
  "name": "create_refund",
  "title": "Refund an order",
  "description": "Refund part or all of a paid order. Use dryRun first to preview, then confirm.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "orderId": { "type": "integer", "minimum": 1 },
      "amount": { "type": "string", "pattern": "^\\d+(\\.\\d{1,2})?$" },
      "reason": { "type": "string", "maxLength": 200 },
      "dryRun": { "type": "boolean", "default": true },
      "confirm": { "type": "boolean", "default": false }
    },
    "required": ["orderId", "amount"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "refundId": { "type": ["integer", "null"] },
      "applied": { "type": "boolean" },
      "remaining": { "type": "string" }
    },
    "required": ["applied", "remaining"]
  },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": true,
    "idempotentHint": false,
    "openWorldHint": false
  }
}
```

## Annotations

| Annotation | Meaning | Default when absent |
| --- | --- | --- |
| `readOnlyHint` | Does not change anything | false |
| `destructiveHint` | May delete or overwrite (only for writes) | true |
| `idempotentHint` | Calling again with the same input has no extra effect (only for writes) | false |
| `openWorldHint` | Talks to systems outside the server's own domain | true |

## Result shape

```json
{
  "content": [{ "type": "text", "text": "Dry run: would refund 12.00 of order 1042. 38.00 would remain." }],
  "structuredContent": { "refundId": null, "applied": false, "remaining": "38.00" },
  "isError": false
}
```

## Resources and prompts

- Resources are read by URI, for example `store://settings` or `store://orders/1042`. Use them for context the agent reads, not for actions.
- Prompts are named templates such as `weekly-stock-review` that the user picks.

## Remote servers

- Streamable HTTP uses one endpoint for POST and an optional GET stream. Validate `Origin` to stop DNS rebinding.
- OAuth 2.1 with PKCE. The server answers 401 with a `WWW-Authenticate` header pointing to its Protected Resource Metadata (RFC 9728), which names the authorization server.
- Check that each token was issued for this server (audience) and carries the scope the tool needs.
