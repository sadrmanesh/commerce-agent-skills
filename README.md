# commerce-agent-skills

Skills and rules for AI coding agents that build e-commerce and marketplace products.

The skills follow the [Agent Skills](https://agentskills.io/specification) format: a folder, a `SKILL.md` file with `name` and `description`, and optional reference files and scripts. An agent that supports that format can load them. The format does not name an install path. [Installation](docs/installation.md) explains how to point your agent at these folders.

Version 0.2.0 is the professional phase of the open library. It keeps the 0.1.0 WooCommerce, payment, catalog, search, checkout, localization, webhook, and structured-data skills, and adds multi-vendor payouts, Shopify apps, a Next.js storefront, Merchant Center feeds, tax and shipping, subscriptions, fraud review, vector search, description guardrails, and conversion events.

## Features

- Twenty skills an agent can load when a task matches the skill description.
- A matching plain-Markdown rule for each skill, for agents that keep short rules in context.
- Evaluation tasks and a worked example for every skill.
- Reference notes and small Node.js tools where a check is better than another paragraph.
- A validator, a generated catalog, and a docs build, all run in CI.
- A local `commerce-agent-skills` command that lists skills and copies one into a directory.

## Skill catalog

<!-- catalog:start -->
| Skill | Description |
| --- | --- |
| [`woocommerce-plugin-development`](skills/woocommerce-plugin-development/SKILL.md) | Build and change WooCommerce plugins with hooks, CRUD data stores, HPOS-safe order access, nonces, capabilities, and gettext. Use when writing or reviewing a plugin that reads or writes WooCommerce products, orders, customers, or checkout. |
| [`woocommerce-rest-api`](skills/woocommerce-rest-api/SKILL.md) | Call the WooCommerce REST API at wc/v3, including authentication, pagination, batch writes, and webhook registration, and keep it separate from the Store API. Use when an external system integrates with a WooCommerce store over HTTP. |
| [`wordpress-plugin-security`](skills/wordpress-plugin-security/SKILL.md) | Review and implement WordPress plugin security: capabilities, nonces, sanitization, escaping, prepared SQL, and REST permission callbacks. Use when adding admin screens, AJAX, uploads, hooks, or REST routes in a WordPress or WooCommerce plugin. |
| [`payment-gateway-integration`](skills/payment-gateway-integration/SKILL.md) | Integrate a payment provider with idempotent charges, signature-checked webhooks, and an explicit map from provider states to order states. Use when adding or changing checkout payment, capture, refund, or payment notification handling. |
| [`product-catalog-modeling`](skills/product-catalog-modeling/SKILL.md) | Model a sellable catalog of simple products, variants, attributes, SKUs, and stock, and check the model before importing it. Use when designing product data, variation matrices, inventory rules, or catalog imports. |
| [`marketplace-search-and-ranking`](skills/marketplace-search-and-ranking/SKILL.md) | Index purchasable catalog units and rank them with text relevance, facets, stock, and language-aware matching for Persian and other languages. Use when building marketplace search, filters, relevance, or multilingual product discovery. |
| [`checkout-ux-and-conversion`](skills/checkout-ux-and-conversion/SKILL.md) | Design checkout so the full cost is visible before payment, guest purchase works, and field or payment errors can be corrected without losing the cart. Use when changing the checkout flow, address form, payment choice, or order confirmation page. |
| [`rtl-and-persian-localization`](skills/rtl-and-persian-localization/SKILL.md) | Localize a storefront for Persian (fa_IR) and right-to-left layout: logical CSS, digits, Yeh and Kaf, ZWNJ, currency display, and Gregorian storage. Use when building or reviewing Persian, Farsi, or RTL commerce UI. |
| [`order-and-webhook-reliability`](skills/order-and-webhook-reliability/SKILL.md) | Accept order and payment webhooks with a raw-body signature check, durable deduplication, and reconciliation against the source of truth. Use when handling order events, payment notifications, or outbound webhook delivery. |
| [`ecommerce-seo-structured-data`](skills/ecommerce-seo-structured-data/SKILL.md) | Add product JSON-LD that matches the visible offer, including price, currency, availability, and images, without a second conflicting Product node. Use when editing product-page SEO, schema.org markup, or merchant listing data. |
| [`multi-vendor-payouts`](skills/multi-vendor-payouts/SKILL.md) | Split a marketplace order by vendor, record commission as ledger entries, and pay vendors only settled amounts. Use when adding vendor catalogs, commissions, refunds that cross vendors, or payout batches. |
| [`shopify-app-development`](skills/shopify-app-development/SKILL.md) | Build a Shopify app with the configured Admin API version, session-token auth for embedded admin requests, and HMAC-verified webhooks. Use when creating or changing a Shopify app, Admin GraphQL call, app proxy, or Shopify webhook handler. |
| [`headless-nextjs-storefront`](skills/headless-nextjs-storefront/SKILL.md) | Build a Next.js storefront that loads catalog data on the server, keeps admin secrets off the client, and revalidates price and stock. Use when adding product, cart, or checkout UI in a Next.js App Router storefront for WooCommerce or another headless commerce API. |
| [`google-merchant-product-feeds`](skills/google-merchant-product-feeds/SKILL.md) | Build a Google Merchant Center product feed item with the required id, title, description, link, image, availability, and price fields. Use when exporting products to Merchant Center, Content API items, or a product feed file. |
| [`tax-and-shipping`](skills/tax-and-shipping/SKILL.md) | Calculate tax and shipping from the destination and the store's configured rules, and store the breakdown on the order. Use when changing tax classes, shipping zones, rates, or the amount shown before payment. |
| [`subscription-billing`](skills/subscription-billing/SKILL.md) | Model subscription state, renewal charges, proration, and dunning without treating a renewal as a new one-time checkout. Use when adding or changing recurring billing, plan changes, cancellation, or failed renewal recovery. |
| [`fraud-and-risk-basics`](skills/fraud-and-risk-basics/SKILL.md) | Hold or review risky payments using provider signals, velocity, and 3-D Secure without storing card numbers. Use when adding payment risk checks, a manual review queue, or decline handling for card abuse. |
| [`vector-product-search`](skills/vector-product-search/SKILL.md) | Add vector retrieval beside lexical product search, with one embedding per purchasable unit and exact SKU lookup kept first. Use when adding embedding search, hybrid ranking, or re-embedding after catalog edits. |
| [`product-description-guardrails`](skills/product-description-guardrails/SKILL.md) | Generate product titles and descriptions only from catalog facts, and block prices, certifications, and medical claims that are not in the record. Use when writing or reviewing generated product copy, Merchant Center text, or locale-specific descriptions. |
| [`conversion-event-tracking`](skills/conversion-event-tracking/SKILL.md) | Send commerce analytics events with stable names, item ids, and a purchase event that fires once from a confirmed order. Use when adding or changing view_item, add_to_cart, begin_checkout, purchase, or refund tracking. |
<!-- catalog:end -->

## Quick start

Clone the repository and check the skills:

```bash
git clone https://github.com/sadrmanesh/commerce-agent-skills.git
cd commerce-agent-skills
node scripts/validate-skills.mjs
```

Node.js 20 or newer is required for the validator, the docs build, and the command. This repository is a skill library, not a dependency of the storefront.

Copy one skill into a directory your agent already scans:

```bash
node bin/commerce-agent-skills.mjs add woocommerce-plugin-development --dir ./agent-skills
```

The package is not on the npm registry. After it is published, that command is `npx commerce-agent-skills add woocommerce-plugin-development --dir ./agent-skills`. Details are in [docs/installation.md](docs/installation.md) and [docs/cli.md](docs/cli.md).

## Usage

Agents read `name` and `description` to decide whether a skill applies, then read the `SKILL.md` body. Reference files and scripts are loaded only when the skill points to them. Keep instructions in `SKILL.md` and longer notes under `references/`.

Rules in [`rules/`](rules/) are not skills. They are short constraints you can install as always-on guidance. A skill is for a task. A rule is for every task in that area. See [docs/rules.md](docs/rules.md).

Regenerate the catalog table after a description change:

```bash
node scripts/generate-catalog.mjs
node scripts/generate-catalog.mjs --check
node --test
```

The skill format is documented in [docs/skill-format.md](docs/skill-format.md). Evaluation fixtures are documented in [docs/evaluations.md](docs/evaluations.md).

## Docs site

`node scripts/build-docs.mjs --out site` writes a static site. `.github/workflows/pages.yml` deploys it to GitHub Pages on pushes to `main` after the repository Pages source is set to GitHub Actions. The project address is `https://sadrmanesh.github.io/commerce-agent-skills/`. See [docs/github-pages.md](docs/github-pages.md).

`.github/workflows/release.yml` tags `vX.Y.Z` and opens a GitHub release when you run it with the version in `package.json`. It does not publish to npm.

## Roadmap

0.2.0 adds the professional skill set, eval fixtures, the local command, and the docs and release workflows. It does not publish the npm package and it does not ship a running payout service or a live Merchant Center upload.

Later releases can add:

- A published package on the npm registry, using the `commerce-agent-skills` bin that is already in this repo.
- Runnable reference services for the payout ledger and a feed upload, with the same checks the local scripts already apply.
- More store platforms, written to the same level of API detail as the WooCommerce and Shopify skills.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Run the validator before opening a pull request. New skills need a matching rule and a row in `skills/catalog-order.txt`.

## License

[MIT](LICENSE). Copyright (c) 2026 Naser Sadrmanesh.

## Author

Naser Sadrmanesh

- GitHub: [https://github.com/sadrmanesh](https://github.com/sadrmanesh)
- Website: [https://sadrmanesh.github.io](https://sadrmanesh.github.io)
