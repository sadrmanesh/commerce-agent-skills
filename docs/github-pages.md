# Docs site

The docs site is built with [MkDocs](https://www.mkdocs.org/) and the Material theme. Most of its pages are generated from the repository, so the site cannot drift from the skills:

- `scripts/build-docs.mjs` reads `skills/`, `rules/`, and `docs/`, and writes the site source to `build/site-src/`. Every skill gets a page with its description, procedure, reference notes, and evaluation tasks. Every rule and every guide in `docs/` gets a page too.
- `website/` holds the hand-written pages: the home page, getting started, and the Persian overview. `website/categories.json` groups the skills into catalog sections. The build fails if a skill is missing from it or listed twice.
- `mkdocs.yml` holds the theme and Markdown settings. The generator writes `build/mkdocs.yml`, which inherits it and adds the navigation.

Build it locally:

```bash
pip install -r requirements-docs.txt
node scripts/build-docs.mjs
mkdocs build --strict -f build/mkdocs.yml
```

Use `mkdocs serve -f build/mkdocs.yml` for a live preview. The `build/` and `site/` directories are generated and are not committed.

## Deploys

The CI workflow runs the same strict build on every pull request. `.github/workflows/pages.yml` builds the site and deploys it with GitHub Pages when commits land on `main`. The repository uses GitHub Actions as the Pages source. The workflow skips the deploy while the repository is private.

The site is served at `https://sadrmanesh.github.io/commerce-agent-skills/`.

## Releases

`.github/workflows/release.yml` is manual. It checks that the version you enter matches `package.json`, runs the validator and tests, tags `vX.Y.Z`, and creates a GitHub release. It does not publish the npm package.
