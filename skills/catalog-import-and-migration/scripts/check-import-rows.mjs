#!/usr/bin/env node
// Check catalog rows before an import.
// Usage: node check-import-rows.mjs <rows.json>
// rows.json: [{ "sku": "TEE", "type": "variable", "name": "Tee" }, { "sku": "TEE-M", "type": "variation", "parent": "TEE", "regularPrice": "19.90", "stock": 4 }]
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = new Set(["simple", "variable", "variation", "grouped", "external"]);
const PRICE = /^\d+(?:\.\d{1,4})?$/;

/** Returns a list of problems, one string per problem, with the row number (1-based). */
export function checkImportRows(rows) {
  if (!Array.isArray(rows)) return ["rows must be an array"];
  const errors = [];
  const seen = new Map();
  const parents = new Map();
  rows.forEach((row, index) => {
    const label = `row ${index + 1}`;
    if (!row || typeof row !== "object") {
      errors.push(`${label}: must be an object`);
      return;
    }
    const type = row.type ?? "simple";
    if (!TYPES.has(type)) errors.push(`${label}: unknown type ${type}`);
    const sku = typeof row.sku === "string" ? row.sku.trim() : "";
    if (sku === "") {
      errors.push(`${label}: missing sku`);
    } else if (seen.has(sku)) {
      errors.push(`${label}: duplicate sku ${sku} (first on row ${seen.get(sku)})`);
    } else {
      seen.set(sku, index + 1);
      if (type === "variable") parents.set(sku, index + 1);
    }
    if (typeof row.sku === "number") errors.push(`${label}: sku must be text, not a number`);
    if (type !== "variation" && (typeof row.name !== "string" || row.name.trim() === "")) errors.push(`${label}: missing name`);
    for (const field of ["regularPrice", "salePrice"]) {
      if (row[field] === undefined || row[field] === "") continue;
      if (!PRICE.test(String(row[field]))) errors.push(`${label}: ${field} "${row[field]}" must use digits and a . decimal`);
    }
    if (row.salePrice && row.regularPrice && Number(row.salePrice) >= Number(row.regularPrice)) {
      errors.push(`${label}: salePrice must be lower than regularPrice`);
    }
    if (row.stock !== undefined && (!Number.isInteger(row.stock) || row.stock < 0)) {
      errors.push(`${label}: stock must be a whole number of 0 or more`);
    }
  });
  rows.forEach((row, index) => {
    if (row?.type !== "variation") return;
    const label = `row ${index + 1}`;
    if (!row.parent) {
      errors.push(`${label}: variation without parent`);
    } else if (!parents.has(row.parent)) {
      errors.push(`${label}: parent ${row.parent} is not a variable product in this file`);
    } else if (parents.get(row.parent) > index + 1) {
      errors.push(`${label}: parent ${row.parent} comes after its variation; sort parents first`);
    }
  });
  return errors;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [file] = process.argv.slice(2);
  if (!file) {
    console.error("Usage: node check-import-rows.mjs <rows.json>");
    process.exit(2);
  }
  const errors = checkImportRows(JSON.parse(await readFile(file, "utf8")));
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log("Rows look importable.");
}
