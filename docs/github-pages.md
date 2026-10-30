# Docs site

`node scripts/build-docs.mjs --out site` writes a static site. The `site/` directory is generated and is not committed.

GitHub Actions workflow `.github/workflows/pages.yml` builds that site and deploys it with GitHub Pages when commits land on `main`. The repository has to use GitHub Actions as the Pages source. In the repository settings, open Pages and set the source to GitHub Actions before the first deploy.

For this repository the project Pages address is `https://sadrmanesh.github.io/commerce-agent-skills/`. That address serves the site after a successful deploy. The workflow does not run from a pull request.

`.github/workflows/release.yml` is manual. It checks that the version you enter matches `package.json`, runs the validator and tests, tags `vX.Y.Z`, and creates a GitHub release. It does not publish the npm package.
