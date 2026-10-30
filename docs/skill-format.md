# Skill format

This project follows the [Agent Skills specification](https://agentskills.io/specification).

## Layout

```text
skill-name/
├── SKILL.md
├── references/    optional notes, loaded when the skill says to read them
├── scripts/       optional Node.js tools
└── assets/        optional templates and examples
```

`SKILL.md` starts with YAML frontmatter and then Markdown instructions.

```yaml
---
name: skill-name
description: "What the skill does. Use when the task looks like this."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.1.0"
---
```

Required by the specification:

- `name` is 1 to 64 characters, lowercase letters, digits, and single hyphens. It matches the directory name.
- `description` is 1 to 1024 characters and says what the skill does and when to use it.

Required by this repository:

- The description includes the words `Use when`.
- `license` is `MIT`.
- `metadata.author` is `Naser Sadrmanesh`.
- `metadata.version` is a quoted string, currently `"0.1.0"`.
- `SKILL.md` is at most 500 lines.
- Every file under `references/`, `scripts/`, and `assets/` is mentioned from `SKILL.md`.
- A skill that ships `scripts/` sets `compatibility` and the scripts run on Node.js 20 or newer with no extra packages.

`metadata` values are strings. Quote version numbers so a YAML parser does not turn them into numbers.

## How agents load a skill

The usual pattern, from the specification's progressive disclosure guidance:

1. At startup, the agent can see `name` and `description` for every installed skill.
2. When a task matches, it reads the `SKILL.md` body.
3. It reads a reference or runs a script only when the body tells it to.

Write the description for that first step. Put the procedure in `SKILL.md`. Move long tables to `references/` and point to them from the step that needs them.

## Scripts

Scripts in this repository are standard ECMAScript modules. They have no package dependencies. Run them with `node` from the skill directory, as the skill text shows. They exit with a non-zero status when the check fails.

## Rules

Rules are documented in [rules.md](rules.md). They are not a second kind of skill.
