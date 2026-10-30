# Storefront accessibility

- Target WCAG 2.2 AA from search to order confirmation.
- Use native `<button>`, `<a href>`, `<select>`, radio groups, and `<fieldset>` with `<legend>`.
- Every field has a visible `<label>` and an `autocomplete` token. Placeholders are not labels.
- Keep a visible focus style that sticky headers do not cover.
- Announce cart updates and result counts in a `role="status"` live region.
- Errors are text that names the field, with `aria-invalid` and focus moved to the summary.
- Contrast: 4.5:1 text, 3:1 large text and UI parts. Targets at least 24 by 24 CSS pixels.
- Drawers and modals move focus in and return it on close.
- Allow paste and password managers. Do not ask for the same data twice.
