#!/usr/bin/env node
// Allocate order lines to stock locations: one location if possible, otherwise the fewest.
// Usage: node allocate-stock.mjs <order.json> <stock.json>
// order.json: { "lines": [{ "sku": "TEE-M", "quantity": 2 }], "destination": "DE" }
// stock.json: [{ "location": "berlin", "ships": ["DE", "AT"], "rank": 1, "levels": { "TEE-M": { "onHand": 5, "reserved": 1, "safetyStock": 0 } } }]
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function availableAt(location, sku) {
  const level = location.levels?.[sku];
  if (!level) return 0;
  return Math.max(0, (level.onHand ?? 0) - (level.reserved ?? 0) - (level.safetyStock ?? 0));
}

/**
 * Returns { allocations: [{ sku, location, quantity }], shortfalls: [{ sku, quantity }], locations }.
 * Never allocates more than a location has available.
 */
export function allocateOrder(order, stock) {
  const eligible = stock
    .filter((location) => location.active !== false)
    .filter((location) => !order.destination || !location.ships || location.ships.includes(order.destination))
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const lines = order.lines ?? [];
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new Error(`${line.sku}: quantity must be a positive whole number`);
  }

  const single = eligible.find((location) => lines.every((line) => availableAt(location, line.sku) >= line.quantity));
  if (single) {
    const allocations = lines.map((line) => ({ sku: line.sku, location: single.location, quantity: line.quantity }));
    return { allocations, shortfalls: [], locations: [single.location] };
  }

  const remaining = new Map(eligible.map((location) => [location.location, { ...location.levels }]));
  const allocations = [];
  const shortfalls = [];
  const used = new Set();
  for (const line of lines) {
    let needed = line.quantity;
    // Prefer locations already used for this order, then by rank.
    const ordered = [...eligible].sort((a, b) => Number(used.has(b.location)) - Number(used.has(a.location)));
    for (const location of ordered) {
      if (needed === 0) break;
      const levels = remaining.get(location.location);
      const free = availableAt({ levels }, line.sku);
      if (free === 0) continue;
      const take = Math.min(free, needed);
      allocations.push({ sku: line.sku, location: location.location, quantity: take });
      levels[line.sku] = { ...levels[line.sku], reserved: (levels[line.sku].reserved ?? 0) + take };
      used.add(location.location);
      needed -= take;
    }
    if (needed > 0) shortfalls.push({ sku: line.sku, quantity: needed });
  }
  return { allocations, shortfalls, locations: [...used] };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [orderFile, stockFile] = process.argv.slice(2);
  if (!orderFile || !stockFile) {
    console.error("Usage: node allocate-stock.mjs <order.json> <stock.json>");
    process.exit(2);
  }
  const order = JSON.parse(await readFile(orderFile, "utf8"));
  const stock = JSON.parse(await readFile(stockFile, "utf8"));
  const result = allocateOrder(order, stock);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.shortfalls.length > 0 ? 1 : 0);
}
