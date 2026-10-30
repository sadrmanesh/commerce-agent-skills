# Contributing

Thanks for considering a contribution to commerce-agent-skills. The maintainer is Naser Sadrmanesh.

## What this repository holds

Skills and rules for AI coding agents working on e-commerce and marketplace products. A change should state a procedure, a constraint, or a check an agent can run. Do not add a claim about adoption, performance, or compatibility that this repository has not established.

The license is MIT. Copyright (c) 2026 Naser Sadrmanesh. Contributions are made under the same license.

## Set up

Install Node.js 20 or newer. There is no dependency install.

```bash
node scripts/validate-skills.mjs
node scripts/generate-catalog.mjs --check
node scripts/run-evals.mjs
node --test
```

## Add or change a skill

1. Create `skills/<name>/SKILL.md`. The directory name and the `name` field match. Use lowercase letters, digits, and single hyphens.
2. Write a description of 100 to 320 characters that says what the skill does and includes `Use when`.
3. Set `license` to `MIT` and metadata `author` to `Naser Sadrmanesh`. Quote `version` as the `version` in `package.json`, currently `"0.3.0"`.
4. Keep `SKILL.md` at or under 500 lines, with `## Gotchas`, `## Verification`, and `## Evaluation` sections. Put long notes in `references/` and mention each file from `SKILL.md`.
5. If you add a script, use Node.js built-in modules only, set `compatibility`, and cover the script with a test in `test/`.
6. Add `rules/<name>.md`: plain Markdown, 8 to 80 lines, starting with the same heading as `SKILL.md`.
7. Add `evals/tasks.json` with at least two tasks and a worked example at `evals/examples/<id>.md` for each task. One task must include `must_not_include`. Every `must_include` string must appear in the skill, its rule, or its references.
8. Add the skill name to `skills/catalog-order.txt` and to one category in `website/categories.json`.
9. Regenerate the catalog:

```bash
node scripts/generate-catalog.mjs
```

API names, hooks, and headers should match the product's current developer documentation. Say which behavior you relied on when it is easy to get wrong. Do not invent an endpoint, a filter name, or a default.

## Pull requests

Use a focused branch. The pull request should say what changed and how you ran the validator and tests.

Keep authorship on the contributor and the repository copyright holder. Do not add product-specific agent configuration directories.

## Reporting issues

Use the bug or feature templates. A bug report for a skill should name the skill and the API or UI behavior that disagrees with the text.
