import type { MindMapNode } from '../types';

/**
 * Converts a MindMapNode tree back into clean, portable Markdown outline format.
 * Heading levels and bullet lists are formatted for maximum readability in both
 * AURA Reading Mode and standard Markdown editors (Obsidian, VS Code, GitHub).
 */
export function mindMapToMarkdown(rootNode: MindMapNode): string {
  const lines: string[] = [];

  // Root node is represented as an H1 heading
  lines.push(`# ${rootNode.text.trim()}`);
  lines.push('');

  function serializeNode(node: MindMapNode, depth: number) {
    if (depth === 1) {
      lines.push(`## ${node.text.trim()}`);
      for (const child of node.children) {
        serializeNode(child, depth + 1);
      }
      lines.push('');
    } else {
      // Depth 2+ nested items formatted as consistent bullet lists so siblings always remain siblings
      const indent = '  '.repeat(Math.max(0, depth - 2));
      lines.push(`${indent}- ${node.text.trim()}`);
      for (const child of node.children) {
        serializeNode(child, depth + 1);
      }
    }
  }

  for (const branch of rootNode.children) {
    serializeNode(branch, 1);
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
