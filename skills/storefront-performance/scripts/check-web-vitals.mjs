#!/usr/bin/env node
// Classify p75 Core Web Vitals per template.
// Usage: node check-web-vitals.mjs <vitals.json>
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
};

/** Rates one value as "good", "needs-improvement", or "poor". */
export function rate(metric, value) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) throw new Error(`unknown metric ${metric}`);
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error(`${metric} must be a number of 0 or more`);
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

/** Rates each row and says whether it passes (all three metrics good). */
export function checkWebVitals(rows) {
  return rows.map((row) => {
    const ratings = {};
    for (const metric of Object.keys(THRESHOLDS)) {
      ratings[metric] = row[metric] === undefined ? "missing" : rate(metric, row[metric]);
    }
    const passes = Object.values(ratings).every((rating) => rating === "good");
    return { template: row.template, device: row.device ?? "all", ratings, passes };
  });
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [file] = process.argv.slice(2);
  if (!file) {
    console.error("Usage: node check-web-vitals.mjs <vitals.json>");
    process.exit(2);
  }
  const results = checkWebVitals(JSON.parse(await readFile(file, "utf8")));
  for (const result of results) {
    const parts = Object.entries(result.ratings).map(([metric, rating]) => `${metric.toUpperCase()} ${rating}`);
    console.log(`${result.passes ? "pass" : "fail"}  ${result.template} (${result.device}): ${parts.join(", ")}`);
  }
  process.exit(results.every((result) => result.passes) ? 0 : 1);
}
