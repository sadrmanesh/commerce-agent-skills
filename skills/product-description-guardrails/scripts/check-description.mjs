#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const REFUSED = [
  { label: "cure", pattern: /\bcures?\b/i },
  { label: "clinically proven", pattern: /\bclinically proven\b/i },
  { label: "guaranteed to", pattern: /\bguaranteed to\b/i },
  { label: "100% effective", pattern: /\b100% effective\b/i },
  { label: "risk-free", pattern: /\brisk[- ]free\b/i },
];

export function checkProductDescription(description, source) {
  const errors = [];
  if (typeof description !== "string" || description.trim() === "") {
    return ["Description is empty."];
  }
  if (description.length > 5000) {
    errors.push(`Description is ${description.length} characters; the maximum is 5000.`);
  }
  if (!source || typeof source.price !== "string" || typeof source.currency !== "string") {
    errors.push("Source price and currency are required.");
    return errors;
  }
  const allowed = Array.isArray(source.allowedClaims) ? source.allowedClaims.join("\n") : "";
  for (const rule of REFUSED) {
    if (rule.pattern.test(description) && !rule.pattern.test(allowed)) {
      errors.push(`Unsupported claim: ${rule.label}`);
    }
  }
  for (const match of description.matchAll(/(\d+\.\d{2})\s+([A-Z]{3})/g)) {
    if (match[1] !== source.price || match[2] !== source.currency) {
      errors.push(`Price ${match[1]} ${match[2]} does not match ${source.price} ${source.currency}.`);
    }
  }
  return errors;
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const isCli = process.argv[1] && process.argv[1].endsWith("check-description.mjs");
if (isCli) {
  const descriptionFile = readOption("--description");
  const sourceFile = readOption("--source");
  if (!descriptionFile || !sourceFile) {
    console.error("Usage: node check-description.mjs --description copy.txt --source source.json");
    process.exit(2);
  }
  const description = await readFile(descriptionFile, "utf8");
  const source = JSON.parse(await readFile(sourceFile, "utf8"));
  const errors = checkProductDescription(description, source);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`ERROR ${error}`);
    }
    process.exit(1);
  }
  console.log("Description passed the local checks.");
}
