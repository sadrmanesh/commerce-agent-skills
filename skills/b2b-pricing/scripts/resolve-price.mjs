#!/usr/bin/env node
// Resolve a B2B unit price from price lists.
// Usage: node resolve-price.mjs <request.json> <lists.json>
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function roundMoney(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function inWindow(list, date) {
  if (!date) return true;
  if (list.validFrom && date < list.validFrom) return false;
  if (list.validTo && date > list.validTo) return false;
  return true;
}

function tierFor(list, request) {
  const entries = (list.entries ?? [])
    .filter((entry) => entry.sku === request.sku)
    .sort((a, b) => a.minQuantity - b.minQuantity);
  const eligible = entries.filter((entry) => entry.minQuantity <= request.quantity);
  if (eligible.length === 0) return null;
  const entry = eligible[eligible.length - 1];
  const next = entries.find((candidate) => candidate.minQuantity > request.quantity) ?? null;
  return { entry, next };
}

function unitPrice(entry, basePrice, decimals) {
  if (typeof entry.unitPrice === "number") return roundMoney(entry.unitPrice, decimals);
  if (typeof entry.percentOff === "number") {
    if (typeof basePrice !== "number") throw new Error(`${entry.sku}: percentOff needs basePrice`);
    return roundMoney(basePrice * (1 - entry.percentOff / 100), decimals);
  }
  throw new Error(`${entry.sku}: an entry needs unitPrice or percentOff`);
}

/**
 * Returns { unitPrice, source, list, minQuantity, nextTier }.
 * Contract lists (with `companies`) win. Otherwise `strategy` is "lowest" (default) or "priority".
 */
export function resolvePrice(request, lists, { decimals = 2 } = {}) {
  if (!Number.isInteger(request.quantity) || request.quantity <= 0) throw new Error("quantity must be a positive whole number");
  const active = lists.filter(
    (list) => inWindow(list, request.date) && (!request.currency || !list.currency || list.currency === request.currency),
  );
  const contracts = active.filter((list) => request.company && (list.companies ?? []).includes(request.company));
  const groupLists = active.filter((list) => (list.groups ?? []).some((group) => (request.groups ?? []).includes(group)));

  const candidates = [];
  for (const [source, pool] of [["contract", contracts], ["group", groupLists]]) {
    for (const list of pool) {
      const tier = tierFor(list, request);
      if (!tier) continue;
      candidates.push({
        unitPrice: unitPrice(tier.entry, request.basePrice, decimals),
        source,
        list: list.id,
        priority: list.priority ?? 0,
        minQuantity: tier.entry.minQuantity,
        nextTier: tier.next
          ? { minQuantity: tier.next.minQuantity, unitPrice: unitPrice(tier.next, request.basePrice, decimals) }
          : null,
      });
    }
    if (source === "contract" && candidates.length > 0) break;
  }

  if (candidates.length === 0) {
    if (typeof request.basePrice !== "number") throw new Error(`${request.sku}: no price list applies and no basePrice`);
    return { unitPrice: roundMoney(request.basePrice, decimals), source: "public", list: null, minQuantity: 1, nextTier: null };
  }
  const strategy = request.strategy ?? "lowest";
  candidates.sort((a, b) =>
    strategy === "priority" ? b.priority - a.priority || a.unitPrice - b.unitPrice : a.unitPrice - b.unitPrice || b.priority - a.priority,
  );
  const { priority: _priority, ...best } = candidates[0];
  return best;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [requestFile, listsFile] = process.argv.slice(2);
  if (!requestFile || !listsFile) {
    console.error("Usage: node resolve-price.mjs <request.json> <lists.json>");
    process.exit(2);
  }
  const request = JSON.parse(await readFile(requestFile, "utf8"));
  const lists = JSON.parse(await readFile(listsFile, "utf8"));
  console.log(JSON.stringify(resolvePrice(request, lists), null, 2));
}
