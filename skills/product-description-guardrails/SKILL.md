---
name: product-description-guardrails
description: "Generate product titles and descriptions only from catalog facts, and block prices, certifications, and medical claims that are not in the record. Use when writing or reviewing generated product copy, Merchant Center text, or locale-specific descriptions."
license: MIT
compatibility: "The description checker requires Node.js 20 or newer. No network access."
metadata:
  author: Naser Sadrmanesh
  version: "0.3.1"
---

# Product description guardrails

Use this skill when copy is generated from a catalog record. The feed skill decides which Merchant Center attribute receives that copy. Search text normalization is the search skill. This skill does not claim the copy is true. It keeps the copy inside the facts you passed in.

## Procedure

1. Pass a source record: name, price, currency, locale, and the facts that may be stated (materials, dimensions, color, care, certifications).
2. Write the description from those facts only. If a fact is absent, omit it. Do not fill the gap with a typical value for that category.
3. Either omit the price or state the source price and currency. Do not round it into a different amount.
4. Refuse medical, safety, and guarantee claims that are not in the source. The checker encodes a short refuse-list, not a legal opinion.
5. Match the locale. A `fa_IR` description is Persian. Do not mix a generated English paragraph into that field.
6. Run `node scripts/check-description.mjs --description copy.txt --source source.json`.

The refuse-list and the Merchant Center labeling rule are in [the claim notes](references/claims.md). Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## Source record

```json
{
  "name": "Cotton shirt",
  "price": "19.00",
  "currency": "USD",
  "locale": "en",
  "facts": ["short sleeve", "cotton", "blue"],
  "allowedClaims": []
}
```

`allowedClaims` is empty unless the merchant has supplied the exact claim that may be repeated, such as a certification number that is already in `facts`.

## What may be written

- The product name and the facts, in the locale's language.
- Care or sizing text that appears in `facts`.
- The price only as `{price} {currency}`.

## What may not be written

- A material, dimension, country of origin, or certification that is not in `facts`.
- "Cures", "clinically proven", "guaranteed to", "100% effective", or "risk-free", unless that phrase is listed in `allowedClaims`.
- Another product's name, a competitor, or "free shipping".
- A sale price the source does not contain.
- Stars or review counts that are not in the source.

## Merchant Center

Google's product data specification says generated titles and descriptions use `structured_title` and `structured_description` with `digital_source_type` set to `trained_algorithmic_media`. Text that was not generated uses `title` and `description`. The feed skill checks lengths: 150 characters for a title and 5000 for a description.

## Checker limits

`scripts/check-description.mjs` checks:

- non-empty text at most 5000 characters
- any `{amount} {CURRENCY}` in the text matches `price` and `currency`
- the refuse-list phrases above, unless present in `allowedClaims`

It does not detect a made-up material that lacks those phrases. Review the facts list. A passing check is not a statement that the description is accurate.

## Gotchas

- Translating a fact is allowed. Adding a fact during translation is not. "Cotton" may become the Persian word for cotton. It may not gain "organic".
- A marketing model will add "perfect for" and a use the catalog never stated. Keep the sentence tied to a fact or delete it.
- Putting the price in Persian digits in the description is a display choice. The checker looks for ASCII `{amount} {CURRENCY}`. Do not also embed a different ASCII amount.

## Verification

- The checker fails a description that says `15.00 USD` when the source price is `19.00`.
- The checker fails "clinically proven" when `allowedClaims` is empty.
- A `fa_IR` request does not return an English-only description.
- Generated Merchant Center text is labeled `trained_algorithmic_media`.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
