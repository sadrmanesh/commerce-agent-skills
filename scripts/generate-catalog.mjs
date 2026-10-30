#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalogTable, loadRepository, replaceCatalog } from "./lib/skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function renderCatalog(repoRoot = root) {
  const repo = await loadRepository(repoRoot);
  const byName = new Map(repo.skills.map((skill) => [skill.name, skill]));
  const ordered = repo.order.map((name) => byName.get(name)).filter(Boolean);
  if (ordered.length !== repo.skills.length) {
    throw new Error("Catalog order does not match the skill directories. Run the validator.");
  }
  return buildCatalogTable(ordered);
}

export async function catalogMatchesReadme(repoRoot = root) {
  const readmePath = path.join(repoRoot, "README.md");
  const current = await readFile(readmePath, "utf8");
  const table = await renderCatalog(repoRoot);
  const next = replaceCatalog(current, table);
  return { readmePath, current, next, matches: current === next, table };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const check = process.argv.includes("--check");
  try {
    const result = await catalogMatchesReadme(root);
    if (check) {
      if (!result.matches) {
        console.error("README.md catalog is out of date. Run: node scripts/generate-catalog.mjs");
        process.exit(1);
      }
      console.log("README catalog is up to date.");
    } else {
      await writeFile(result.readmePath, result.next);
      console.log("Updated the README catalog.");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
