# Command line

`@sadrmanesh/commerce-agent-skills` is a zero-dependency Node.js command that copies skills and rules into a project. It needs Node.js 20 or newer. Everything it copies ships inside the package, so it makes no network requests after npm downloads it.

```bash
npx @sadrmanesh/commerce-agent-skills list
npx @sadrmanesh/commerce-agent-skills init
npx @sadrmanesh/commerce-agent-skills add stripe-payments returns-and-refunds
```

To keep a fixed version in a project, install it as a dev dependency and run the `commerce-agent-skills` command:

```bash
npm install --save-dev @sadrmanesh/commerce-agent-skills
npx commerce-agent-skills init
```

From a checkout of this repository, `node bin/commerce-agent-skills.mjs` takes the same arguments.

## Commands

| Command | What it does |
| --- | --- |
| `list` | Prints one skill per line: the directory name, a tab, and the description. `--json` prints an array of `{ name, description }`. |
| `init` | Copies every skill and its rule. `--only a,b` limits it to the named skills. Skills that are already installed are skipped, so running it again only adds new skills. |
| `add <skill> [<skill> ...]` | Copies the named skills and their rules. It stops with status 1 if a skill is already installed, unless you pass `--force`. |

`--help` prints the usage and `--version` prints the package version.

## Where files go

The specification behind the skill format does not name one directory that every agent scans, so the command lets you choose. Paths are relative to `--target`, which defaults to the current directory.

| Layout | Skills | Rules |
| --- | --- | --- |
| `agents` (default) | `.agents/skills/<skill>/` | `.agents/rules/<skill>.md` |
| `root` | `skills/<skill>/` | `rules/<skill>.md` |

If your agent reads skills from somewhere else, set the directories yourself:

```bash
npx @sadrmanesh/commerce-agent-skills init --skills-dir path/to/skills --rules-dir path/to/rules
```

`--dir <path>` is the form from 0.2.0. It writes skills to `<path>` and rules to a `rules` directory next to it, so `--dir ./agent-skills` writes rules to `./rules/`.

## Options

| Option | Meaning |
| --- | --- |
| `--target <dir>` | Project to install into. Default: the current directory. |
| `--layout <name>` | `agents` or `root`. |
| `--skills-dir <path>` | Skills directory. Overrides the layout. |
| `--rules-dir <path>` | Rules directory. Overrides the layout. |
| `--dir <path>` | Skills directory, with rules in a sibling `rules` directory. |
| `--only <a,b>` | `init` only: install these skills. |
| `--no-rules` | Copy skills without their rules. |
| `--force` | Replace installed skills. Local edits inside those skill directories are lost. |
| `--dry-run` | Print what would be copied and write nothing. |

Each skill is copied as a whole directory, including references, scripts, assets, and evals, because a `SKILL.md` that points at a missing file is incomplete.

## Exit status

| Status | Meaning |
| --- | --- |
| 0 | Success, including skills that `init` skipped. |
| 1 | An unknown skill, a skill that already exists for `add`, or a file error. |
| 2 | A usage error, such as an unknown command or option. |

## Use it from a script

The command is also an ES module:

```js
import { installSkills, listSkillRecords } from "@sadrmanesh/commerce-agent-skills/bin/commerce-agent-skills.mjs";

const skills = await listSkillRecords();
await installSkills({ names: ["stripe-payments"], target: ".", layout: "root" });
```
