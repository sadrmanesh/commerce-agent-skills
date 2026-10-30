/**
 * Parse the YAML subset used by SKILL.md frontmatter in this repository.
 * Supports top-level scalars, one-level nested maps, and folded/literal blocks.
 */

const TOP_LEVEL_KEYS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
]);

export function splitFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("SKILL.md must start with a --- frontmatter delimiter");
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error("SKILL.md is missing the closing --- frontmatter delimiter");
  }
  return {
    yaml: normalized.slice(4, end),
    body: normalized.slice(end + "\n---\n".length),
    normalized,
  };
}

export function parseFrontmatter(yaml) {
  const lines = yaml.split("\n");
  const root = {};
  const seen = new Set();
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "" || /^\s*#/.test(line)) {
      index += 1;
      continue;
    }
    if (/^\s/.test(line)) {
      throw new Error(`Unexpected indented line outside a block: ${line}`);
    }
    const match = line.match(/^([A-Za-z0-9][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }
    const key = match[1];
    const raw = match[2];
    if (seen.has(key)) {
      throw new Error(`Duplicate frontmatter field: ${key}`);
    }
    seen.add(key);

    if (raw === "" || raw === "|" || raw === ">" || raw === "|-" || raw === ">-") {
      const block = [];
      index += 1;
      while (index < lines.length && (lines[index].startsWith("  ") || lines[index].trim() === "")) {
        block.push(lines[index]);
        index += 1;
      }
      root[key] = raw === "" ? parseNestedMap(block, key) : parseBlockScalar(raw, block);
      continue;
    }

    root[key] = parseScalar(raw, key);
    index += 1;
  }

  return root;
}

function parseNestedMap(blockLines, parentKey) {
  const value = {};
  const seen = new Set();
  for (const line of blockLines) {
    if (line.trim() === "" || /^\s*#/.test(line)) {
      continue;
    }
    const match = line.match(/^  ([A-Za-z0-9][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) {
      throw new Error(`Invalid ${parentKey} entry: ${line}`);
    }
    if (match[2] === "") {
      throw new Error(`Nested blocks under ${parentKey}.${match[1]} are not supported`);
    }
    if (seen.has(match[1])) {
      throw new Error(`Duplicate ${parentKey} field: ${match[1]}`);
    }
    seen.add(match[1]);
    value[match[1]] = parseScalar(match[2], `${parentKey}.${match[1]}`);
  }
  return value;
}

function parseBlockScalar(style, blockLines) {
  const content = blockLines.map((line) => (line.startsWith("  ") ? line.slice(2) : line.trim() === "" ? "" : line));
  while (content.length > 0 && content[content.length - 1] === "") {
    content.pop();
  }
  const text = content.join("\n");
  if (style.startsWith(">")) {
    return text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
      .join("\n\n")
      .trim();
  }
  return text;
}

function parseScalar(raw, keyPath) {
  const value = raw.trim();
  if (value.startsWith('"')) {
    if (!value.endsWith('"') || value.length < 2) {
      throw new Error(`Unclosed double quote in ${keyPath}`);
    }
    return decodeDoubleQuoted(value.slice(1, -1), keyPath);
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2) {
      throw new Error(`Unclosed single quote in ${keyPath}`);
    }
    return value.slice(1, -1).replaceAll("''", "'");
  }
  if (value === "" || value === "~" || value === "null" || value === "Null" || value === "NULL") {
    throw new Error(`${keyPath} must be a non-empty string`);
  }
  if (/^(true|false|True|False|TRUE|FALSE)$/.test(value) || /^-?\d/.test(value)) {
    throw new Error(
      `${keyPath} must be a quoted string so YAML parsers keep it a string (got ${value})`,
    );
  }
  if (value.includes(": ") || value.startsWith("{") || value.startsWith("[") || value.includes(" #")) {
    throw new Error(`${keyPath} contains YAML syntax; wrap it in double quotes`);
  }
  return value;
}

function decodeDoubleQuoted(text, keyPath) {
  let out = "";
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "\\") {
      out += text[i];
      continue;
    }
    const next = text[i + 1];
    if (next === undefined) {
      throw new Error(`Trailing escape in ${keyPath}`);
    }
    const map = { n: "\n", t: "\t", '"': '"', "\\": "\\" };
    if (!(next in map)) {
      throw new Error(`Unsupported escape \\${next} in ${keyPath}`);
    }
    out += map[next];
    i += 1;
  }
  return out;
}

export function assertSpecFrontmatter(data) {
  const errors = [];
  for (const key of Object.keys(data)) {
    if (!TOP_LEVEL_KEYS.has(key)) {
      errors.push(`Unknown frontmatter field "${key}". Use name, description, license, compatibility, metadata, or allowed-tools.`);
    }
  }

  const name = data.name;
  if (typeof name !== "string") {
    errors.push("name is required");
  } else if (name.length < 1 || name.length > 64) {
    errors.push(`name must be 1-64 characters (got ${name.length})`);
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    errors.push(
      "name must be lowercase letters, numbers, and single hyphens, and must not start or end with a hyphen",
    );
  }

  const description = data.description;
  if (typeof description !== "string" || description.trim() === "") {
    errors.push("description is required");
  } else if (description.length > 1024) {
    errors.push(`description must be at most 1024 characters (got ${description.length})`);
  }

  if (data.license !== undefined && (typeof data.license !== "string" || data.license.trim() === "")) {
    errors.push("license must be a non-empty string when set");
  }

  if (data.compatibility !== undefined) {
    if (typeof data.compatibility !== "string" || data.compatibility.trim() === "") {
      errors.push("compatibility must be a non-empty string when set");
    } else if (data.compatibility.length > 500) {
      errors.push(`compatibility must be at most 500 characters (got ${data.compatibility.length})`);
    }
  }

  if (data.metadata !== undefined) {
    if (data.metadata === null || typeof data.metadata !== "object" || Array.isArray(data.metadata)) {
      errors.push("metadata must be a map of strings");
    } else {
      for (const [key, value] of Object.entries(data.metadata)) {
        if (typeof value !== "string" || value.trim() === "") {
          errors.push(`metadata.${key} must be a non-empty string`);
        }
      }
    }
  }

  if (data["allowed-tools"] !== undefined && typeof data["allowed-tools"] !== "string") {
    errors.push("allowed-tools must be a space-separated string when set");
  }

  return errors;
}
