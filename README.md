# commerce-agent-skills

Skills and rules for AI coding agents that build e-commerce and marketplace products.

**Documentation:** <https://sadrmanesh.github.io/commerce-agent-skills/>

The skills follow the [Agent Skills](https://agentskills.io/specification) format: a folder, a `SKILL.md` file with `name` and `description`, and optional reference files and scripts. An agent that supports that format can load them. The format does not name an install path. [Installation](docs/installation.md) explains how to point your agent at these folders.

Version 0.3.0 adds store operations to the library. It keeps the twenty skills from 0.1.0 and 0.2.0 and adds Stripe payments, Iranian payment gateways such as Zarinpal, inventory across warehouses, returns and refunds, B2B pricing, catalog import and migration, storefront accessibility, storefront performance, and MCP store tooling. It also adds a stricter validator and an eval runner that scores answers against the fixtures.

## Features

- Twenty-nine skills an agent can load when a task matches the skill description.
- A matching plain-Markdown rule for each skill, for agents that keep short rules in context.
- Evaluation tasks and a worked example for every skill, and `scripts/run-evals.mjs` to score answers against them.
- Reference notes and small Node.js tools where a check is better than another paragraph.
- A strict validator, a catalog built from the skill files, and a docs build, all run in CI. The validator checks versions, required sections, rule headings, that every eval term is taught by the skill, category coverage, and prose style.
- An `npx @sadrmanesh/commerce-agent-skills` installer that copies every skill and rule, or the ones you name, into your project.

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
| [`stripe-payments`](skills/stripe-payments/SKILL.md) | Take card and wallet payments with Stripe PaymentIntents or Checkout Sessions, idempotency keys, and signed webhooks that move the order to paid. Use when adding Stripe to a store, handling Stripe webhooks, or refunding through the Stripe API. |
| [`iranian-payment-gateways`](skills/iranian-payment-gateways/SKILL.md) | Integrate Zarinpal and other Shaparak redirect gateways with a server-side verify call, Rial and Toman amounts, and one paid transition per authority. Use when adding an Iranian payment gateway or fixing callback, verify, or amount handling for IRR or IRT stores. |
| [`inventory-and-multi-warehouse`](skills/inventory-and-multi-warehouse/SKILL.md) | Track stock per location with on-hand, reserved, and available quantities, reserve at checkout, and allocate orders across warehouses without overselling. Use when adding warehouses or stores as stock locations, reservations, transfers, or order routing. |
| [`returns-and-refunds`](skills/returns-and-refunds/SKILL.md) | Run returns as a tracked RMA from request to inspection, refund only what the policy and payment allow, and restock only inspected items. Use when building a returns portal, refund rules, exchanges, store credit, or restocking after a return. |
| [`b2b-pricing`](skills/b2b-pricing/SKILL.md) | Price for business buyers with customer-group price lists, quantity tiers, contract prices, minimum quantities, net terms, and tax exemption, resolved on the server. Use when adding wholesale or B2B prices, tiered pricing, quotes, or company accounts to a store. |
| [`catalog-import-and-migration`](skills/catalog-import-and-migration/SKILL.md) | Import, export, and migrate product catalogs with stable SKU keys, a dry run, parent-before-variation order, batched writes, and URL redirects. Use when moving a store between platforms, bulk importing CSV or JSON products, or exporting a catalog for another system. |
| [`storefront-accessibility`](skills/storefront-accessibility/SKILL.md) | Build product, cart, and checkout pages that meet WCAG 2.2 AA: keyboard use, visible focus, labels and autocomplete, announced errors and cart updates, contrast, and target size. Use when building or reviewing storefront UI, forms, filters, carousels, or checkout for accessibility. |
| [`storefront-performance`](skills/storefront-performance/SKILL.md) | Improve storefront Core Web Vitals (LCP, INP, CLS) using field data at the 75th percentile, image and font loading, caching of catalog pages, and lighter third-party scripts. Use when product or category pages feel slow, Web Vitals fail, or a theme, app, or script change needs a performance check. |
| [`mcp-store-tooling`](skills/mcp-store-tooling/SKILL.md) | Design Model Context Protocol servers for stores: read and write tools with annotations, input and output schemas, scopes, dry runs and confirmation for risky writes, resources, and remote auth. Use when exposing a store's catalog, orders, or customers to an agent through MCP, or reviewing such a server. |
<!-- catalog:end -->

## Install

Install the skills into your project with npx. Node.js 20 or newer is required, and nothing is downloaded after the package itself:

```bash
npx @sadrmanesh/commerce-agent-skills init
```

That copies every skill to `.agents/skills/` and every rule to `.agents/rules/`. To pick skills, or to write them where your agent looks:

```bash
npx @sadrmanesh/commerce-agent-skills list
npx @sadrmanesh/commerce-agent-skills add woocommerce-plugin-development stripe-payments
npx @sadrmanesh/commerce-agent-skills init --layout root
npx @sadrmanesh/commerce-agent-skills init --skills-dir path/to/skills --rules-dir path/to/rules
```

`init` skips skills that are already installed, `--force` replaces them, and `--dry-run` shows what would be written. From a checkout, `node bin/commerce-agent-skills.mjs` takes the same arguments. Details are in [docs/installation.md](docs/installation.md) and [docs/cli.md](docs/cli.md).

The package is on npmjs.com and, with the same name, on GitHub Packages. npmjs.com is the default; [docs/installation.md](docs/installation.md#install-from-github-packages) has the `.npmrc` lines for GitHub Packages.

## Work on the library

Clone the repository and check the skills:

```bash
git clone https://github.com/sadrmanesh/commerce-agent-skills.git
cd commerce-agent-skills
node scripts/validate-skills.mjs
```

Node.js 20 or newer is required for the validator, the docs generator, and the command. The docs site also needs Python and MkDocs. This repository is a skill library, not a dependency of the storefront.

## Usage

Agents read `name` and `description` to decide whether a skill applies, then read the `SKILL.md` body. Reference files and scripts are loaded only when the skill points to them. Keep instructions in `SKILL.md` and longer notes under `references/`.

Rules in [`rules/`](rules/) are not skills. They are short constraints you can install as always-on guidance. A skill is for a task. A rule is for every task in that area. See [docs/rules.md](docs/rules.md).

Regenerate the catalog table after a description change:

```bash
node scripts/generate-catalog.mjs
node scripts/generate-catalog.mjs --check
node --test
```

Score answers against the eval fixtures:

```bash
node scripts/run-evals.mjs
node scripts/run-evals.mjs --answers ./answers --min-score 0.8
```

The first command checks the worked examples. The second reads `answers/<skill>/<task-id>.md`, prints a score per skill, and exits with status 1 below the threshold.

The skill format is documented in [docs/skill-format.md](docs/skill-format.md). Evaluation fixtures and the runner are documented in [docs/evaluations.md](docs/evaluations.md).

## Docs site

The documentation lives at [sadrmanesh.github.io/commerce-agent-skills](https://sadrmanesh.github.io/commerce-agent-skills/). It is built with MkDocs Material, and the skill, rule, and guide pages are generated from this repository by `scripts/build-docs.mjs`, so they always match the files here. `.github/workflows/pages.yml` deploys it on pushes to `main`. See [docs/github-pages.md](docs/github-pages.md).

`.github/workflows/release.yml` runs when a `vX.Y.Z` tag is pushed. It checks that the tag matches `package.json`, runs the validator, evals, and tests, creates the GitHub release if it does not exist, and publishes `@sadrmanesh/commerce-agent-skills` to npm and to GitHub Packages, which uses the workflow's `GITHUB_TOKEN`. Running it by hand with a version tags that version first.

## Roadmap

0.3.0 adds nine store operations skills, the eval runner, stricter validation, and the `npx @sadrmanesh/commerce-agent-skills` installer. The runner does not send tasks to a live agent: it scores answer files you collect.

Later releases can add:

- Runnable reference services for the payout ledger and a feed upload, with the same checks the local scripts already apply.
- More store platforms, written to the same level of API detail as the WooCommerce and Shopify skills.
- More payment providers, written like the Stripe and Zarinpal skills.
- Graded eval rubrics beyond substring checks.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Run the validator before opening a pull request. New skills need a matching rule, a row in `skills/catalog-order.txt`, and a place in `website/categories.json`.

## License

[MIT](LICENSE). Copyright (c) 2026 Naser Sadrmanesh.

## Author

Naser Sadrmanesh

- GitHub: [https://github.com/sadrmanesh](https://github.com/sadrmanesh)
- Website: [https://sadrmanesh.github.io](https://sadrmanesh.github.io)
