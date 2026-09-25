import type { MindMapNode } from '../types';
import { parseFrontmatter } from '../../storage/frontmatter';

/**
 * Extracts wiki-link target from node text e.g. [[Target Note]] or [[Target Note|Custom Label]]
 */
export function extractWikiLink(text: string): string | undefined {
  const match = text.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  return match ? match[1].trim() : undefined;
}

/**
 * Cleans markdown formatting characters from display text for node labels
 */
export function cleanNodeText(text: string): string {
  return text.trim();
}

/**
 * Converts a Markdown string into a hierarchical MindMapNode tree.
 * Strips frontmatter, supports headings (#, ##, ###), bullet lists (- , * , +),
 * numbered lists (1. ), preserves [[Wiki-links]], and generates stable deterministic IDs.
 */
export function markdownToMindMap(markdown: string, defaultTitle = 'Central Idea'): MindMapNode {
  // Strip frontmatter first so YAML blocks don't pollute the mind map tree
  const { frontmatter, content: rawContent } = parseFrontmatter(markdown || '');
  const effectiveDefaultTitle = (frontmatter.title as string) || defaultTitle;

  const lines = rawContent
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, '  ')) // Normalize tabs to 2 spaces
    .filter((l) => l.trim().length > 0 && !l.trim().startsWith('<!--')); // Ignore comments

  // If empty content, return a single central node
  if (lines.length === 0) {
    return {
      id: 'root',
      text: effectiveDefaultTitle,
      level: 0,
      children: [],
      wikiLink: extractWikiLink(effectiveDefaultTitle),
    };
  }

  // Check if first non-empty line is a single top-level H1 heading
  const firstLine = lines[0].trim();
  const firstH1Match = firstLine.match(/^#\s+(.+)$/);
  let rootText = effectiveDefaultTitle;
  let startIndex = 0;
  let currentHeadingDepth = 0;

  if (firstH1Match) {
    rootText = firstH1Match[1].trim();
    startIndex = 1;
    currentHeadingDepth = 1;
  }

  const rootNode: MindMapNode = {
    id: 'root',
    text: rootText,
    level: 0,
    children: [],
    wikiLink: extractWikiLink(rootText),
  };

  interface StackEntry {
    node: MindMapNode;
    depth: number;
  }

  const stack: StackEntry[] = [{ node: rootNode, depth: 0 }];

  const generateStableId = (parent: MindMapNode) => {
    const childIndex = parent.children.length;
    return parent.id === 'root' ? `node-${childIndex}` : `${parent.id}-${childIndex}`;
  };

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Heading match: #...
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const headingLevel = headingMatch[1].length;
      const text = headingMatch[2].trim();
      currentHeadingDepth = headingLevel;

      // Pop stack until parent depth is strictly less than headingLevel
      while (stack.length > 1 && stack[stack.length - 1].depth >= headingLevel) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].node;
      const newNode: MindMapNode = {
        id: generateStableId(parent),
        text,
        level: headingLevel,
        children: [],
        wikiLink: extractWikiLink(text),
      };

      parent.children.push(newNode);
      stack.push({ node: newNode, depth: headingLevel });
      continue;
    }

    // 2. List item match: - , * , + or 1.
    const listMatch = rawLine.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const indentSpaces = listMatch[1].length;
      const listLevel = Math.floor(indentSpaces / 2);
      const text = listMatch[2].trim();

      // Effective depth of list item is current heading level + 1 + listLevel
      const effectiveDepth = (currentHeadingDepth > 0 ? currentHeadingDepth + 1 : 1) + listLevel;

      while (stack.length > 1 && stack[stack.length - 1].depth >= effectiveDepth) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].node;
      const newNode: MindMapNode = {
        id: generateStableId(parent),
        text,
        level: effectiveDepth,
        children: [],
        wikiLink: extractWikiLink(text),
      };

      parent.children.push(newNode);
      stack.push({ node: newNode, depth: effectiveDepth });
      continue;
    }

    // 3. Regular paragraph/text lines (if not a heading or list)
    if (trimmed.length > 0) {
      const depth = currentHeadingDepth > 0 ? currentHeadingDepth + 1 : 1;

      while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].node;
      const newNode: MindMapNode = {
        id: generateStableId(parent),
        text: trimmed,
        level: depth,
        children: [],
        wikiLink: extractWikiLink(trimmed),
      };

      parent.children.push(newNode);
      stack.push({ node: newNode, depth });
    }
  }

  return rootNode;
}
