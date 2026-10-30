import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  decodeWebhookSecret,
  signaturesMatch,
  verifyWooCommerceSignature,
  woocommerceSignature,
} from "../skills/order-and-webhook-reliability/scripts/verify-hmac-signature.mjs";

test("matches a base64 HMAC-SHA256 of the raw body", () => {
  const body = Buffer.from('{"id":10,"status":"processing"}');
  const secret = "topsecret";
  const expected = createHmac("sha256", secret).update(body).digest("base64");
  assert.equal(woocommerceSignature(secret, body), expected);
  assert.equal(verifyWooCommerceSignature({ secret, rawBody: body, signature: expected }).ok, true);
});

test("decodes the webhook secret the way WooCommerce does before hashing", () => {
  const body = "payload";
  const decoded = decodeWebhookSecret("a&#039;b&amp;c");
  assert.equal(decoded, "a'b&c");
  const signature = createHmac("sha256", decoded).update(body).digest("base64");
  assert.equal(woocommerceSignature("a&#039;b&amp;c", body), signature);
});

test("rejects a tampered body and a different-length signature", () => {
  const secret = "topsecret";
  const signature = woocommerceSignature(secret, "one");
  assert.equal(verifyWooCommerceSignature({ secret, rawBody: "two", signature }).ok, false);
  assert.equal(signaturesMatch(signature, "short"), false);
});
