# WCAG 2.2 checklist for stores

Level A and AA success criteria that storefronts most often fail. Numbers refer to WCAG 2.2.

| Criterion | Level | In a store |
| --- | --- | --- |
| 1.1.1 Non-text Content | A | Product image `alt`, icon buttons with names, swatches with text |
| 1.3.1 Info and Relationships | A | Headings, lists, tables for size charts, `fieldset` and `legend` for options |
| 1.3.5 Identify Input Purpose | AA | `autocomplete` on address, email, phone, and payment fields |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 text, 3:1 large text, including sale prices and badges |
| 1.4.10 Reflow | AA | Usable at 320 CSS pixels wide |
| 1.4.11 Non-text Contrast | AA | 3:1 for input borders, focus rings, and meaningful icons |
| 2.1.1 Keyboard | A | Filters, swatches, carousels, mini-cart, and payment fields |
| 2.2.1 Timing Adjustable | A | Cart or checkout timeouts can be extended |
| 2.2.2 Pause, Stop, Hide | A | Auto-advancing carousels and countdown banners |
| 2.4.3 Focus Order | A | Drawers and modals trap and return focus |
| 2.4.7 Focus Visible | AA | A visible focus style everywhere |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Sticky headers and cookie banners do not cover focus |
| 2.5.8 Target Size (Minimum) | AA | 24 by 24 CSS pixels, or enough spacing |
| 3.3.1 Error Identification | A | Errors in text, naming the field |
| 3.3.3 Error Suggestion | AA | Say how to fix it: "Enter a 5-digit postal code" |
| 3.3.7 Redundant Entry | A | "Same as shipping" for billing |
| 3.3.8 Accessible Authentication (Minimum) | AA | No puzzle or memory test to sign in. Allow paste and password managers. |
| 4.1.2 Name, Role, Value | A | Custom controls expose role and state, such as `aria-expanded` and `aria-pressed` |
| 4.1.3 Status Messages | AA | Cart updates and result counts in a live region |

## Live region pattern

```html
<div role="status" class="visually-hidden" id="cart-status"></div>
<script>
  function announceCart(message) {
    const region = document.getElementById("cart-status");
    region.textContent = "";
    requestAnimationFrame(() => { region.textContent = message; });
  }
  // announceCart("Blue mug added to cart. Cart has 3 items.");
</script>
```

The region must exist in the page before the message is written, or some screen readers miss it.
