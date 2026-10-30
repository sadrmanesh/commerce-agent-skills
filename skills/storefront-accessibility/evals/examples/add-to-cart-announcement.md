Use a real `<button>` for add to cart so it is focusable and announced as a button. After the request succeeds, write "Blue mug added to cart. Cart has 3 items." into a `role="status"` live region that already exists in the page. Update the badge text too, with a visually hidden "items in cart" label.

Leave focus on the button after adding. If the mini-cart drawer opens, move focus into it, trap focus while it is open, and return focus to the button when it closes.
