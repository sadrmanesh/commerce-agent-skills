---
name: storefront-accessibility
description: "Build product, cart, and checkout pages that meet WCAG 2.2 AA: keyboard use, visible focus, labels and autocomplete, announced errors and cart updates, contrast, and target size. Use when building or reviewing storefront UI, forms, filters, carousels, or checkout for accessibility."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.3.2"
---

# Storefront accessibility

A shopper who cannot reach the buy button with a keyboard, or does not hear that the cart changed, cannot buy. Aim for WCAG 2.2 level AA on every step from search to order confirmation. The success criteria that matter most in a store are listed in [the WCAG checklist](references/wcag-checklist.md).

## Procedure

1. Use native elements first: `<button>` for actions, `<a href>` for navigation, `<select>`, `<input type="radio">`, and `<fieldset>` with `<legend>` for option groups. Add ARIA only where no native element fits.
2. Make every action work with a keyboard in a logical order, with a visible focus indicator that is not hidden behind sticky headers or cookie banners.
3. Give every form field a visible `<label>` and the right `autocomplete` token (`given-name`, `postal-code`, `email`, `tel`, `cc-number`).
4. Announce changes that happen without a page load: "Added to cart", a new cart total, filter result counts. Use a polite live region (`role="status"` or `aria-live="polite"`).
5. On a form error, name the field and the fix in text, link the error summary to the fields, set `aria-invalid="true"`, and move focus to the summary or the first invalid field.
6. Check color contrast: 4.5:1 for normal text, 3:1 for large text and for focus indicators, borders of inputs, and icons that carry meaning.
7. Make touch and click targets at least 24 by 24 CSS pixels, or space them so the 24 pixel circle around each does not overlap another.
8. Test with a keyboard only, a screen reader, 200 percent zoom, and an automated checker on the product, cart, and checkout templates.

## Product pages

- Variation pickers are radio groups or selects with a group label ("Size"). A color swatch has a text name, not only a color. Unavailable options say so in text.
- Price changes after picking a variation are announced.
- Images have `alt` text that says what differs between them ("Back view, blue"). Decorative images have `alt=""`.
- Carousels have pause controls, do not auto-advance faster than a shopper can read, and can be used with a keyboard.

## Cart and checkout

- Quantity steppers are buttons with names ("Increase quantity of Blue mug"), and the input accepts typed values.
- Do not ask for the same information twice in one flow. Offer "same as shipping" for billing (WCAG 3.3.7 Redundant Entry).
- Do not require solving a puzzle or remembering a code to sign in or pay, unless an alternative exists (3.3.8 Accessible Authentication). Allow password managers and pasting one-time codes.
- Session timeouts warn the shopper and let them extend, so a slow shopper does not lose the cart.
- The order confirmation page has a clear heading and the order number as text.

## Gotchas

- `<div onclick>` buttons are not focusable and are not announced as buttons.
- A placeholder is not a label. It disappears when typing starts and often fails contrast.
- `outline: none` without a replacement focus style hides where the keyboard is.
- Opening a mini-cart drawer without moving focus into it, or without returning focus when it closes, strands keyboard users.
- Infinite scroll without a "load more" button hides the footer and is hard to navigate by keyboard.
- Disabled "Place order" buttons with no explanation leave shoppers stuck. Keep it enabled and explain errors on submit.

## Verification

- The whole purchase, from search to confirmation, completes with a keyboard only.
- A screen reader announces the add-to-cart result and the new cart count.
- Submitting checkout with an empty postal code moves focus to an error that names the field.
- Text and focus indicators meet the contrast ratios above.
- The page is usable at 200 percent zoom and 320 CSS pixels wide without horizontal scrolling.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
