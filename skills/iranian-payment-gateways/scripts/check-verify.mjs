#!/usr/bin/env node
// Decide what a gateway verify response means for a stored order.
// Usage: node check-verify.mjs <order.json> <verify.json>
// order.json: { "total": 125000, "currency": "IRT", "authority": "A...", "gatewayCurrency": "IRR" }
// verify.json: the gateway response, such as Zarinpal's { "data": { "code": 100, "ref_id": 201 }, "errors": [] }
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UNITS = { IRR: 1, IRT: 10 };

/** Convert a whole amount between Rial (IRR) and Toman (IRT). */
export function convertIranianAmount(amount, from, to) {
  if (!Number.isInteger(amount) || amount < 0) throw new Error("amount must be a whole number");
  if (!(from in UNITS) || !(to in UNITS)) throw new Error("currency must be IRR or IRT");
  const rial = amount * UNITS[from];
  if (rial % UNITS[to] !== 0) throw new Error(`${amount} ${from} is not a whole amount in ${to}`);
  return rial / UNITS[to];
}

/**
 * Returns { outcome, errors, amount } where outcome is "paid", "already-paid", or "unpaid".
 * `amount` is what the request and verify calls must send in the gateway's currency.
 */
export function checkVerify(order, response, { authority, verifiedAmount } = {}) {
  const errors = [];
  const gatewayCurrency = order.gatewayCurrency ?? order.currency;
  let amount = null;
  try {
    amount = convertIranianAmount(order.total, order.currency, gatewayCurrency);
  } catch (error) {
    errors.push(error.message);
  }
  if (authority !== undefined && authority !== order.authority) {
    errors.push("callback Authority does not match the order");
  }
  if (verifiedAmount !== undefined && amount !== null && verifiedAmount !== amount) {
    errors.push(`verify sent ${verifiedAmount} but the order needs ${amount} ${gatewayCurrency}`);
  }
  const code = response?.data?.code;
  let outcome = "unpaid";
  if (code === 100) outcome = "paid";
  else if (code === 101) outcome = "already-paid";
  else errors.push(`gateway code ${code ?? response?.errors?.code ?? "missing"}: not verified`);
  if (outcome !== "unpaid" && response?.data?.ref_id === undefined) errors.push("verified response has no ref_id");
  if (errors.some((error) => !error.startsWith("gateway code"))) outcome = "unpaid";
  return { outcome, errors, amount };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [orderFile, responseFile] = process.argv.slice(2);
  if (!orderFile || !responseFile) {
    console.error("Usage: node check-verify.mjs <order.json> <verify.json>");
    process.exit(2);
  }
  const order = JSON.parse(await readFile(orderFile, "utf8"));
  const response = JSON.parse(await readFile(responseFile, "utf8"));
  const result = checkVerify(order, response);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.outcome === "unpaid" ? 1 : 0);
}
