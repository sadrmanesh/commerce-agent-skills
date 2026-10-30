# Persian text handling

Use this note when you change strings, search tokens, or formatted amounts. The functions in `scripts/normalize-persian.mjs` implement the folds below.

## Letters

| Input | Code point | Fold to |
| --- | --- | --- |
| Arabic Yeh `ي` | U+064A | Persian Yeh `ی` U+06CC |
| Persian Yeh `ی` | U+06CC | unchanged |
| Arabic Kaf `ك` | U+0643 | Persian Kaf `ک` U+06A9 |
| Persian Kaf `ک` | U+06A9 | unchanged |

Apply this fold on input and before search. Display the folded Persian letters.

ZWNJ (U+200C) is part of Persian orthography. Display and storage keep it. Search text removes it so `می‌روم` and `میروم` match. Do not replace ZWNJ with a normal space. That splits one word into two.

Arabic Teh Marbuta `ة` is not a Persian letter. Do not fold it to Heh unless you have a specific migration from Arabic copy. Leave it and show it.

## Digits

| Glyphs | Code points | Use |
| --- | --- | --- |
| `0-9` | U+0030–U+0039 | APIs, SKUs, JSON, payment minor units, HTML attributes |
| `۰-۹` | U+06F0–U+06F9 | Optional Persian display |
| `٠-٩` | U+0660–U+0669 | Accept on input, then fold to ASCII or to Persian digits |

`toAsciiDigits` maps both Persian and Arabic-Indic digits. `toPersianDigits` maps ASCII to Persian. Do not run `toPersianDigits` on a whole HTML or JSON document.

## Normalization entry points

- `normalizePersianDisplay(text)` folds Yeh and Kaf, keeps ZWNJ, and leaves digits unless you pass `{ digits: "persian" }` or `{ digits: "ascii" }`.
- `normalizePersianSearch(text)` folds letters, removes ZWNJ, converts digits to ASCII, lowercases Latin letters, and collapses whitespace.

Latin lowercasing is for mixed catalog titles. Persian letters have no case.

## Currency display

ISO 4217 code in WooCommerce: `IRR` for the Iranian rial.

If the merchant prices in toman, pick one stored unit and label it. A theme-only division by 10 will not match the amount sent to the payment provider. There is no separate ISO code to assume for toman in this skill. Do not invent a code in payment requests.

Format through `wc_price()` so the decimal separator and currency symbol come from WooCommerce settings.

## Dates

Store `date_created_gmt` as WooCommerce provides it. Format for `fa_IR` with `wp_date()` for Gregorian output in the locale. A Jalali formatter, if the shop uses one, reads that timestamp and must not write back a Jalali string.

## Addresses

Postal codes in Iran are 10 digits. Validate the length after converting digits to ASCII. Province names should come from the configured state list for `IR` so shipping zones and the address form agree.
