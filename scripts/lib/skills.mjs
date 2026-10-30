import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assertSpecFrontmatter, parseFrontmatter, splitFrontmatter } from "./frontmatter.mjs";

export const SKILL_LINE_LIMIT = 500;
export const RULE_LINE_MIN = 8;
export const RULE_LINE_MAX = 80;
export const DESCRIPTION_MIN = 100;
export const DESCRIPTION_MAX = 320;
export const REQUIRED_SECTIONS = ["Gotchas", "Verification", "Evaluation"];
export const EM_DASH = "\u2014";
export const ZWNJ = "\u200c";

export async function readPackageVersion(root) {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  if (typeof pkg.version !== "string") {
    throw new Error("package.json has no version");
  }
  return pkg.version;
}

export function firstHeading(markdown) {
  const match = /^#\s+(.+?)\s*$/m.exec(markdown);
  return match ? match[1] : null;
}

export function sectionTitles(markdown) {
  return [...markdown.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => match[1]);
}

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

export function validateSkillRecord(skill, expectedVersion) {
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
  if (typeof skill.data.description === "string") {
    if (!skill.data.description.includes("Use when")) {
      errors.push(`${prefix}: description must say when to use the skill by including "Use when"`);
    }
    const length = skill.data.description.length;
    if (length < DESCRIPTION_MIN || length > DESCRIPTION_MAX) {
      errors.push(`${prefix}: description has ${length} characters; keep it between ${DESCRIPTION_MIN} and ${DESCRIPTION_MAX}`);
    }
  }
  if (skill.data.license !== "MIT") {
    errors.push(`${prefix}: license must be MIT`);
  }
  const author = skill.data.metadata?.author;
  const version = skill.data.metadata?.version;
  if (author !== "Naser Sadrmanesh") {
    errors.push(`${prefix}: metadata.author must be "Naser Sadrmanesh"`);
  }
  if (expectedVersion !== undefined && version !== expectedVersion) {
    errors.push(`${prefix}: metadata.version must be "${expectedVersion}" to match package.json`);
  } else if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
    errors.push(`${prefix}: metadata.version must be a quoted x.y.z string`);
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
  const sections = sectionTitles(skill.body);
  for (const required of REQUIRED_SECTIONS) {
    if (!sections.includes(required)) {
      errors.push(`${prefix}: SKILL.md needs a "## ${required}" section`);
    }
  }
  if (skill.text.includes(EM_DASH)) {
    errors.push(`${prefix}: SKILL.md uses an em dash; use a comma, colon, or period`);
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
