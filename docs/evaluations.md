# Evaluation fixtures

Every skill has `evals/tasks.json` and a worked example for each task in `evals/examples/<id>.md`.

A task is a prompt plus checks:

- `must_include` lists strings the answer has to contain, usually API names or field names.
- `must_not_include` lists strings the answer must not contain.

The worked example is one answer that passes those checks. It is not a score from a live agent run. `scripts/lib/evals.mjs` applies the checks as substring tests. The validator runs them on every example.

Use a fixture by giving an agent the `task` text and comparing the reply with `checkAnswer` from that module. A missing required string or a forbidden string is a failed check. Passing the checks does not prove the reply is correct beyond the strings the fixture names.
