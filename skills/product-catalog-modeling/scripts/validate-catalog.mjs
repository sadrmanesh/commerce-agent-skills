#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const TYPES = new Set(["simple", "variable", "external", "grouped"]);
const BACKORDERS = new Set(["no", "notify", "yes"]);
const STOCK_STATUS = new Set(["instock", "outofstock", "onbackorder"]);

export function validateCatalog(document) {
  const errors = [];
  if (!document || !Array.isArray(document.products)) {
    return ["Catalog root must be an object with a products array."];
  }

  const productIds = new Set();
  const skus = new Set();

  for (const [index, product] of document.products.entries()) {
    const label = `products[${index}]`;
    if (!product || typeof product !== "object") {
      errors.push(`${label} must be an object`);
      continue;
    }
    if (!isId(product.id)) {
      errors.push(`${label}.id must be a non-empty string`);
    } else if (productIds.has(product.id)) {
      errors.push(`${label}.id duplicates ${product.id}`);
    } else {
      productIds.add(product.id);
    }
    if (!TYPES.has(product.type)) {
      errors.push(`${label}.type must be simple, variable, external, or grouped`);
      continue;
    }
    if (typeof product.name !== "string" || product.name.trim() === "") {
      errors.push(`${label}.name is required`);
    }

    if (product.type === "simple") {
      requireSku(product.sku, skus, `${label}.sku`, errors);
      requirePrice(product, label, errors);
      checkStock(product.stock, `${label}.stock`, errors, false);
      reject(product.variants, `${label}.variants`, "simple products have no variants", errors);
    } else if (product.type === "external") {
      requireSku(product.sku, skus, `${label}.sku`, errors);
      requirePrice(product, label, errors);
      if (typeof product.productUrl !== "string" || product.productUrl.trim() === "") {
        errors.push(`${label}.productUrl is required for external products`);
      }
      reject(product.variants, `${label}.variants`, "external products have no variants", errors);
    } else if (product.type === "grouped") {
      if (!Array.isArray(product.children) || product.children.length === 0) {
        errors.push(`${label}.children must list at least one product id`);
      }
      if (product.price !== undefined) {
        errors.push(`${label}.price belongs on the child products, not the grouped parent`);
      }
      reject(product.variants, `${label}.variants`, "grouped products have no variants", errors);
    } else {
      checkVariable(product, label, skus, errors);
    }
  }

  const known = new Set(document.products.filter((product) => product && isId(product.id)).map((product) => product.id));
  for (const [index, product] of document.products.entries()) {
    if (!product || product.type !== "grouped" || !Array.isArray(product.children)) {
      continue;
    }
    for (const child of product.children) {
      if (!known.has(child) || child === product.id) {
        errors.push(`products[${index}].children references unknown id ${child}`);
      }
    }
  }

  return errors;
}

function checkVariable(product, label, skus, errors) {
  if (product.sku !== null) {
    errors.push(`${label}.sku must be null; put SKUs on variants`);
  }
  if (product.price !== undefined) {
    errors.push(`${label}.price must live on each variant so the purchasable price is explicit`);
  }
  const attributes = Array.isArray(product.attributes) ? product.attributes : [];
  const variationAttributes = attributes.filter((attribute) => attribute && attribute.variation === true);
  if (variationAttributes.length === 0) {
    errors.push(`${label} needs at least one attribute with variation: true`);
  }
  const optionsByCode = new Map();
  const codes = new Set();
  for (const [index, attribute] of attributes.entries()) {
    const attributeLabel = `${label}.attributes[${index}]`;
    if (!attribute || !isId(attribute.code)) {
      errors.push(`${attributeLabel}.code is required`);
      continue;
    }
    if (codes.has(attribute.code)) {
      errors.push(`${attributeLabel}.code duplicates ${attribute.code}`);
    }
    codes.add(attribute.code);
    if (!Array.isArray(attribute.options) || attribute.options.length === 0 || attribute.options.some((option) => typeof option !== "string" || option === "")) {
      errors.push(`${attributeLabel}.options must be a non-empty list of strings`);
    } else if (new Set(attribute.options).size !== attribute.options.length) {
      errors.push(`${attributeLabel}.options contains a duplicate`);
    }
    optionsByCode.set(attribute.code, new Set(attribute.options ?? []));
  }

  if (!Array.isArray(product.variants) || product.variants.length === 0) {
    errors.push(`${label}.variants must contain at least one variant`);
    return;
  }

  const combinations = new Set();
  const variantIds = new Set();
  for (const [index, variant] of product.variants.entries()) {
    const variantLabel = `${label}.variants[${index}]`;
    if (!variant || typeof variant !== "object") {
      errors.push(`${variantLabel} must be an object`);
      continue;
    }
    if (!isId(variant.id)) {
      errors.push(`${variantLabel}.id is required`);
    } else if (variantIds.has(variant.id)) {
      errors.push(`${variantLabel}.id duplicates ${variant.id}`);
    } else {
      variantIds.add(variant.id);
    }
    requireSku(variant.sku, skus, `${variantLabel}.sku`, errors);
    requirePrice(variant, variantLabel, errors);
    checkStock(variant.stock, `${variantLabel}.stock`, errors, true);
    const chosen = variant.attributes;
    if (!chosen || typeof chosen !== "object" || Array.isArray(chosen)) {
      errors.push(`${variantLabel}.attributes must map attribute codes to option values`);
      continue;
    }
    const keys = Object.keys(chosen).sort();
    const expected = variationAttributes.map((attribute) => attribute.code).filter(Boolean).sort();
    if (keys.join("|") !== expected.join("|")) {
      errors.push(`${variantLabel}.attributes must set exactly the variation attributes (${expected.join(", ")})`);
    }
    for (const key of keys) {
      const allowed = optionsByCode.get(key);
      if (!allowed || !allowed.has(chosen[key])) {
        errors.push(`${variantLabel}.attributes.${key} value ${JSON.stringify(chosen[key])} is not an option`);
      }
    }
    const signature = expected.map((key) => `${key}=${chosen[key]}`).join("&");
    if (combinations.has(signature)) {
      errors.push(`${variantLabel} repeats combination ${signature}`);
    }
    combinations.add(signature);
  }
}

function requireSku(sku, skus, label, errors) {
  if (typeof sku !== "string" || sku.trim() === "") {
    errors.push(`${label} is required`);
    return;
  }
  if (skus.has(sku)) {
    errors.push(`${label} duplicates SKU ${sku}`);
    return;
  }
  skus.add(sku);
}

function requirePrice(record, label, errors) {
  if (typeof record.price !== "string" || !/^\d+\.\d{2}$/.test(record.price)) {
    errors.push(`${label}.price must be a decimal string with two places, such as "19.00"`);
  }
  if (typeof record.currency !== "string" || !/^[A-Z]{3}$/.test(record.currency)) {
    errors.push(`${label}.currency must be a 3-letter ISO 4217 code`);
  }
}

function checkStock(stock, label, errors, required) {
  if (stock === undefined) {
    if (required) {
      errors.push(`${label} is required`);
    }
    return;
  }
  if (!stock || typeof stock !== "object") {
    errors.push(`${label} must be an object`);
    return;
  }
  if (typeof stock.managed !== "boolean") {
    errors.push(`${label}.managed must be true or false`);
  }
  if (stock.managed === true) {
    if (!Number.isInteger(stock.quantity) || stock.quantity < 0) {
      errors.push(`${label}.quantity must be an integer of zero or more when stock is managed`);
    }
  } else if (stock.quantity !== null && stock.quantity !== undefined) {
    errors.push(`${label}.quantity must be null when stock is not managed`);
  }
  if (!BACKORDERS.has(stock.backorders)) {
    errors.push(`${label}.backorders must be no, notify, or yes`);
  }
  if (stock.status !== undefined && !STOCK_STATUS.has(stock.status)) {
    errors.push(`${label}.status must be instock, outofstock, or onbackorder`);
  }
}

function reject(value, label, message, errors) {
  if (value !== undefined && !(Array.isArray(value) && value.length === 0)) {
    errors.push(`${label}: ${message}`);
  }
}

function isId(value) {
  return typeof value === "string" && value.trim() !== "";
}

const isCli = process.argv[1] && process.argv[1].endsWith("validate-catalog.mjs");
if (isCli) {
  const fileFlag = process.argv.indexOf("--file");
  const file = fileFlag === -1 ? undefined : process.argv[fileFlag + 1];
  if (!file) {
    console.error("Usage: node validate-catalog.mjs --file catalog.json");
    process.exit(2);
  }
  const document = JSON.parse(await readFile(file, "utf8"));
  const errors = validateCatalog(document);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`ERROR ${error}`);
    }
    process.exit(1);
  }
  console.log("Catalog is valid.");
}
