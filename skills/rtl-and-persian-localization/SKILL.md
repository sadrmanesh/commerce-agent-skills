---
name: rtl-and-persian-localization
description: "Localize a storefront for Persian (fa_IR) and right-to-left layout: logical CSS, digits, Yeh and Kaf, ZWNJ, currency display, and Gregorian storage. Use when building or reviewing Persian, Farsi, or RTL commerce UI."
license: MIT
compatibility: "The Persian normalizer requires Node.js 20 or newer. No network access."
metadata:
  author: Naser Sadrmanesh
  version: "0.1.0"
---

# RTL and Persian localization

Use this skill for a Persian storefront or any right-to-left commerce UI. Search matching uses the marketplace search skill. The normalizer in [`scripts/normalize-persian.mjs`](scripts/normalize-persian.mjs) is for display and for search text. Letter and digit rules are in [the Persian text notes](references/persian-text.md).

## Procedure

1. Set the document language and direction. For Persian, `lang="fa"` and `dir="rtl"`. In WordPress, the `fa_IR` locale is RTL and `is_rtl()` is the check to use in PHP.
2. Lay out with CSS logical properties. Do not mirror the whole page with a plugin that flips `left` and `right` in existing files.
3. Store catalog text as Unicode with Persian Yeh and Kaf and with ZWNJ where the word needs it. Store dates as Gregorian timestamps. Store money as a decimal amount plus an ISO currency code.
4. Format digits for display only. APIs, SKUs, payment amounts, and HTML attributes stay ASCII.
5. Translate user-facing strings with the plugin text domain. Do not hard-code Persian in a PHP string that should go through gettext, and do not hard-code English in a template that Persian shoppers see.

## Direction

- Prefer `margin-inline-start`, `padding-inline`, `inset-inline-start`, `border-inline-end`, and `text-align: start`.
- Use flex and grid. `flex-direction: row` follows the document direction. Use `row-reverse` only when the order is intentionally opposite to the language.
- Mirror directional icons such as back and forward. Do not mirror logos, payment marks, product photos, or numbers.
- Form focus order follows the visual order. Test with the keyboard, not only with a screenshot.
- WooCommerce emails that render the same template need the same direction. A storefront `dir="rtl"` does not change an email that is a separate HTML document.

## Persian text

- Locale code: `fa_IR`.
- Fold Arabic Yeh `ي` (U+064A) to Persian Yeh `ی` (U+06CC) and Arabic Kaf `ك` (U+0643) to Persian Kaf `ک` (U+06A9) when you normalize input. Shoppers and old content use both.
- Keep ZWNJ (U+200C) in stored and displayed words (`می‌روم`). Search normalization may remove it so the two spellings match. Display normalization must not.
- Persian digits `۰۱۲۳۴۵۶۷۸۹` are a display format. Also accept Arabic-Indic digits `٠١٢٣٤٥٦٧٨٩` on input and normalize them.
- Use a font that covers Arabic script. A Latin-only stack renders Persian as missing glyphs.

Run the script:

```bash
node scripts/normalize-persian.mjs --file title.txt
node scripts/normalize-persian.mjs --search "كالاي ۱۲"
```

`--search` prints the match form. The default prints the display form and keeps ZWNJ. `--persian-digits` converts ASCII digits to Persian digits for display.

## Money, dates, addresses

- WooCommerce currency for the Iranian rial is the ISO code `IRR`. Format the amount with the store's decimal settings (`wc_get_price_decimals()`), not with a hard-coded exponent.
- Toman is a display and pricing decision: 1 toman equals 10 rials. If the shop charges in toman, say that in the currency label and store a consistent unit. Do not divide amounts by 10 only in the theme while checkout charges rials.
- WordPress and WooCommerce store order dates in Gregorian, with a site timezone and a GMT field. A Jalali calendar is a presentation layer. Do not write Jalali strings into order date columns.
- Iranian addresses need country `IR`, province, city, street, and a 10-digit postal code. Do not require a state from a country list that has no Iranian provinces unless those provinces are actually configured. Add them through WooCommerce's country locale and state list rather than a one-off checkout hack.
- Phone numbers: accept a local mobile number without a North American mask. Store a normalized form you can dial, and display the local form.

## WordPress and WooCommerce

- Put every new string in gettext with the plugin text domain. Load private translations on `init`.
- Switch field order and labels with `woocommerce_get_country_locale` and `woocommerce_localisation_address_formats` for `IR`, not by editing core templates first.
- `body` gets the `rtl` class from WordPress when the locale is RTL. Theme CSS should key off `dir` or `.rtl` and still prefer logical properties so the same stylesheet serves both directions.
- Prices in templates go through `wc_price()`. That helper uses the store currency settings. Do not concatenate a hard-coded `ریال` or `$` in front of a raw number.

## Gotchas

- `direction: rtl` on a single inner box, while the document is LTR, traps punctuation and mixed English SKUs. Set direction on the document, and on emails, not on random cards.
- `left` and `right` in copied CSS survive an RTL locale and pin totals to the wrong side.
- Replacing every digit in the HTML document breaks CSS, JSON, and payment signatures. Convert digits in text nodes you control.
- Sorting Persian with a binary code-point order is not alphabetical. Use a Persian collation when the list is a dictionary. Do not use it for SKUs.
- Translating a string that includes the price ("Pay 19.00") needs a placeholder, not concatenation: `sprintf( __( 'Pay %s', 'example' ), $formatted )`.

## Verification

- `fa_IR` renders the shopper-facing checkout RTL, with the total and the pay control aligned to the inline end.
- A title that contains Arabic Yeh and Persian digits round-trips through display normalization without losing ZWNJ.
- Search normalization makes `كالا` and `کالا` match. The stored title is unchanged.
- An order date stored by WooCommerce remains Gregorian. Any Jalali label is display-only.
- A test payment uses the same major units the shopper saw. Toman and rial are not mixed inside one order.
