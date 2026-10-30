# commerce-agent-skills

Skills and rules for AI coding agents that build e-commerce and marketplace products.

The skills follow the [Agent Skills](https://agentskills.io/specification) format: a folder, a `SKILL.md` file with `name` and `description`, and optional reference files and scripts. An agent that supports that format can load them. The format does not name an install path. [Installation](docs/installation.md) explains how to point your agent at these folders.

Version 0.1.0 covers WooCommerce plugin work, the WooCommerce REST API, WordPress plugin security, payment integration, catalog modeling, search and ranking, checkout, Persian and RTL localization, webhook reliability, and product structured data.

## Features

- Ten skills an agent can load when a task matches the skill description.
- A matching plain-Markdown rule for each skill, for agents that keep short rules in context.
- Reference notes and small Node.js tools where a check is better than another paragraph: catalog shape, webhook signatures, Persian text, and product JSON-LD.
- A validator and a generated catalog, both run in CI.

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
<!-- catalog:end -->

## Quick start

Clone the repository and check the skills:

```bash
git clone https://github.com/sadrmanesh/commerce-agent-skills.git
cd commerce-agent-skills
node scripts/validate-skills.mjs
```

Node.js 20 or newer is required for the validator and the skill scripts. The library is a set of files. It is not an npm package you add to a storefront.

Copy one skill folder into the skills directory your agent already scans, then start a new session if the agent caches skills at startup. Details are in [docs/installation.md](docs/installation.md).

## Usage

Agents read `name` and `description` to decide whether a skill applies, then read the `SKILL.md` body. Reference files and scripts are loaded only when the skill points to them. Keep instructions in `SKILL.md` and longer notes under `references/`.

Rules in [`rules/`](rules/) are not skills. They are short constraints you can install as always-on guidance. A skill is for a task. A rule is for every task in that area. See [docs/rules.md](docs/rules.md).

Regenerate the catalog table after a description change:

```bash
node scripts/generate-catalog.mjs
node scripts/generate-catalog.mjs --check
node --test
```

The skill format itself is documented in [docs/skill-format.md](docs/skill-format.md).

## Roadmap

0.1.0 is the open skill and rule library.

A later pro edition is planned and is not part of this release. The intended additions are:

- Worked reference implementations for a payment webhook inbox and a catalog indexer, wired to the skills in this repository.
- Evaluation fixtures that grade an agent's checkout, catalog, and webhook changes against these skills.
- Multi-vendor marketplace flows: vendor catalogs, commissions, and payout records.
- Skills for store platforms other than WooCommerce, once each one has the same level of API-specific detail as the WooCommerce skills here.

Those items will land in their own releases. This repository will keep the 0.1.0 skills usable on their own.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Run the validator before opening a pull request. New skills need a matching rule and a row in `skills/catalog-order.txt`.

## License

[MIT](LICENSE). Copyright (c) 2026 Naser Sadrmanesh.

## Author

Naser Sadrmanesh

- GitHub: [https://github.com/sadrmanesh](https://github.com/sadrmanesh)
- Website: [https://sadrmanesh.github.io](https://sadrmanesh.github.io)
