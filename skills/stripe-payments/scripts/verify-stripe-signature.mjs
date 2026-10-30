#!/usr/bin/env node
// Verify a Stripe-Signature header against a raw webhook body.
// Usage: STRIPE_WEBHOOK_SECRET=whsec_... node verify-stripe-signature.mjs <body-file> "<header>" [--now <unix seconds>]
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_TOLERANCE_SECONDS = 300;

export function parseStripeSignature(header) {
  const result = { timestamp: null, signatures: [] };
  for (const part of String(header ?? "").split(",")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === "t" && /^\d+$/.test(value)) result.timestamp = Number(value);
    if (key === "v1" && /^[0-9a-f]{64}$/.test(value)) result.signatures.push(value);
  }
  return result;
}

export function signStripePayload(rawBody, secret, timestamp) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
}

/** Returns a list of problems. An empty list means the delivery is authentic and fresh. */
export function verifyStripeSignature(rawBody, header, secret, { now = Math.floor(Date.now() / 1000), tolerance = DEFAULT_TOLERANCE_SECONDS } = {}) {
  if (typeof secret !== "string" || secret === "") return ["no webhook secret"];
  const { timestamp, signatures } = parseStripeSignature(header);
  const errors = [];
  if (timestamp === null) errors.push("missing t timestamp");
  if (signatures.length === 0) errors.push("missing v1 signature");
  if (errors.length > 0) return errors;
  if (Math.abs(now - timestamp) > tolerance) errors.push(`timestamp outside the ${tolerance} second tolerance`);
  const expected = Buffer.from(signStripePayload(rawBody, secret, timestamp), "hex");
  const matched = signatures.some((signature) => {
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
  if (!matched) errors.push("no v1 signature matches the body");
  return errors;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [file, header] = process.argv.slice(2);
  const nowIndex = process.argv.indexOf("--now");
  if (!file || !header) {
    console.error('Usage: STRIPE_WEBHOOK_SECRET=whsec_... node verify-stripe-signature.mjs <body-file> "<header>" [--now <seconds>]');
    process.exit(2);
  }
  const body = await readFile(file, "utf8");
  const options = nowIndex === -1 ? {} : { now: Number(process.argv[nowIndex + 1]) };
  const errors = verifyStripeSignature(body, header, process.env.STRIPE_WEBHOOK_SECRET, options);
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log("Signature valid.");
}
