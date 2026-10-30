#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const AVAILABILITY = new Set(["in_stock", "out_of_stock", "preorder", "backorder"]);

export function checkFeedItem(item) {
  const errors = [];
  if (!item || typeof item !== "object") {
    return ["Item must be an object."];
  }
  requireText(item.id, "id", 50, errors);
  const title = textValue(item, "title", "structured_title");
  const description = textValue(item, "description", "structured_description");
  if (title === undefined) {
    errors.push("title or structured_title.content is required");
  } else if (title.length > 150) {
    errors.push(`title is ${title.length} characters; the maximum is 150`);
  }
  if (description === undefined) {
    errors.push("description or structured_description.content is required");
  } else if (description.length > 5000) {
    errors.push(`description is ${description.length} characters; the maximum is 5000`);
  }
  requireUrl(item.link, "link", errors);
  requireUrl(item.image_link, "image_link", errors);
  if (!AVAILABILITY.has(item.availability)) {
    errors.push("availability must be in_stock, out_of_stock, preorder, or backorder");
  }
  if ((item.availability === "preorder" || item.availability === "backorder") && !nonEmpty(item.availability_date)) {
    errors.push("availability_date is required for preorder and backorder");
  }
  if (typeof item.price !== "string" || !/^\d+\.\d{2} [A-Z]{3}$/.test(item.price)) {
    errors.push('price must look like "15.00 USD"');
  }
  if (item.gtin !== undefined && !/^\d{8,14}$/.test(String(item.gtin))) {
    errors.push("gtin must be 8 to 14 digits when present");
  }
  return errors;
}

function textValue(item, plainKey, structuredKey) {
  if (nonEmpty(item[plainKey])) {
    return String(item[plainKey]);
  }
  const structured = item[structuredKey];
  if (structured && nonEmpty(structured.content)) {
    return String(structured.content);
  }
  return undefined;
}

function requireText(value, label, max, errors) {
  if (!nonEmpty(value)) {
    errors.push(`${label} is required`);
    return;
  }
  if (String(value).length > max) {
    errors.push(`${label} is ${String(value).length} characters; the maximum is ${max}`);
  }
}

function requireUrl(value, label, errors) {
  if (typeof value !== "string" || !/^https?:\/\/\S+$/.test(value)) {
    errors.push(`${label} must be an http or https URL`);
  }
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim() !== "";
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const isCli = process.argv[1] && process.argv[1].endsWith("check-feed-item.mjs");
if (isCli) {
  const file = readOption("--file");
  if (!file) {
    console.error("Usage: node check-feed-item.mjs --file item.json");
    process.exit(2);
  }
  const errors = checkFeedItem(JSON.parse(await readFile(file, "utf8")));
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`ERROR ${error}`);
    }
    process.exit(1);
  }
  console.log("Feed item passed the local checks.");
}
