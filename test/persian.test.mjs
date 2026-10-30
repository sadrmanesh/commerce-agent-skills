import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePersianDisplay,
  normalizePersianSearch,
} from "../skills/rtl-and-persian-localization/scripts/normalize-persian.mjs";
import { normalizeSearchText } from "../skills/marketplace-search-and-ranking/scripts/normalize-search-text.mjs";

test("folds Arabic Yeh and Kaf and keeps ZWNJ for display", () => {
  const input = "كالا\u200cي ۱۲";
  const display = normalizePersianDisplay(input);
  assert.equal(display, "کالا\u200cی ۱۲");
  assert.equal(normalizePersianSearch(input), "کالای 12");
});

test("search normalization strips bidi marks and lowercases Latin titles", () => {
  const input = "Tee\u200e Shirt ۱۲";
  assert.equal(normalizeSearchText(input), "tee shirt 12");
});
