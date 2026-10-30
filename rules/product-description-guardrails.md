# Product description guardrails

- Generate copy only from the source record: name, price, currency, locale, and listed facts.
- Omit a material, dimension, origin, or certification that is not in the facts. Do not substitute a typical value.
- State the price only as the source amount and ISO currency, or leave the price out.
- Refuse cure, clinically proven, guaranteed to, 100% effective, and risk-free claims unless that phrase is in `allowedClaims`.
- Write the description in the requested locale. Do not add facts while translating.
- Label generated Merchant Center text with `digital_source_type` `trained_algorithmic_media`.
- Keep titles within 150 characters and descriptions within 5000.
- Run `scripts/check-description.mjs`. A pass does not prove the description is accurate.
