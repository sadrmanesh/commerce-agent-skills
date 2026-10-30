# Evaluation fixtures

Every skill has `evals/tasks.json` and a worked example for each task in `evals/examples/<id>.md`.

A task is a prompt plus checks:

- `must_include` lists strings the answer has to contain, usually API names or field names.
- `must_not_include` lists strings the answer must not contain.

The worked example is one answer that passes those checks. It is not a score from a live agent run. `scripts/lib/evals.mjs` applies the checks as substring tests, matching case. The validator runs them on every example, and it also fails when a `must_include` string never appears in the skill, its rule, or its references.

## Eval runner

`scripts/run-evals.mjs` scores answers against the fixtures.

```bash
# Check every worked example. Exits with status 1 unless all checks pass.
node scripts/run-evals.mjs

# Score your own answers, one file per task.
node scripts/run-evals.mjs --answers ./answers

# Only some skills, with a pass threshold and JSON output.
node scripts/run-evals.mjs --answers ./answers --skill stripe-payments --skill b2b-pricing --min-score 0.8 --json
```

With `--answers <dir>`, the runner reads `<dir>/<skill>/<task-id>.md`. To collect answers, give an agent the `task` text from `evals/tasks.json` with the skill installed, and save each reply under that path.

Scoring:

- Each `must_include` and `must_not_include` entry is one check.
- A task's score is the checks it passed divided by its checks. A task passes only when every check passes.
- A missing answer file scores 0 for that task.
- The runner prints a score per skill and an overall score. `--json` prints the full report instead.
- `--min-score` takes a number from 0 to 1. Without `--answers` it defaults to 1. With `--answers` it defaults to 0, so the run only reports.
- The exit status is 0 at or above the threshold, 1 below it, and 2 for a usage error or an unknown skill.

`npm run eval` runs the first command.

## Limits

Passing the checks does not prove the reply is correct beyond the strings the fixture names. Read failing answers, and read a sample of passing ones, before trusting a score.
