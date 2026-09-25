export interface ParsedNoteFile {
  frontmatter: Record<string, unknown>;
  content: string;
}

export function parseFrontmatter(rawText: string): ParsedNoteFile {
  const cleanText = rawText.replace(/^\uFEFF/, '');
  const normalized = cleanText.replace(/\r\n/g, '\n');
  const frontmatterRegex = /^---\n([\s\S]*?)\n---(?:\n|$)/;
  const match = normalized.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: cleanText };
  }

  const yamlBlock = match[1];
  const content = normalized.slice(match[0].length);
  const frontmatter: Record<string, unknown> = {};

  const lines = yamlBlock.split('\n');
  let currentKey: string | null = null;
  let currentArray: unknown[] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    // List item for previous key
    if (line.startsWith('- ') && currentKey) {
      if (!currentArray) {
        currentArray = [];
      }
      const itemVal = parseScalar(line.slice(2).trim());
      currentArray.push(itemVal);
      frontmatter[currentKey] = currentArray;
      continue;
    }

    // If we were collecting an array and now hit a new key
    currentArray = null;

    const colonIdx = rawLine.indexOf(':');
    if (colonIdx !== -1) {
      const key = rawLine.slice(0, colonIdx).trim();
      const valStr = rawLine.slice(colonIdx + 1).trim();

      if (!valStr) {
        currentKey = key;
        currentArray = [];
        frontmatter[key] = currentArray;
      } else if (valStr.startsWith('[') && valStr.endsWith(']')) {
        // Inline array: [a, b, c]
        const inner = valStr.slice(1, -1).trim();
        if (!inner) {
          frontmatter[key] = [];
        } else {
          frontmatter[key] = inner
            .split(',')
            .map((s) => parseScalar(s.trim()));
        }
        currentKey = null;
      } else {
        frontmatter[key] = parseScalar(valStr);
        currentKey = null;
      }
    }
  }

  return { frontmatter, content };
}

function parseScalar(val: string): unknown {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;

  // Inline JSON object or array
  if (
    (val.startsWith('{') && val.endsWith('}')) ||
    (val.startsWith('[') && val.endsWith(']'))
  ) {
    try {
      return JSON.parse(val);
    } catch {
      // Continue to other parsers
    }
  }

  // Quoted string
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    return val.slice(1, -1);
  }

  // Numeric check (don't parse UUIDs or dates as numbers)
  if (/^-?\d+(\.\d+)?$/.test(val)) {
    const num = Number(val);
    if (!isNaN(num)) return num;
  }

  return val;
}

export function serializeFrontmatter(
  frontmatter: Record<string, unknown>,
  content: string
): string {
  const keys = Object.keys(frontmatter);
  if (keys.length === 0) {
    return content;
  }

  const lines: string[] = ['---'];

  for (const key of keys) {
    const val = frontmatter[key];
    if (val === undefined) continue;

    if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of val) {
          lines.push(`  - ${formatScalar(item)}`);
        }
      }
    } else {
      lines.push(`${key}: ${formatScalar(val)}`);
    }
  }

  lines.push('---');
  lines.push('');

  const body = content.startsWith('\n') ? content.slice(1) : content;
  return `${lines.join('\n')}${body}`;
}

function formatScalar(val: unknown): string {
  if (typeof val === 'string') {
    // If string has special YAML characters or whitespace, wrap in quotes
    if (
      val.includes(':') ||
      val.includes('#') ||
      val.includes('\n') ||
      val.startsWith('-') ||
      val.startsWith('[') ||
      val.startsWith('{') ||
      val.trim() !== val
    ) {
      return JSON.stringify(val);
    }
    return val;
  }
  if (typeof val === 'boolean' || typeof val === 'number') {
    return String(val);
  }
  if (val === null) {
    return 'null';
  }
  return JSON.stringify(val);
}
