#!/usr/bin/env node
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";

/**
 * WooCommerce signs the raw JSON body with HMAC-SHA256 and Base64.
 * The secret is passed through wp_specialchars_decode( $secret, ENT_QUOTES )
 * before hashing. decodeWebhookSecret matches that decode.
 */
export function decodeWebhookSecret(secret) {
  return secret
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

export function woocommerceSignature(secret, rawBody) {
  const key = decodeWebhookSecret(secret);
  return createHmac("sha256", key).update(rawBody).digest("base64");
}

export function signaturesMatch(expected, received) {
  if (typeof expected !== "string" || typeof received !== "string") {
    return false;
  }
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length === 0 || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function verifyWooCommerceSignature({ secret, rawBody, signature }) {
  const expected = woocommerceSignature(secret, rawBody);
  return {
    ok: signaturesMatch(expected, signature),
    expected,
  };
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) {
    return undefined;
  }
  return process.argv[index + 1];
}

const isCli = process.argv[1] && process.argv[1].endsWith("verify-hmac-signature.mjs");
if (isCli) {
  const bodyPath = readOption("--body");
  const signature = readOption("--signature");
  const secretFile = readOption("--secret-file");
  const secret = secretFile ? (await readFile(secretFile, "utf8")).replace(/\r?\n$/, "") : process.env.WEBHOOK_SECRET;

  if (!bodyPath || !signature || !secret) {
    console.error(
      "Usage: node verify-hmac-signature.mjs --body payload.json --signature <base64> (--secret-file secret.txt | WEBHOOK_SECRET=...)",
    );
    process.exit(2);
  }

  const rawBody = await readFile(bodyPath);
  const result = verifyWooCommerceSignature({
    secret,
    rawBody,
    signature,
  });
  if (!result.ok) {
    console.error("Signature mismatch.");
    process.exit(1);
  }
  console.log("Signature matches.");
}
