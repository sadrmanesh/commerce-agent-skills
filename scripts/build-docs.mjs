#!/usr/bin/env node
/**
 * Generate the MkDocs source for the documentation site from the skills,
 * rules, docs, and hand-written pages under website/.
 *
 *   node scripts/build-docs.mjs            # writes build/site-src and build/mkdocs.yml
 *   mkdocs build --strict -f build/mkdocs.yml
 *
 * Skill, rule, and guide pages are generated on every build, so the site
 * always matches the files in the repository.
 */
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRepository } from "./lib/skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const posix = path.posix;
export const SOURCE_URL = "https://github.com/sadrmanesh/commerce-agent-skills";

const GUIDES = [
  ["installation.md", "Installation"],
  ["cli.md", "Command line"],
  ["skill-format.md", "Skill format"],
  ["evaluations.md", "Evaluation fixtures"],
  ["rules.md", "Rules"],
  ["github-pages.md", "Docs site"],
];

export function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

/** Map a repository path to a site page (and optional anchor), or null. */
function makeResolver(skillCategory) {
  return function resolve(repoPath) {
    const clean = repoPath.replace(/\/$/, "");
    let m;
    if (clean === "README.md") return { page: "index.md" };
    if (clean === "CHANGELOG.md") return { page: "changelog.md" };
    if (clean === "CONTRIBUTING.md") return { page: "contributing.md" };
    if (clean === "rules") return { page: "rules/index.md" };
    if (clean === "skills") return { page: "skills/index.md" };
    if ((m = /^docs\/([^/]+\.md)$/.exec(clean)) && GUIDES.some(([file]) => file === m[1])) {
      return { page: `guides/${m[1]}` };
    }
    if ((m = /^rules\/([^/]+)\.md$/.exec(clean)) && skillCategory.has(m[1])) {
      return { page: `rules/${m[1]}.md` };
    }
    if ((m = /^skills\/([^/]+)(?:\/SKILL\.md)?$/.exec(clean)) && skillCategory.has(m[1])) {
      return { page: `skills/${skillCategory.get(m[1])}/${m[1]}.md` };
    }
    if ((m = /^skills\/([^/]+)\/references\/([^/]+\.md)$/.exec(clean)) && skillCategory.has(m[1])) {
      return { page: `skills/${skillCategory.get(m[1])}/${m[1]}.md`, anchor: `reference-${slug(m[2])}` };
    }
    if ((m = /^skills\/([^/]+)\/evals(?:\/tasks\.json)?$/.exec(clean)) && skillCategory.has(m[1])) {
      return { page: `skills/${skillCategory.get(m[1])}/${m[1]}.md`, anchor: "evaluation" };
    }
    return null;
  };
}

/**
 * Rewrite relative Markdown links written for GitHub so they work on the site.
 * Links to files that are not site pages point at the file on GitHub.
 */
export function rewriteLinks(markdown, { sourcePath, targetPage, resolve }) {
  const lines = markdown.split("\n");
  let fence = null;
  return lines
    .map((line) => {
      const fenceMatch = /^\s*(```+|~~~+)/.exec(line);
      if (fenceMatch) {
        if (!fence) fence = fenceMatch[1];
        else if (fenceMatch[1].startsWith(fence)) fence = null;
        return line;
      }
      if (fence) return line;
      return line.replace(/\]\(([^)\s]+)\)/g, (whole, href) => {
        if (/^(https?:|mailto:|#)/.test(href)) return whole;
        const [target, hash] = href.split("#");
        const repoPath = posix.normalize(posix.join(posix.dirname(sourcePath), target));
        const hit = resolve(repoPath);
        if (hit) {
          const rel = hit.page === targetPage ? "" : posix.relative(posix.dirname(targetPage), hit.page);
          const anchor = hash ?? hit.anchor;
          return `](${rel}${anchor ? `#${anchor}` : ""})`;
        }
        const kind = target.endsWith("/") || !posix.extname(repoPath) ? "tree" : "blob";
        return `](${SOURCE_URL}/${kind}/main/${repoPath}${hash ? `#${hash}` : ""})`;
      });
    })
    .join("\n");
}

/** Shift ATX headings down by `levels`, ignoring fenced code. */
export function demoteHeadings(markdown, levels) {
  let fence = null;
  return markdown
    .split("\n")
    .map((line) => {
      const fenceMatch = /^\s*(```+|~~~+)/.exec(line);
      if (fenceMatch) {
        if (!fence) fence = fenceMatch[1];
        else if (fenceMatch[1].startsWith(fence)) fence = null;
        return line;
      }
      if (fence) return line;
      const h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (!h) return line;
      return `${"#".repeat(Math.min(6, h[1].length + levels))} ${h[2]}`;
    })
    .join("\n");
}

function splitTitle(markdown, fallback) {
  const lines = markdown.replace(/^\s+/, "").split("\n");
  if (/^#\s+/.test(lines[0])) {
    return { title: lines[0].replace(/^#\s+/, "").trim(), body: lines.slice(1).join("\n").replace(/^\s+/, "") };
  }
  return { title: fallback, body: markdown };
}

function indent(text, spaces = 4) {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : pad + line))
    .join("\n");
}

async function listFiles(dir, filter) {
  try {
    return (await readdir(dir)).filter(filter).sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function loadCategories(repoRoot, skills) {
  const categories = JSON.parse(await readFile(path.join(repoRoot, "website", "categories.json"), "utf8"));
  const skillCategory = new Map();
  for (const category of categories) {
    for (const name of category.skills) {
      if (skillCategory.has(name)) throw new Error(`Skill ${name} is in more than one category`);
      skillCategory.set(name, category.id);
    }
  }
  const missing = skills.filter((skill) => !skillCategory.has(skill.name)).map((skill) => skill.name);
  const unknown = [...skillCategory.keys()].filter((name) => !skills.some((skill) => skill.name === name));
  if (missing.length || unknown.length) {
    throw new Error(
      `website/categories.json is out of sync. Missing: ${missing.join(", ") || "none"}. Unknown: ${unknown.join(", ") || "none"}.`,
    );
  }
  return { categories, skillCategory };
}

async function skillPage(repoRoot, skill, category, resolve) {
  const page = `skills/${category.id}/${skill.name}.md`;
  const source = `skills/${skill.name}/SKILL.md`;
  const { title, body } = splitTitle(skill.body, skill.name);
  const out = [];
  out.push("---", `title: ${yamlString(title)}`, `description: ${yamlString(skill.data.description)}`, "---", "");
  out.push(`# ${title}`, "");
  out.push(`!!! abstract "\`${skill.name}\`"`, "", indent(skill.data.description), "");
  const version = skill.data.metadata?.version ?? "";
  out.push(
    `:material-tag-outline: ${version ? `Version ${version}` : "Unversioned"} &nbsp;&middot;&nbsp; ` +
      `:material-scale-balance: ${skill.data.license ?? "MIT"} &nbsp;&middot;&nbsp; ` +
      `[:material-github: Source](${SOURCE_URL}/tree/main/skills/${skill.name}) &nbsp;&middot;&nbsp; ` +
      `[:material-format-list-checks: Rule](../../rules/${skill.name}.md)`,
    "",
  );
  out.push(
    '??? tip "Install this skill"',
    "",
    indent(
      [
        "Copy the skill and its rule into your project:",
        "",
        "```bash",
        `npx @sadrmanesh/commerce-agent-skills add ${skill.name}`,
        "```",
        "",
        "The skill goes to `.agents/skills/` and the rule to `.agents/rules/`. See [Command line](../../guides/cli.md) for other directories.",
      ].join("\n"),
    ),
    "",
  );
  out.push(rewriteLinks(body, { sourcePath: source, targetPage: page, resolve }).trimEnd(), "");

  const refDir = path.join(skill.dir, "references");
  const refs = await listFiles(refDir, (name) => name.endsWith(".md"));
  if (refs.length) {
    out.push("## References", "");
    for (const file of refs) {
      const markdown = await readFile(path.join(refDir, file), "utf8");
      const { title: refTitle, body: refBody } = splitTitle(markdown, file);
      out.push(`### ${refTitle} { #reference-${slug(file)} }`, "");
      const linked = rewriteLinks(refBody, {
        sourcePath: `skills/${skill.name}/references/${file}`,
        targetPage: page,
        resolve,
      });
      out.push(demoteHeadings(linked, 2).trimEnd(), "");
    }
  }

  const tasksPath = path.join(skill.dir, "evals", "tasks.json");
  let tasks = [];
  try {
    tasks = JSON.parse(await readFile(tasksPath, "utf8")).tasks ?? [];
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (tasks.length) {
    out.push("## Evaluation { #evaluation }", "");
    out.push(
      `Fixtures from [\`evals/tasks.json\`](${SOURCE_URL}/blob/main/skills/${skill.name}/evals/tasks.json). ` +
        "See [evaluation fixtures](../../guides/evaluations.md) for how the checks work.",
      "",
    );
    for (const task of tasks) {
      out.push(`### \`${task.id}\``, "", task.task, "");
      const include = task.expects?.must_include ?? [];
      const exclude = task.expects?.must_not_include ?? [];
      if (include.length) out.push(`**Must include:** ${include.map((s) => `\`${s}\``).join(", ")}`, "");
      if (exclude.length) out.push(`**Must not include:** ${exclude.map((s) => `\`${s}\``).join(", ")}`, "");
      try {
        const example = await readFile(path.join(skill.dir, "evals", "examples", `${task.id}.md`), "utf8");
        const linked = rewriteLinks(example.trim(), {
          sourcePath: `skills/${skill.name}/evals/examples/${task.id}.md`,
          targetPage: page,
          resolve,
        });
        out.push('??? example "Worked example"', "", indent(demoteHeadings(linked, 3)), "");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  }
  return { page, text: `${out.join("\n").trimEnd()}\n`, title };
}

function skillTable(skills, fromPage, skillCategory) {
  const rows = skills.map((skill) => {
    const target = `skills/${skillCategory.get(skill.name)}/${skill.name}.md`;
    const rel = posix.relative(posix.dirname(fromPage), target);
    const description = skill.data.description.replace(/\|/g, "\\|");
    return `| [\`${skill.name}\`](${rel}) | ${description} |`;
  });
  return ["| Skill | What it covers |", "| :--- | :--- |", ...rows].join("\n");
}

function categoryCards(categories, byName, fromPage) {
  const cards = categories.map((category) => {
    const rel = posix.relative(posix.dirname(fromPage), `skills/${category.id}/index.md`);
    const names = category.skills.map((name) => `\`${name}\``).join(", ");
    return [
      `-   :${category.icon.replace("/", "-")}:{ .lg .middle } **${category.title}**`,
      "",
      "    ---",
      "",
      `    ${category.summary}`,
      "",
      `    <small>${category.skills.length} skills: ${names}</small>`,
      "",
      `    [:octicons-arrow-right-24: Browse](${rel})`,
    ].join("\n");
  });
  return ['<div class="grid cards" markdown>', "", cards.join("\n\n"), "", "</div>"].join("\n");
}

export async function buildSite(repoRoot = root, outDir = path.join(repoRoot, "build", "site-src")) {
  const repo = await loadRepository(repoRoot);
  const byName = new Map(repo.skills.map((skill) => [skill.name, skill]));
  const { categories, skillCategory } = await loadCategories(repoRoot, repo.skills);
  const resolve = makeResolver(skillCategory);
  const write = async (page, text) => {
    const file = path.join(outDir, page);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text);
  };

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // Hand-written pages and assets.
  const website = path.join(repoRoot, "website");
  for (const entry of await readdir(website, { withFileTypes: true })) {
    if (entry.name === "categories.json") continue;
    await cp(path.join(website, entry.name), path.join(outDir, entry.name), { recursive: true });
  }
  const homePath = path.join(outDir, "index.md");
  const home = await readFile(homePath, "utf8");
  await writeFile(
    homePath,
    home
      .replaceAll("<!-- skill-count -->", String(repo.skills.length))
      .replaceAll("<!-- category-count -->", String(categories.length))
      .replace("<!-- categories -->", categoryCards(categories, byName, "index.md")),
  );

  // Skill catalog.
  const nav = [];
  const catalogNav = ["skills/index.md"];
  const catalog = [
    "---",
    "title: Skill catalog",
    "---",
    "",
    "# Skill catalog",
    "",
    `${repo.skills.length} skills in ${categories.length} categories. Each skill is a folder with a \`SKILL.md\` file in the ` +
      "[Agent Skills](https://agentskills.io/specification) format, reference notes, evaluation fixtures, and a matching rule.",
    "",
    categoryCards(categories, byName, "skills/index.md"),
    "",
  ];
  for (const category of categories) {
    const skills = category.skills.map((name) => byName.get(name));
    catalog.push(`## ${category.title}`, "", category.summary, "", skillTable(skills, "skills/index.md", skillCategory), "");
    const indexPage = `skills/${category.id}/index.md`;
    await write(
      indexPage,
      [
        "---",
        `title: ${yamlString(category.title)}`,
        "---",
        "",
        `# ${category.title}`,
        "",
        category.summary,
        "",
        skillTable(skills, indexPage, skillCategory),
        "",
      ].join("\n"),
    );
    const sectionNav = [indexPage];
    for (const skill of skills) {
      const generated = await skillPage(repoRoot, skill, category, resolve);
      await write(generated.page, generated.text);
      sectionNav.push({ [skill.name]: generated.page });
    }
    catalogNav.push({ [category.title]: sectionNav });
  }
  await write("skills/index.md", `${catalog.join("\n").trimEnd()}\n`);

  // Rules.
  const rulesGuide = await readFile(path.join(repoRoot, "docs", "rules.md"), "utf8");
  const { body: rulesIntro } = splitTitle(rulesGuide, "Rules");
  const rulesNav = ["rules/index.md"];
  const ruleRows = [];
  for (const category of categories) {
    for (const name of category.skills) {
      const markdown = await readFile(path.join(repo.rulesDir, `${name}.md`), "utf8");
      const { title, body } = splitTitle(markdown, name);
      const page = `rules/${name}.md`;
      const skillLink = posix.relative("rules", `skills/${category.id}/${name}.md`);
      await write(
        page,
        [
          "---",
          `title: ${yamlString(title)}`,
          "---",
          "",
          `# ${title}`,
          "",
          `:material-file-document-outline: Always-on rule for [\`${name}\`](${skillLink}) &nbsp;&middot;&nbsp; ` +
            `[:material-github: Source](${SOURCE_URL}/blob/main/rules/${name}.md)`,
          "",
          rewriteLinks(body, { sourcePath: `rules/${name}.md`, targetPage: page, resolve }).trimEnd(),
          "",
        ].join("\n"),
      );
      rulesNav.push({ [name]: page });
      ruleRows.push(`| [\`${name}\`](${name}.md) | ${category.title} |`);
    }
  }
  await write(
    "rules/index.md",
    [
      "---",
      "title: Rules",
      "---",
      "",
      "# Rules",
      "",
      rewriteLinks(rulesIntro.trimEnd(), { sourcePath: "docs/rules.md", targetPage: "rules/index.md", resolve }),
      "",
      "| Rule | Category |",
      "| :--- | :--- |",
      ...ruleRows,
      "",
    ].join("\n"),
  );

  // Guides from docs/.
  const guidesNav = [];
  for (const [file, label] of GUIDES) {
    const markdown = await readFile(path.join(repoRoot, "docs", file), "utf8");
    const page = `guides/${file}`;
    await write(page, `${rewriteLinks(markdown, { sourcePath: `docs/${file}`, targetPage: page, resolve }).trimEnd()}\n`);
    guidesNav.push({ [label]: page });
  }

  // Contributing and changelog.
  for (const [file, page] of [
    ["CONTRIBUTING.md", "contributing.md"],
    ["CHANGELOG.md", "changelog.md"],
  ]) {
    const markdown = await readFile(path.join(repoRoot, file), "utf8");
    await write(page, `${rewriteLinks(markdown, { sourcePath: file, targetPage: page, resolve }).trimEnd()}\n`);
  }

  nav.push(
    { Home: "index.md" },
    { "Getting started": "getting-started.md" },
    { "Skill catalog": catalogNav },
    { Rules: rulesNav },
    { Guides: guidesNav },
    { Contributing: "contributing.md" },
    { Changelog: "changelog.md" },
    { "فارسی": "fa.md" },
  );

  const configDir = path.dirname(outDir);
  const toPosix = (value) => value.split(path.sep).join("/");
  const config = [
    "# Generated by scripts/build-docs.mjs. Edit mkdocs.yml and website/ instead.",
    `INHERIT: ${toPosix(path.relative(configDir, path.join(repoRoot, "mkdocs.yml")))}`,
    `docs_dir: ${toPosix(path.basename(outDir))}`,
    `site_dir: ${toPosix(path.relative(configDir, path.join(repoRoot, "site")))}`,
    `nav: ${JSON.stringify(nav)}`,
    "",
  ].join("\n");
  await writeFile(path.join(configDir, "mkdocs.yml"), config);

  return { skills: repo.skills.length, categories: categories.length, guides: GUIDES.length, outDir };
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const out = readOption("--out") ? path.resolve(readOption("--out")) : undefined;
  const result = await buildSite(root, out);
  console.log(
    `Wrote ${result.skills} skill pages in ${result.categories} categories and ${result.guides} guides to ${path.relative(root, result.outDir)}`,
  );
  const config = path.relative(process.cwd(), path.join(path.dirname(result.outDir), "mkdocs.yml"));
  console.log(`Build the site with: mkdocs build --strict -f ${config}`);
}
