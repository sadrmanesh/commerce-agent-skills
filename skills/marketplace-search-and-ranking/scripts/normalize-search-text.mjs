#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const BIDI_MARKS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const ARABIC_YEH = /\u064A/g;
const ARABIC_KAF = /\u0643/g;
const PERSIAN_DIGITS = /[\u06F0-\u06F9]/g;
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669]/g;

/**
 * Normalize catalog and query text before analysis.
 * Folds Persian and Arabic letter variants, maps digits to ASCII, drops ZWNJ
 * and bidi marks, and lowercases Latin text.
 */
export function normalizeSearchText(text) {
  const folded = String(text)
    .normalize("NFC")
    .replace(BIDI_MARKS, "")
    .replace(ARABIC_YEH, "\u06CC")
    .replace(ARABIC_KAF, "\u06A9")
    .replace(/\u200C/g, "")
    .replace(PERSIAN_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(ARABIC_INDIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .toLowerCase();
  return folded.replace(/\s+/g, " ").trim();
}

const isCli = process.argv[1] && process.argv[1].endsWith("normalize-search-text.mjs");
if (isCli) {
  const fileFlag = process.argv.indexOf("--file");
  const input =
    fileFlag !== -1 && process.argv[fileFlag + 1]
      ? await readFile(process.argv[fileFlag + 1], "utf8")
      : process.argv.slice(2).filter((arg) => !arg.startsWith("--")).join(" ");
  if (!input) {
    console.error("Usage: node normalize-search-text.mjs [--file input.txt] [text]");
    process.exit(2);
  }
  process.stdout.write(normalizeSearchText(input));
}
