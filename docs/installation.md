# Install skills and rules

commerce-agent-skills uses the [Agent Skills](https://agentskills.io/specification) layout. The specification defines the folder and the `SKILL.md` file. It does not define a single directory where every agent looks. Install the folders into the skills location your agent documents, then reload the session if that agent caches the skill list at startup.

## Install with npx

The library is published on npm as `@sadrmanesh/commerce-agent-skills`. Run it from the root of your project:

```bash
npx @sadrmanesh/commerce-agent-skills list
npx @sadrmanesh/commerce-agent-skills init
npx @sadrmanesh/commerce-agent-skills add woocommerce-rest-api stripe-payments
```

`init` copies every skill to `.agents/skills/` and every rule to `.agents/rules/`. `add` copies only the skills you name. Use `--layout root` for `skills/` and `rules/` at the project root, or `--skills-dir` and `--rules-dir` for the directories your agent documents. See [cli.md](cli.md) for every option.

From a checkout of this repository, `node bin/commerce-agent-skills.mjs` takes the same arguments.

## Install from GitHub Packages

npmjs.com is the main registry. Each release is also published to GitHub Packages under the same name. To use it, point the `@sadrmanesh` scope at GitHub Packages in an `.npmrc` file. GitHub Packages asks for a token even for public packages: a personal access token (classic) with the `read:packages` scope.

```ini
@sadrmanesh:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npx @sadrmanesh/commerce-agent-skills init
```

Keep the token in the `GITHUB_TOKEN` environment variable, not in the file. Remove the scope line to go back to npmjs.com.

## Download from Hugging Face

Each release is also published as the [commerce-agent-skills dataset](https://huggingface.co/datasets/sadrmanesh/commerce-agent-skills) on Hugging Face. It holds the same `skills/` and `rules/` folders, plus a `skills` table with every `SKILL.md`, rule, reference note, and script, and an `evals` table with every evaluation task and its worked example. To copy the folders without Node.js:

```bash
hf download sadrmanesh/commerce-agent-skills --repo-type dataset \
  --include "skills/*" "rules/*" --local-dir .agents
```

To load the tables, for example to index the skills or score answers against the tasks:

```python
from datasets import load_dataset

skills = load_dataset("sadrmanesh/commerce-agent-skills", "skills", split="train")
evals = load_dataset("sadrmanesh/commerce-agent-skills", "evals", split="test")
```

## Install one skill

1. Copy the skill directory, for example `skills/woocommerce-plugin-development/`.
2. Place it so `SKILL.md` stays at `<skills-root>/woocommerce-plugin-development/SKILL.md`.
3. Do not rename the directory. `name` in the frontmatter must match it.
4. Start a new agent session if skills are discovered at startup.
5. Ask for work that matches the description. The description is what the agent uses to decide the skill is relevant.

Copy the reference files, scripts, and assets with the skill. A `SKILL.md` that points at a missing file is incomplete.

## Install the library

Copy every child of `skills/` into the agent's skills root. The agent's root should contain one directory per skill, not a nested `skills/skills/` directory.

You can omit skills you do not want the agent to consider. Each skill is self-contained except where the text tells the agent to use another skill in this library. If you omit one, also omit tasks that depend on it.

## Install rules

Files in `rules/` are plain Markdown. They are not Agent Skills and they have no frontmatter.

Copy the rules you want into the place your agent loads persistent project rules, or add them to the project's contributor instructions. Use a rule when the constraint should apply even if the agent never loads the longer skill.

Installing a rule does not install the skill, and installing a skill does not install the rule.

## Check an install

From this repository:

```bash
node scripts/validate-skills.mjs
```

That checks frontmatter, the directory name, linked files, and the matching rule. It does not talk to an agent and does not prove a particular product discovered the folder.

## Updates

Run `npx @sadrmanesh/commerce-agent-skills@latest init` to add skills that are new in a release. To refresh skills you already installed, run `add <skill> --force`, which replaces the whole skill directory. Without the command, replace the skill directory with the newer copy and keep the directory name. Read [CHANGELOG.md](../CHANGELOG.md) before overwriting a skill you have edited locally.
