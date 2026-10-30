# Getting started

## Requirements

Node.js 20 or newer for the validator, the command, and the checks. The skills themselves are plain Markdown and need nothing.

## Get the library

```bash
git clone https://github.com/sadrmanesh/commerce-agent-skills.git
cd commerce-agent-skills
node scripts/validate-skills.mjs
```

## Add a skill to your project

List the skills, then copy one into a directory your agent already scans:

```bash
node bin/commerce-agent-skills.mjs list
node bin/commerce-agent-skills.mjs add woocommerce-plugin-development --dir ./agent-skills
```

Add `--with-rule` to copy the matching always-on rule as well. The package is not on the npm registry yet. After it is published, the same command is `npx commerce-agent-skills add <skill> --dir <path>`. See [Command line](guides/cli.md) and [Installation](guides/installation.md).

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

An empty list means the reply passed the checks. See [Evaluation fixtures](guides/evaluations.md).

## Next steps

- Browse the [skill catalog](skills/index.md).
- Read the [skill format](guides/skill-format.md) before writing a new skill.
- Read [Contributing](contributing.md) before opening a pull request.
