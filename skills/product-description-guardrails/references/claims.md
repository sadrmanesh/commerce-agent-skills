# Claims the description checker refuses

The checker is a lexical guard, not a review of advertising law. Merchants still need their own review for regulated goods.

Refused unless the same phrase is listed in `allowedClaims`:

- `cure` and `cures`
- `clinically proven`
- `guaranteed to`
- `100% effective`
- `risk-free`

Prices must match `/^(\d+\.\d{2}) ([A-Z]{3})$/` against the source. `19.00 USD` matches a source price of `19.00` and currency `USD`. `$19.00` is ignored by this pattern. Do not rely on that gap. The writer still must not invent a dollar amount.

## Merchant Center labeling

| How the text was produced | Attribute |
| --- | --- |
| Written or translated by a person from the catalog | `title`, `description` |
| Generated | `structured_title` or `structured_description` with `digital_source_type` `trained_algorithmic_media` |

Omitting `digital_source_type` means Google treats the structured value as `default` (not generated). Do not omit it for generated text.

Lengths from the product data specification: title content at most 150 characters, description content at most 5000.
