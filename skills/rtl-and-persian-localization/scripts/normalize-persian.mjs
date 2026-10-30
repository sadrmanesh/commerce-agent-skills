#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const ARABIC_YEH = /\u064A/g;
const ARABIC_KAF = /\u0643/g;
const PERSIAN_DIGITS = /[\u06F0-\u06F9]/g;
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669]/g;
const ZWNJ = /\u200C/g;

export function toAsciiDigits(text) {
  return text
    .replace(PERSIAN_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(ARABIC_INDIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

export function toPersianDigits(text) {
  return text.replace(/[0-9]/g, (digit) => String.fromCharCode(0x06f0 + Number(digit)));
}

function foldLetters(text) {
  return text.normalize("NFC").replace(ARABIC_YEH, "\u06CC").replace(ARABIC_KAF, "\u06A9");
}

/** Display text: fold Arabic Yeh/Kaf to Persian, keep ZWNJ, optionally use Persian digits. */
export function normalizePersianDisplay(text, { digits = "keep" } = {}) {
  const folded = foldLetters(String(text));
  if (digits === "persian") {
    return toPersianDigits(toAsciiDigits(folded));
  }
  if (digits === "ascii") {
    return toAsciiDigits(folded);
  }
  return folded;
}

/**
 * Search text: fold letters, drop ZWNJ so می‌روم matches میروم, ASCII digits,
 * and collapse whitespace. Latin letters are lowercased. Persian has no case.
 */
export function normalizePersianSearch(text) {
  const folded = toAsciiDigits(foldLetters(String(text))).replace(ZWNJ, "").toLowerCase();
  return folded.replace(/\s+/g, " ").trim();
}

const isCli = process.argv[1] && process.argv[1].endsWith("normalize-persian.mjs");
if (isCli) {
  const mode = process.argv.includes("--search") ? "search" : "display";
  const fileFlag = process.argv.indexOf("--file");
  const input =
    fileFlag !== -1 && process.argv[fileFlag + 1]
      ? await readFile(process.argv[fileFlag + 1], "utf8")
      : process.argv.slice(2).filter((arg) => !arg.startsWith("--")).join(" ");
  if (!input) {
    console.error("Usage: node normalize-persian.mjs [--search] [--file input.txt] [text]");
    process.exit(2);
  }
  const output =
    mode === "search"
      ? normalizePersianSearch(input)
      : normalizePersianDisplay(input, { digits: process.argv.includes("--persian-digits") ? "persian" : "keep" });
  process.stdout.write(output);
}
