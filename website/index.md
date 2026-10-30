---
description: Agent Skills and rules for AI coding agents building e-commerce and marketplace products.
hide:
  - navigation
---

# commerce-agent-skills

**Agent Skills and always-on rules that help AI coding agents build e-commerce and marketplace products correctly: WooCommerce, Shopify, Stripe and Iranian gateways, inventory, returns, B2B pricing, search, feeds, accessibility, performance, MCP store tools, and RTL storefronts.**

<!-- skill-count --> skills in <!-- category-count --> categories, each with a matching rule, reference notes, evaluation fixtures, and small Node.js checks where a check beats another paragraph. Every skill follows the open [Agent Skills](https://agentskills.io/specification) format, so any agent that supports that format can load it.

[Get started](getting-started.md){ .md-button .md-button--primary }
[Browse the skills](skills/index.md){ .md-button }
[Hugging Face dataset](https://huggingface.co/datasets/sadrmanesh/commerce-agent-skills){ .md-button }
[GitHub](https://github.com/sadrmanesh/commerce-agent-skills){ .md-button }

```bash
npx @sadrmanesh/commerce-agent-skills init
npx @sadrmanesh/commerce-agent-skills add woocommerce-plugin-development stripe-payments
```

## Why

Commerce code fails in expensive ways: a webhook processed twice, a price in structured data that does not match the page, an order read through post meta after HPOS, a vendor paid before the money settled. General-purpose agents know the APIs but not these contracts.

- **Procedures, not essays.** Each skill is a short, ordered procedure with the exact API names, headers, and states that matter.
- **Constraints that stay in context.** Every skill has a plain Markdown rule for agents that keep short guidance loaded on every task.
- **Checks you can run.** Evaluation fixtures state what a correct answer must and must not contain. The validator runs them in CI, and the eval runner scores your own agent's answers against them.
- **Tool-agnostic.** Plain folders and Markdown. No vendor lock-in. One `npx` command copies the folders, or copy them by hand.

## Skill catalog

<!-- categories -->

## What is in a skill

<div class="grid cards" markdown>

-   :material-file-document-edit-outline:{ .lg .middle } **`SKILL.md`**

    ---

    Name, description with a clear "Use when", and the procedure an agent follows.

    [Skill format](guides/skill-format.md)

-   :material-format-list-checks:{ .lg .middle } **Matching rule**

    ---

    Eight to eighty lines of always-on constraints for the same area.

    [Rules](rules/index.md)

-   :material-test-tube:{ .lg .middle } **Evaluation fixtures**

    ---

    Tasks with `must_include` and `must_not_include` checks, a worked example, and a runner that scores answers.

    [Evaluation fixtures](guides/evaluations.md)

-   :material-console:{ .lg .middle } **Command line**

    ---

    A zero-dependency command that lists skills and copies one into your project.

    [Command line](guides/cli.md)

</div>

## License

MIT. Copyright (c) 2026 Naser Sadrmanesh.
