# Command line

`commerce-agent-skills` is a zero-dependency Node.js command. Version 0.2.0 is ready to publish and is not on the npm registry. Run it from a checkout of this repository:

```bash
node bin/commerce-agent-skills.mjs list
node bin/commerce-agent-skills.mjs add woocommerce-rest-api --dir ./agent-skills
```

After the package is published, the same interface is:

```bash
npx commerce-agent-skills list
npx commerce-agent-skills add woocommerce-rest-api --dir ./agent-skills
```

`add` copies the skill directory, including references, scripts, assets, and evals, to `<dir>/<skill>/`. It refuses to replace an existing directory unless you pass `--force`.

`--with-rule` also copies `rules/<skill>.md` to a `rules` directory next to `<dir>`. If `<dir>` is `./agent-skills`, the rule is written to `./rules/<skill>.md`.

`list` prints one skill per line: the directory name, a tab, and the description. The description is what an agent uses to decide the skill is relevant.
