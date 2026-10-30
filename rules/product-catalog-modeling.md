# Product catalog modeling

- Treat each variant as the purchasable unit. A variable parent does not have its own SKU or price.
- Keep SKUs unique across simple products and variants.
- Define variation attributes as a closed option list. Each variant sets every variation attribute, and no two variants share a combination.
- Store prices as decimal strings in major units with an ISO 4217 currency. Do not persist binary floats.
- Put stock on the purchasable unit. Managed stock has a quantity. Unmanaged stock has a status and a null quantity.
- Do not maintain a second parent quantity that can disagree with its variants.
- Keep attribute option codes stable and translate only the display label.
- Validate the catalog document with `scripts/validate-catalog.mjs` before importing it.
- After writing WooCommerce variations, call `WC_Product_Variable::sync()` so the parent price range and stock status match the children.
