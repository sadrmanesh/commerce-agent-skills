# RTL and Persian localization

- Set Persian pages to `lang="fa"` and `dir="rtl"`. In WordPress, rely on the `fa_IR` locale and `is_rtl()`.
- Use CSS logical properties (`margin-inline-start`, `text-align: start`). Do not fix layout by rewriting `left` and `right` in a copied stylesheet.
- Mirror back and forward icons. Do not mirror logos, payment marks, product photos, or numbers.
- Fold Arabic Yeh and Kaf to Persian Yeh and Kaf on input. Keep ZWNJ in stored and displayed text. Remove ZWNJ only in search tokens.
- Keep ASCII digits in APIs, SKUs, JSON, and payment amounts. Persian digits are a display format. Accept Arabic-Indic digits on input.
- Store WooCommerce order dates as Gregorian timestamps. A Jalali calendar is display-only.
- Use ISO `IRR` for rials. If the shop charges in toman, store one unit and label it. Do not divide by 10 only in the theme.
- Format prices with `wc_price()`. Translate strings with gettext placeholders, not concatenation.
- Load a font that covers Arabic script. Do not run digit conversion across an entire HTML document.
