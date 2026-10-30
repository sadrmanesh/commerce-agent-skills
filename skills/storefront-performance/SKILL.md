---
name: storefront-performance
description: "Improve storefront Core Web Vitals (LCP, INP, CLS) using field data at the 75th percentile, image and font loading, caching of catalog pages, and lighter third-party scripts. Use when product or category pages feel slow, Web Vitals fail, or a theme, app, or script change needs a performance check."
license: MIT
compatibility: "The Web Vitals checker needs Node.js 20 or newer and no packages."
metadata:
  author: Naser Sadrmanesh
  version: "0.3.0"
---

# Storefront performance

Judge speed by what real shoppers get, not one lab run. Core Web Vitals are measured at the 75th percentile of page loads, split by mobile and desktop. Thresholds and causes are in [the Web Vitals notes](references/web-vitals.md).

| Metric | Good | Poor |
| --- | --- | --- |
| LCP, Largest Contentful Paint | 2500 ms or less | over 4000 ms |
| INP, Interaction to Next Paint | 200 ms or less | over 500 ms |
| CLS, Cumulative Layout Shift | 0.1 or less | over 0.25 |

INP replaced First Input Delay as a Core Web Vital in March 2024.

## Procedure

1. Get field data per template (home, category, product, cart, checkout) from the Chrome UX Report, Search Console, or your own real-user monitoring with the `web-vitals` library. Lab tools explain causes but do not decide pass or fail.
2. Classify the p75 values: `node scripts/check-web-vitals.mjs vitals.json` prints good, needs improvement, or poor for each template.
3. Fix the worst metric on the highest-traffic template first.
4. LCP: the LCP element on a product page is usually the main product image. Serve it in a modern format at the displayed size, do not lazy-load it, give it `fetchpriority="high"`, and cut server response time with full-page caching for anonymous shoppers.
5. INP: break up long JavaScript tasks, defer third-party tags, and make variation pickers and add-to-cart update the UI before network work finishes.
6. CLS: set `width` and `height` (or `aspect-ratio`) on images, reserve space for banners, reviews widgets, and price blocks, and avoid inserting content above what the shopper is reading.
7. Recheck field data after 28 days, the window the Chrome UX Report uses.

## Caching a store

Cache category and product pages for shoppers without a session. Bypass the cache for cart, checkout, account pages, and requests carrying cart or session cookies. Load the mini-cart count with a small request instead of disabling the page cache. Purge a product's page when its price or stock changes.

## Third-party scripts

Chat widgets, review apps, A/B testing, and tag managers often cost more than the theme. List every script with its owner and purpose, remove unused ones, and load the rest after the page is interactive. A/B testing scripts that hide the page while loading hurt LCP directly.

## Gotchas

- `loading="lazy"` on the main product image delays LCP.
- A cookie banner or promo bar inserted at the top shifts the whole page and adds CLS.
- Web fonts without `font-display: swap` or a matching fallback can hide text or shift it.
- Caching pages for logged-in shoppers can show one shopper's cart to another.
- A good Lighthouse score on a desktop connection says little about mobile p75 field data.
- Large carousels that load every slide image at once compete with the LCP image.

## Verification

- Every template's p75 LCP, INP, and CLS is classified, mobile and desktop separately.
- The LCP image is not lazy-loaded and is requested early.
- Cart and checkout are never served from a shared page cache.
- After changes, field data at p75 improves over the next 28 days without a drop in conversion.

## Evaluation

Worked examples and the checks they must satisfy are in [evals/tasks.json](evals/tasks.json).
