---
name: tax-and-shipping
description: "Calculate tax and shipping from the destination and the store's configured rules, and store the breakdown on the order. Use when changing tax classes, shipping zones, rates, or the amount shown before payment."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.2.0"
---

# Tax and shipping

Use this skill when an order needs a tax or shipping amount. Checkout display is the checkout skill. Payment capture uses the total this skill produced. Do not invent a tax rate. A rate comes from the store's configuration or from a tax service the store has enabled.

## Procedure

1. Decide the tax address from the store's tax setting: destination, shop base, or the service's rule. Do not assume every country taxes the shipping address.
2. Resolve each line to a tax class. Shipping may be taxed separately from goods.
3. Calculate tax in integer minor units. Store each tax line: name or rate id, rate, and amount. Record whether prices are entered inclusive of tax.
4. Resolve shipping from the destination to a zone, then to the methods the shopper can choose. Quote those rates before payment.
5. Recalculate when the address, the line items, or the selected method changes. The total you charge is the last server calculation, not the first estimate.

WooCommerce mapping is in [the WooCommerce notes](references/woocommerce.md). Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## Tax

- A missing rate is an error or a zero-rated class the merchant configured. It is not a silent 0% you made up.
- Inclusive and exclusive prices do not mix on one order. If the catalog is inclusive, the line price already contains tax and the tax line is the included portion.
- Discounts reduce the taxable base according to the store's setting (before tax or after). Apply that setting once.
- Digital and physical lines can have different classes. Do not put one rate on the order header and ignore the lines.
- Keep the rate id that was used. A later change to the rate table must not rewrite historical orders.

## Shipping

- Zones are matched from the most specific address you have. Quoting a domestic rate before the country is known is an estimate and must be replaced.
- A free method is a configured rate of zero. An address with no zone is not free shipping. Show that you cannot ship there.
- The selected method's id and the quoted amount are stored on the order. Changing the label later does not change the amount already charged.
- Multi-vendor shipments use one rate per merchant policy. The payout skill records who receives the shipping amount. This skill only calculates what the shopper pays.

## Presentation

- Show shipping, tax, and the grand total before the pay control.
- A second currency is a display conversion. The tax and shipping amounts you persist use the order currency.
- Round each tax line with the currency's minor units, then sum. Do not sum binary floats and round once at the end if the platform's tax API already defines the rounding.

## Gotchas

- Calculating tax only in the browser lets a modified client submit a lower total. Recalculate on the server.
- Caching a shipping quote without the address, the items, and the method id will reuse another shopper's rate.
- Tax-exempt customers need an explicit exemption on the customer or the order. Skipping tax because a field was blank marks everyone exempt.
- Refunds refund tax in proportion to the refunded lines, using the tax that was stored, not today's rate table.

## Verification

- Two addresses in different zones produce the rates configured for those zones, including a zone that does not ship.
- An order stores tax lines that add up to the tax total, in the order currency.
- Changing the address on checkout updates the quoted shipping and tax before payment.
- A historical order keeps its original tax amounts after you edit the live rate table.
