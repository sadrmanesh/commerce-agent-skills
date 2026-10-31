---
name: b2b-pricing
description: "Price for business buyers with customer-group price lists, quantity tiers, contract prices, minimum quantities, net terms, and tax exemption, resolved on the server. Use when adding wholesale or B2B prices, tiered pricing, quotes, or company accounts to a store."
license: MIT
compatibility: "The price resolver needs Node.js 20 or newer and no packages."
metadata:
  author: Naser Sadrmanesh
  version: "0.3.2"
---

# B2B pricing

Business buyers see different prices for the same SKU. The price must be resolved by one server function from the buyer's account, the quantity, and the date, and the same function must run in the catalog, the cart, and the order. Data shapes are in [the price list notes](references/price-lists.md).

## Procedure

1. Attach buyers to a company account, and the company to one or more customer groups. A person can buy for more than one company; the cart belongs to one.
2. Store prices as price lists: a list has a currency, a validity window, a priority, and entries of SKU, minimum quantity, and unit price or a percentage off the base price.
3. Resolve the unit price in one function: contract price for this company, then group price lists by priority, then the public price. Within a list, use the highest tier whose minimum quantity the line meets.
4. Show the buyer the next tier ("10 or more: 8.50 each") so they can choose the quantity.
5. Enforce minimum order quantities and pack sizes (order multiples) in the cart, with a message, not only at checkout.
6. Recalculate prices on every cart change and again when the order is placed. The price stored on the order line is final.

## Resolution

Run `node scripts/resolve-price.mjs request.json lists.json` to see which list and tier win for a line. It returns the unit price, the source, and the next tier.

Decide and write down what happens when two rules apply. The usual answer is the contract price wins if one exists. Otherwise the lowest price from the active lists wins. Some stores use priority instead. Pick one; mixing them gives prices nobody can explain.

## Terms, quotes, and tax

- Net terms (Net 30) are a payment method that creates an unpaid invoice with a due date. Check the company's credit limit against open invoices before allowing it.
- A quote is a price offer with an expiry, created by staff or requested by the buyer. Accepting it creates a cart with the quoted prices locked until the expiry.
- Tax-exempt buyers need a stored exemption certificate or a validated tax id. In the EU, a cross-border B2B sale to a buyer with a valid VAT number (checked through VIES) can use the reverse charge. Store the check result on the order.
- Show prices with or without tax according to what the buyer's group expects, and say which one is shown.

## Gotchas

- Computing the B2B price in the browser lets anyone see or send another group's price. Resolve on the server and render the result.
- Caching a product page that shows a group price serves that price to every visitor. Vary the cache by group, or load the price separately.
- A tier is per line by default. If the store promises mix-and-match tiers across a product's variations, sum the quantity across those lines first.
- Percent-off entries on a list need a defined base: the public regular price, not the sale price, unless the store says otherwise.
- Changing a price list must not change orders already placed.

## Verification

- A guest sees the public price. A buyer in the wholesale group sees the wholesale price on the product page, in the cart, and on the order.
- With the example list in the notes, 9 units cost 9.00 each (the 1+ tier) and 10 units cost 8.50 each (the 10+ tier).
- A company with a contract price gets it even when a group list is lower, if the store's rule says contract wins.
- An order below the minimum quantity cannot be placed.
- Net terms are refused when open invoices plus the order exceed the credit limit.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
