#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const AVAILABILITY = new Set([
  "BackOrder",
  "Discontinued",
  "InStock",
  "InStoreOnly",
  "LimitedAvailability",
  "OnlineOnly",
  "OutOfStock",
  "PreOrder",
  "PreSale",
  "SoldOut",
]);

export function checkProductJsonLd(data, profile = "merchant") {
  const errors = [];
  const warnings = [];
  const products = collectProducts(data);
  if (products.length === 0) {
    errors.push("No schema.org Product node found.");
    return { errors, warnings };
  }
  products.forEach((product, index) => checkProduct(product, profile, `Product[${index}]`, errors, warnings));
  return { errors, warnings };
}

function collectProducts(data) {
  if (Array.isArray(data)) {
    return data.flatMap((item) => collectProducts(item));
  }
  if (!data || typeof data !== "object") {
    return [];
  }
  const found = [];
  if (hasType(data, "Product")) {
    found.push(data);
  }
  if (Array.isArray(data["@graph"])) {
    found.push(...data["@graph"].flatMap((item) => collectProducts(item)));
  }
  return found;
}

function checkProduct(product, profile, label, errors, warnings) {
  if (!nonEmptyString(product.name)) {
    errors.push(`${label}: name is required`);
  }
  const hasReview = product.review !== undefined;
  const hasRating = product.aggregateRating !== undefined;
  const hasOffers = product.offers !== undefined;

  if (product.aggregateRating) {
    const rating = product.aggregateRating;
    if (typeof rating.ratingValue !== "number") {
      errors.push(`${label}: aggregateRating.ratingValue must be a number`);
    }
    if (typeof rating.reviewCount !== "number" && typeof rating.ratingCount !== "number") {
      errors.push(`${label}: aggregateRating needs reviewCount or ratingCount`);
    }
  }

  if (profile === "merchant") {
    if (!hasImage(product.image)) {
      errors.push(`${label}: merchant listings require image`);
    }
    if (!hasOffers) {
      errors.push(`${label}: merchant listings require offers`);
    } else {
      checkMerchantOffers(product.offers, `${label}.offers`, errors, warnings);
    }
  } else if (!hasReview && !hasRating && !hasOffers) {
    errors.push(`${label}: product snippets require review, aggregateRating, or offers`);
  } else if (hasOffers) {
    checkSnippetOffers(product.offers, `${label}.offers`, errors, warnings);
  }

  if (profile === "snippet" && !hasImage(product.image)) {
    warnings.push(`${label}: image is recommended`);
  }
}

function checkMerchantOffers(offers, label, errors, warnings) {
  if (Array.isArray(offers)) {
    errors.push(`${label}: merchant listings need one Offer, not an array`);
    return;
  }
  if (hasType(offers, "AggregateOffer")) {
    errors.push(`${label}: merchant listings need Offer, not AggregateOffer`);
    return;
  }
  if (!hasType(offers, "Offer")) {
    errors.push(`${label}: offers @type must be Offer`);
    return;
  }
  checkActivePrice(offers, label, errors, { requirePositive: true });
  checkAvailability(offers, label, warnings);
}

function checkSnippetOffers(offers, label, errors, warnings) {
  const list = Array.isArray(offers) ? offers : [offers];
  for (const [index, offer] of list.entries()) {
    const itemLabel = Array.isArray(offers) ? `${label}[${index}]` : label;
    if (hasType(offer, "AggregateOffer")) {
      if (typeof offer.lowPrice !== "number" || typeof offer.highPrice !== "number") {
        errors.push(`${itemLabel}: AggregateOffer needs numeric lowPrice and highPrice`);
      }
      if (!isoCurrency(offer.priceCurrency)) {
        errors.push(`${itemLabel}: AggregateOffer.priceCurrency must be a 3-letter ISO 4217 code`);
      }
      if (typeof offer.offerCount !== "number" || offer.offerCount < 1) {
        errors.push(`${itemLabel}: AggregateOffer.offerCount must be a positive number`);
      }
      continue;
    }
    if (!hasType(offer, "Offer")) {
      errors.push(`${itemLabel}: offers @type must be Offer or AggregateOffer`);
      continue;
    }
    checkActivePrice(offer, itemLabel, errors, { requirePositive: false });
    checkAvailability(offer, itemLabel, warnings);
  }
}

function checkActivePrice(offer, label, errors, { requirePositive }) {
  const direct = offer.price;
  const specified = offer.priceSpecification?.price;
  const currency = offer.price !== undefined ? offer.priceCurrency : offer.priceSpecification?.priceCurrency;
  const price = direct !== undefined ? direct : specified;
  if (typeof price !== "number" || Number.isNaN(price)) {
    errors.push(`${label}: price must be a JSON number`);
  } else if (requirePositive && price <= 0) {
    errors.push(`${label}: merchant listing price must be greater than zero`);
  } else if (direct !== undefined && specified !== undefined && direct <= 0 && specified > 0) {
    errors.push(`${label}: offers.price overrides priceSpecification and is not a positive price`);
  }
  if (!isoCurrency(currency)) {
    errors.push(`${label}: priceCurrency must be a 3-letter ISO 4217 code`);
  }
}

function checkAvailability(offer, label, warnings) {
  if (offer.availability === undefined) {
    warnings.push(`${label}: availability is recommended`);
    return;
  }
  const shortName = String(offer.availability).replace("https://schema.org/", "");
  if (!AVAILABILITY.has(shortName)) {
    warnings.push(`${label}: unrecognized availability value ${offer.availability}`);
  }
}

function hasImage(image) {
  if (typeof image === "string" && image.trim() !== "") {
    return true;
  }
  if (Array.isArray(image)) {
    return image.length > 0 && image.every((item) => hasImage(item));
  }
  if (image && typeof image === "object" && typeof image.url === "string") {
    return image.url.trim() !== "";
  }
  return false;
}

function hasType(node, type) {
  if (!node || typeof node !== "object") {
    return false;
  }
  const value = node["@type"];
  return value === type || (Array.isArray(value) && value.includes(type));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isoCurrency(value) {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) {
    return undefined;
  }
  return process.argv[index + 1];
}

const isCli = process.argv[1] && process.argv[1].endsWith("check-product-jsonld.mjs");
if (isCli) {
  const file = readOption("--file");
  const profile = readOption("--profile") ?? "merchant";
  if (!file || (profile !== "merchant" && profile !== "snippet")) {
    console.error("Usage: node check-product-jsonld.mjs --file product.json [--profile merchant|snippet]");
    process.exit(2);
  }
  const data = JSON.parse(await readFile(file, "utf8"));
  const result = checkProductJsonLd(data, profile);
  for (const warning of result.warnings) {
    console.error(`WARN ${warning}`);
  }
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`ERROR ${error}`);
    }
    process.exit(1);
  }
  console.log(`JSON-LD passed the ${profile} profile.`);
}
