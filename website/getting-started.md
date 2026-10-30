# Getting started

## Requirements

Node.js 20 or newer for the validator, the command, and the checks. The skills themselves are plain Markdown and need nothing.

## Install into your project

Run this from the root of your project:

```bash
npx @sadrmanesh/commerce-agent-skills init
```

It copies every skill to `.agents/skills/` and every rule to `.agents/rules/`. Nothing is downloaded after the package itself.

To choose skills, or to write them where your agent looks:

```bash
npx @sadrmanesh/commerce-agent-skills list
npx @sadrmanesh/commerce-agent-skills add woocommerce-plugin-development stripe-payments
npx @sadrmanesh/commerce-agent-skills init --layout root
npx @sadrmanesh/commerce-agent-skills init --skills-dir path/to/skills --rules-dir path/to/rules
```

`--no-rules` skips the rules, `--force` replaces installed skills, and `--dry-run` prints the plan. See [Command line](guides/cli.md) and [Installation](guides/installation.md).

## Work on the library

```bash
git clone https://github.com/sadrmanesh/commerce-agent-skills.git
cd commerce-agent-skills
node scripts/validate-skills.mjs
```

## How an agent uses a skill

1. The agent reads each skill's `name` and `description` and decides whether the skill applies to the task.
2. When it applies, the agent reads the `SKILL.md` body and follows the procedure.
3. Reference files and scripts are loaded only when the skill points to them, which keeps the context small.

Rules work differently. A skill is for a task. A rule is for every task in that area, so it is short enough to stay loaded all the time. See [Rules](rules/index.md).

## Check an answer

Every skill ships evaluation fixtures. Give an agent the task text and check the reply:

```js
import { checkAnswer } from "./scripts/lib/evals.mjs";

const errors = checkAnswer(reply, {
  must_include: ["wc_get_order"],
  must_not_include: ["update_post_meta"],
});
```

An empty list means the reply passed the checks.

To score many replies at once, save each one as `answers/<skill>/<task-id>.md` and run the eval runner:

```bash
node scripts/run-evals.mjs --answers ./answers --min-score 0.8
```

It prints a score per skill and exits with status 1 below the threshold. See [Evaluation fixtures](guides/evaluations.md).

## Next steps

- Browse the [skill catalog](skills/index.md).
- Read the [skill format](guides/skill-format.md) before writing a new skill.
- Read [Contributing](contributing.md) before opening a pull request.
