# Changelog

## [Unreleased]

## [0.3.2] - 2026-10-31

### Added

- A `redelivery-after-timeout` eval task and worked example for `order-and-webhook-reliability`. The handler stored and applied the event, the sender timed out before the 2xx arrived and redelivered, and the answer must return 2xx without repeating a side effect such as a second fulfillment, email, or stock decrement. The skill explains this case, its verification list and gotchas cover it, and the rule has a matching line.
- The skills, rules, and evaluation tasks as a Hugging Face dataset, <https://huggingface.co/datasets/sadrmanesh/commerce-agent-skills>, with a `skills` table, an `evals` table, and the installable folders. The README, the docs home page, and the installation guide link to it.
- `.github/workflows/mirror.yml`, which mirrors `main` and tags to `gitlab.com/sadrmanesh/commerce-agent-skills` when the `GITLAB_TOKEN` secret is set, and skips cleanly otherwise.

### Changed

- The package and every skill are now version 0.3.2.

## [0.3.1] - 2026-10-30

### Added

- The release workflow publishes `@sadrmanesh/commerce-agent-skills` to GitHub Packages after npm, using the workflow's `GITHUB_TOKEN`. npmjs.com remains the main registry.
- Install docs for GitHub Packages, with the `.npmrc` scope entry, in the installation guide and the README.

### Changed

- The package and every skill are now version 0.3.1.

## [0.3.0] - 2026-10-30

### Added

- Skills for Stripe payments, Iranian payment gateways (Zarinpal request, callback, and verify, with Rial and Toman amounts), inventory across warehouses, returns and refunds, B2B pricing, catalog import and migration, storefront accessibility (WCAG 2.2 AA), storefront performance (Core Web Vitals), and MCP store tooling. Each has a rule, reference notes, and eval fixtures.
- Node.js checks for Stripe webhook signatures, gateway verify responses, stock allocation, B2B price resolution, import rows, Web Vitals ratings, and MCP tool definitions.
- `scripts/run-evals.mjs` and `npm run eval`, which score worked examples or a folder of answers against the fixtures, per task, per skill, and overall, with `--skill`, `--min-score`, and `--json`.
- A "Store operations" category on the docs site.
- The library is published on npm as `@sadrmanesh/commerce-agent-skills`. `npx @sadrmanesh/commerce-agent-skills init` copies every skill and rule into a project, `add <skill> [<skill> ...]` copies the named ones, and `list` prints them, with `--json`. Skills go to `.agents/skills/` and rules to `.agents/rules/` by default. `--layout root`, `--skills-dir`, `--rules-dir`, `--target`, `--only`, `--no-rules`, `--force`, `--dry-run`, and `--version` are supported, and no network access is needed.
- The release workflow runs on `vX.Y.Z` tags, creates the GitHub release with the notes from this file, and publishes the package to npm.

### Changed

- `add` copies the matching rule by default. `--no-rules` turns that off, and `--with-rule` is still accepted.
- The command now works when started through a symlink, as `npx` and global installs do.
- The npm package ships only the command, skills, rules, and changelog.
- The validator is stricter. `metadata.version` must equal the `package.json` version. Skills need `## Gotchas`, `## Verification`, and `## Evaluation` sections and a 100 to 320 character description. Rule headings must match skill headings. Every `must_include` term must be taught by the skill, its rule, or its references. Example files must match a task. Reference links must resolve. Every skill must be in exactly one docs category. Docs and website pages must not use em dashes or the zero-width non-joiner.
- Every skill is now version 0.3.0. Ten skills gained an `## Evaluation` section.
- The docs site is now built with MkDocs Material. Skill, rule, and guide pages come straight from the repository, with a catalog page per category, search, a dark theme, and a Persian overview.

## 0.2.0 - 2026-10-30

### Added

- Skills for multi-vendor payouts, Shopify apps, a Next.js storefront, Google Merchant product feeds, tax and shipping, subscription billing, fraud and risk review, vector product search, product-description guardrails, and conversion events.
- Evaluation tasks and a worked example for every skill.
- A zero-dependency `commerce-agent-skills` command with `list` and `add`. The package is not published to the npm registry.
- A static docs build, a GitHub Pages workflow, and a manual release workflow that tags a version.

## 0.1.0 - 2026-10-30

### Added

- Skills for WooCommerce plugin development, the WooCommerce REST API, WordPress plugin security, payment gateway integration, product catalog modeling, marketplace search and ranking, checkout, Persian and RTL localization, order and webhook reliability, and product structured data.
- A plain-Markdown rule for each skill.
- Node.js checks for catalog documents, WooCommerce webhook signatures, Persian and search text, and product JSON-LD.
- A skill validator, a README catalog generator, tests, and a GitHub Actions workflow.
- Installation and format notes under `docs/`.

[0.3.0]: https://github.com/sadrmanesh/commerce-agent-skills/compare/v0.2.0...v0.3.0
