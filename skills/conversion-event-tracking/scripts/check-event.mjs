#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const NAMES = new Set([
  "view_item",
  "add_to_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "refund",
]);

export function checkCommerceEvent(event) {
  const errors = [];
  if (!event || typeof event !== "object") {
    return ["Event must be an object."];
  }
  if (!NAMES.has(event.name)) {
    errors.push(`Unsupported event name: ${String(event.name)}`);
    return errors;
  }
  const params = event.params;
  if (!params || typeof params !== "object") {
    return ["Event params are required."];
  }
  if (!Array.isArray(params.items) || params.items.length === 0) {
    errors.push("items must contain at least one item");
  } else {
    params.items.forEach((item, index) => {
      if (!item || (typeof item.item_id !== "string" && typeof item.item_name !== "string")) {
        errors.push(`items[${index}] needs item_id or item_name`);
      }
    });
  }
  if (params.value !== undefined && (typeof params.currency !== "string" || !/^[A-Z]{3}$/.test(params.currency))) {
    errors.push("currency is required when value is set and must be an ISO 4217 code");
  }
  if (event.name === "purchase" || event.name === "refund") {
    if (typeof params.transaction_id !== "string" || params.transaction_id.trim() === "") {
      errors.push(`${event.name} requires a non-empty transaction_id`);
    }
    if (typeof params.value !== "number") {
      errors.push(`${event.name} requires a numeric value`);
    }
  }
  if (event.name === "purchase" && Array.isArray(params.items)) {
    const priced = params.items.every((item) => typeof item?.price === "number" && typeof item?.quantity === "number");
    if (priced && typeof params.value === "number") {
      const sum = params.items.reduce((total, item) => total + item.price * item.quantity, 0);
      if (Math.abs(sum - params.value) > 0.001) {
        errors.push("value must equal the sum of price times quantity and must exclude tax and shipping");
      }
    }
  }
  return errors;
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const isCli = process.argv[1] && process.argv[1].endsWith("check-event.mjs");
if (isCli) {
  const file = readOption("--file");
  if (!file) {
    console.error("Usage: node check-event.mjs --file event.json");
    process.exit(2);
  }
  const errors = checkCommerceEvent(JSON.parse(await readFile(file, "utf8")));
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`ERROR ${error}`);
    }
    process.exit(1);
  }
  console.log("Event passed the local checks.");
}
