#!/usr/bin/env node
// Check MCP tool definitions for store safety rules.
// Usage: node check-tool-definitions.mjs <tools.json>
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NAME = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const WRITE_VERB = /^(create|update|delete|refund|cancel|set|add|remove|bulk|send|apply|adjust)_/;
const RISKY_VERB = /^(delete|refund|cancel|bulk|remove)_/;

/** Returns a list of problems with a list of tool definitions. */
export function checkToolDefinitions(tools) {
  if (!Array.isArray(tools)) return ["tools must be an array"];
  const errors = [];
  const names = new Set();
  for (const [index, tool] of tools.entries()) {
    const label = typeof tool?.name === "string" ? tool.name : `tool ${index}`;
    if (!tool || typeof tool !== "object") {
      errors.push(`${label}: must be an object`);
      continue;
    }
    if (typeof tool.name !== "string" || !NAME.test(tool.name)) errors.push(`${label}: name must be lowercase snake_case`);
    else if (names.has(tool.name)) errors.push(`${label}: duplicate name`);
    else names.add(tool.name);
    if (typeof tool.description !== "string" || tool.description.trim().length < 20) errors.push(`${label}: description must be at least 20 characters`);
    if (tool.inputSchema?.type !== "object") errors.push(`${label}: inputSchema.type must be "object"`);
    const annotations = tool.annotations;
    if (!annotations || typeof annotations.readOnlyHint !== "boolean") {
      errors.push(`${label}: annotations.readOnlyHint must be set`);
      continue;
    }
    const writes = WRITE_VERB.test(tool.name ?? "");
    if (writes && annotations.readOnlyHint) errors.push(`${label}: looks like a write but readOnlyHint is true`);
    if (!annotations.readOnlyHint && typeof annotations.destructiveHint !== "boolean") {
      errors.push(`${label}: write tools must set destructiveHint`);
    }
    if (!annotations.readOnlyHint && typeof annotations.idempotentHint !== "boolean") {
      errors.push(`${label}: write tools must set idempotentHint`);
    }
    if (RISKY_VERB.test(tool.name ?? "")) {
      const properties = tool.inputSchema?.properties ?? {};
      if (!properties.dryRun) errors.push(`${label}: risky writes need a dryRun input`);
      if (!properties.confirm) errors.push(`${label}: risky writes need a confirm input`);
    }
    const list = /^list_/.test(tool.name ?? "");
    if (list) {
      const properties = tool.inputSchema?.properties ?? {};
      const perPage = properties.perPage ?? properties.limit;
      if (!perPage || typeof perPage.maximum !== "number") errors.push(`${label}: list tools need a perPage or limit with a maximum`);
    }
  }
  return errors;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [file] = process.argv.slice(2);
  if (!file) {
    console.error("Usage: node check-tool-definitions.mjs <tools.json>");
    process.exit(2);
  }
  const errors = checkToolDefinitions(JSON.parse(await readFile(file, "utf8")));
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log("Tool definitions look safe.");
}
