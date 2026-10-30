#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRepository } from "./lib/skills.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const css = `
:root { color-scheme: light; --ink: #1c1917; --muted: #57534e; --line: #e7e5e4; --bg: #fafaf9; --card: #fff; }
* { box-sizing: border-box; }
body { margin: 0; font: 16px/1.55 "Segoe UI", Helvetica, Arial, sans-serif; color: var(--ink); background: var(--bg); }
header, main, footer { width: min(920px, calc(100% - 2rem)); margin: 0 auto; }
header { padding: 1.25rem 0; display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
nav a { color: var(--ink); margin-right: 0.8rem; }
main { background: var(--card); border: 1px solid var(--line); padding: 1.25rem 1.4rem 2rem; }
h1 { font-size: 1.8rem; line-height: 1.2; }
h2 { margin-top: 1.6rem; font-size: 1.25rem; }
table { border-collapse: collapse; width: 100%; font-size: 0.95rem; }
th, td { border: 1px solid var(--line); padding: 0.4rem 0.5rem; vertical-align: top; text-align: left; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92em; }
pre { overflow: auto; background: #f5f5f4; padding: 0.8rem; border: 1px solid var(--line); }
pre code { font-size: 0.85rem; }
a { color: #1d4ed8; }
footer { color: var(--muted); font-size: 0.9rem; padding: 1.5rem 0 2rem; }
.lead { color: var(--muted); }
`;

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = null;
  let table = [];
  let code = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }
    html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) {
      return;
    }
    html.push(`<${list.type}>${list.items.map((item) => `<li>${inline(item)}</li>`).join("")}</${list.type}>`);
    list = null;
  };
  const flushTable = () => {
    if (table.length === 0) {
      return;
    }
    const rows = table.filter((row) => !/^\s*\|?\s*-{3,}/.test(row.join(" | ")));
    const [head, ...body] = rows;
    const renderRow = (cells, cell) => `<tr>${cells.map((value) => `<${cell}>${inline(value)}</${cell}>`).join("")}</tr>`;
    html.push(`<table>${head ? `<thead>${renderRow(head, "th")}</thead>` : ""}<tbody>${body.map((row) => renderRow(row, "td")).join("")}</tbody></table>`);
    table = [];
  };

  for (const line of lines) {
    if (code) {
      if (line.startsWith("```")) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = null;
      } else {
        code.push(line);
      }
      continue;
    }
    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      flushTable();
      code = [];
      continue;
    }
    if (line.trim() === "") {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }
    if (line.startsWith("|")) {
      flushParagraph();
      flushList();
      table.push(splitRow(line));
      continue;
    }
    flushTable();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2];
      html.push(`<h${level} id="${slug(text)}">${inline(text)}</h${level}>`);
      continue;
    }
    const item = /^(\s*)([-*]|\d+\.)\s+(.+)$/.exec(line);
    if (item) {
      flushParagraph();
      const type = item[2].endsWith(".") ? "ol" : "ul";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(item[3]);
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  flushTable();
  if (code) {
    html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  }
  return html.join("\n");
}

function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

export function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function prepareSkillMarkdown(markdown) {
  return markdown
    .replaceAll(/\(references\/([^)/]+)\.md\)/g, (_, name) => `(#reference-${slug(`${name}.md`)})`)
    .replaceAll("(evals/tasks.json)", "(#evaluation)");
}

export function prepareReadme(markdown) {
  return markdown.replaceAll(/\(skills\/([^)/]+)\/SKILL\.md\)/g, "(skills/$1.html)");
}

function inline(text) {
  const parts = [];
  const pattern = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    parts.push(escapeHtml(text.slice(last, match.index)));
    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(`<code>${escapeHtml(token.slice(1, -1))}</code>`);
    } else if (token.startsWith("**")) {
      parts.push(`<strong>${escapeHtml(token.slice(2, -2))}</strong>`);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const href = rewriteHref(link[2]);
      parts.push(`<a href="${escapeHtml(href)}">${escapeHtml(link[1])}</a>`);
    }
    last = match.index + token.length;
  }
  parts.push(escapeHtml(text.slice(last)));
  return parts.join("");
}

function rewriteHref(href) {
  if (/^(https?:|mailto:|#)/.test(href)) {
    return href;
  }
  if (href.endsWith(".md")) {
    return href.replace(/\.md$/, ".html");
  }
  return href;
}

function page({ title, body, depth }) {
  const prefix = depth === 0 ? "" : "../".repeat(depth);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${prefix}assets/site.css">
</head>
<body>
<header>
<a href="${prefix}index.html">commerce-agent-skills</a>
<nav>
<a href="${prefix}index.html">Overview</a>
<a href="${prefix}skills/index.html">Skills</a>
<a href="${prefix}rules/index.html">Rules</a>
<a href="${prefix}docs/installation.html">Docs</a>
</nav>
</header>
<main>
${body}
</main>
<footer>
<p>Naser Sadrmanesh. <a href="https://github.com/sadrmanesh">GitHub</a>. <a href="https://sadrmanesh.github.io">Website</a>. MIT License.</p>
</footer>
</body>
</html>
`;
}

export async function buildSite(repoRoot, outDir) {
  const repo = await loadRepository(repoRoot);
  await mkdir(path.join(outDir, "assets"), { recursive: true });
  await mkdir(path.join(outDir, "skills"), { recursive: true });
  await mkdir(path.join(outDir, "rules"), { recursive: true });
  await mkdir(path.join(outDir, "docs"), { recursive: true });
  await writeFile(path.join(outDir, "assets", "site.css"), css);

  const byName = new Map(repo.skills.map((skill) => [skill.name, skill]));
  const ordered = repo.order.map((name) => byName.get(name));
  const catalog = ordered.map((skill) => `<li><a href="${skill.name}.html"><code>${escapeHtml(skill.name)}</code></a> — ${escapeHtml(skill.data.description)}</li>`).join("\n");
  await writeFile(path.join(outDir, "skills", "index.html"), page({
    title: "Skills",
    depth: 1,
    body: `<h1>Skills</h1>\n<ul>\n${catalog}\n</ul>`,
  }));

  for (const skill of ordered) {
    const references = await referenceSections(skill.dir);
    const body = `<p class="lead">${escapeHtml(skill.data.description)}</p>\n${renderMarkdown(prepareSkillMarkdown(skill.body))}\n${references}`;
    await writeFile(path.join(outDir, "skills", `${skill.name}.html`), page({
      title: skill.name,
      depth: 1,
      body,
    }));
    const rule = await readFile(path.join(repo.rulesDir, `${skill.name}.md`), "utf8");
    await writeFile(path.join(outDir, "rules", `${skill.name}.html`), page({
      title: `${skill.name} rule`,
      depth: 1,
      body: renderMarkdown(rule),
    }));
  }
  const ruleLinks = ordered.map((skill) => `<li><a href="${skill.name}.html">${escapeHtml(skill.name)}</a></li>`).join("\n");
  await writeFile(path.join(outDir, "rules", "index.html"), page({
    title: "Rules",
    depth: 1,
    body: `<h1>Rules</h1>\n<ul>\n${ruleLinks}\n</ul>`,
  }));

  const docFiles = (await readdir(path.join(repoRoot, "docs"))).filter((name) => name.endsWith(".md")).sort();
  for (const file of docFiles) {
    const markdown = await readFile(path.join(repoRoot, "docs", file), "utf8");
    const htmlName = file.replace(/\.md$/, ".html");
    await writeFile(path.join(outDir, "docs", htmlName), page({
      title: file.replace(/\.md$/, ""),
      depth: 1,
      body: renderMarkdown(markdown),
    }));
  }

  const readme = await readFile(path.join(repoRoot, "README.md"), "utf8");
  await writeFile(path.join(outDir, "index.html"), page({
    title: "commerce-agent-skills",
    depth: 0,
    body: renderMarkdown(prepareReadme(readme)),
  }));
  for (const file of ["CONTRIBUTING.md", "CHANGELOG.md"]) {
    const markdown = await readFile(path.join(repoRoot, file), "utf8");
    await writeFile(path.join(outDir, file.replace(/\.md$/, ".html")), page({
      title: file.replace(/\.md$/, ""),
      depth: 0,
      body: renderMarkdown(markdown),
    }));
  }
  return { skills: ordered.length, docs: docFiles.length };
}

async function referenceSections(skillDir) {
  let entries = [];
  try {
    entries = (await readdir(path.join(skillDir, "references"))).filter((name) => name.endsWith(".md")).sort();
  } catch (error) {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
  const sections = [];
  for (const file of entries) {
    const markdown = await readFile(path.join(skillDir, "references", file), "utf8");
    sections.push(`<h2 id="reference-${slug(file)}">Reference: ${escapeHtml(file)}</h2>\n${renderMarkdown(markdown)}`);
  }
  return sections.join("\n");
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const out = path.resolve(readOption("--out") ?? path.join(root, "site"));
  const result = await buildSite(root, out);
  console.log(`Wrote ${result.skills} skill pages and ${result.docs} docs to ${out}`);
}
