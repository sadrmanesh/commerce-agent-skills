import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assertSpecFrontmatter, parseFrontmatter, splitFrontmatter } from "./frontmatter.mjs";

export const SKILL_LINE_LIMIT = 500;
export const RULE_LINE_MIN = 8;
export const RULE_LINE_MAX = 80;

export async function loadRepository(root) {
  const skillsDir = path.join(root, "skills");
  const rulesDir = path.join(root, "rules");
  const orderPath = path.join(skillsDir, "catalog-order.txt");
  const orderRaw = await readFile(orderPath, "utf8");
  const order = orderRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const skills = [];

  for (const name of directories) {
    const dir = path.join(skillsDir, name);
    const skillPath = path.join(dir, "SKILL.md");
    const text = await readFile(skillPath, "utf8");
    const { yaml, body, normalized } = splitFrontmatter(text);
    const data = parseFrontmatter(yaml);
    skills.push({
      name,
      dir,
      skillPath,
      text: normalized,
      yaml,
      body,
      data,
      lineCount: normalized.split("\n").length,
    });
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));
  return { root, skillsDir, rulesDir, order, skills };
}

export function validateSkillRecord(skill) {
  const errors = [];
  const prefix = skill.name;

  let specErrors = [];
  try {
    specErrors = assertSpecFrontmatter(skill.data);
  } catch (error) {
    errors.push(`${prefix}: ${error.message}`);
    return errors;
  }
  for (const error of specErrors) {
    errors.push(`${prefix}: ${error}`);
  }

  if (typeof skill.data.name === "string" && skill.data.name !== skill.name) {
    errors.push(`${prefix}: name "${skill.data.name}" must match the directory name`);
  }
  if (typeof skill.data.description === "string" && !skill.data.description.includes("Use when")) {
    errors.push(`${prefix}: description must say when to use the skill by including "Use when"`);
  }
  if (skill.data.license !== "MIT") {
    errors.push(`${prefix}: license must be MIT`);
  }
  const author = skill.data.metadata?.author;
  const version = skill.data.metadata?.version;
  if (author !== "Naser Sadrmanesh") {
    errors.push(`${prefix}: metadata.author must be "Naser Sadrmanesh"`);
  }
  if (version !== "0.2.0") {
    errors.push(`${prefix}: metadata.version must be "0.2.0"`);
  }
  if (skill.lineCount > SKILL_LINE_LIMIT) {
    errors.push(`${prefix}: SKILL.md has ${skill.lineCount} lines; keep it at or under ${SKILL_LINE_LIMIT}`);
  }
  if (!/^#\s+\S/m.test(skill.body)) {
    errors.push(`${prefix}: body must contain a Markdown heading`);
  }
  if (skill.body.trim().length < 200) {
    errors.push(`${prefix}: body is too short to be a usable skill`);
  }

  return errors;
}

export function linkedSkillPaths(body) {
  const paths = new Set();
  const linkPattern = /\[[^\]]*\]\(([^)\s]+)\)/g;
  const codePattern = /`((?:references|scripts|assets)\/[^`\s]+)`/g;
  for (const pattern of [linkPattern, codePattern]) {
    for (const match of body.matchAll(pattern)) {
      const target = match[1].split("#")[0].split("?")[0];
      if (target === "" || target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:")) {
        continue;
      }
      paths.add(target);
    }
  }
  return [...paths];
}

export function buildCatalogTable(orderedSkills) {
  const lines = ["| Skill | Description |", "| --- | --- |"];
  for (const skill of orderedSkills) {
    const description = skill.data.description.replaceAll("|", "\\|").replaceAll("\n", " ");
    lines.push(`| [\`${skill.name}\`](skills/${skill.name}/SKILL.md) | ${description} |`);
  }
  return lines.join("\n");
}

export function catalogBlock(table) {
  return `<!-- catalog:start -->\n${table}\n<!-- catalog:end -->`;
}

export function replaceCatalog(markdown, table) {
  const pattern = /<!-- catalog:start -->[\s\S]*?<!-- catalog:end -->/;
  if (!pattern.test(markdown)) {
    throw new Error("README.md is missing <!-- catalog:start --> and <!-- catalog:end --> markers");
  }
  return markdown.replace(pattern, catalogBlock(table));
}

export async function listFiles(dir) {
  const found = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return found;
    }
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFiles(full);
      found.push(...nested.map((item) => path.join(entry.name, item)));
    } else {
      found.push(entry.name);
    }
  }
  return found;
}

export function ruleLineCount(text) {
  return text.replace(/\r\n/g, "\n").split("\n").length;
}
