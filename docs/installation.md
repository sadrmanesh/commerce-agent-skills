# Install skills and rules

commerce-agent-skills uses the [Agent Skills](https://agentskills.io/specification) layout. The specification defines the folder and the `SKILL.md` file. It does not define a single directory where every agent looks. Install the folders into the skills location your agent documents, then reload the session if that agent caches the skill list at startup.

## Install with the command

From a checkout of this repository:

```bash
node bin/commerce-agent-skills.mjs list
node bin/commerce-agent-skills.mjs add woocommerce-rest-api --dir /path/to/agent-skills
```

The package name is `commerce-agent-skills`. It is not published yet. After a publish, `npx commerce-agent-skills add <skill> --dir <path>` is the same command. See [cli.md](cli.md).

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

Replace the skill directory with the newer copy and keep the directory name. Read [CHANGELOG.md](../CHANGELOG.md) before overwriting a skill you have edited locally.
