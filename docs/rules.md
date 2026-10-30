# Rules

Each file in [`rules/`](../rules/) is a short list of constraints for one skill. The file name matches the skill directory. The file is plain Markdown: a heading and the rules. It has no YAML frontmatter.

Use a rule as always-on guidance. Use the matching skill when the agent is doing that task and needs the procedure, examples, and references.

The validator checks that:

- Every skill has a rule, and every rule names a skill.
- A rule starts with a level-1 heading.
- A rule is between 8 and 80 lines.

Keep a rule specific enough that an agent can apply it without opening the skill. If a rule needs a worked example, that example belongs in the skill instead.
