/**
 * Markdown utilities for AURA 1.2 Notes
 */

/**
 * Toggles a task list checkbox in markdown content at the given 0-indexed task occurrence.
 * Supports bulleted lists (- [ ], * [ ], + [ ]) and numbered lists (1. [ ]).
 */
export function toggleTaskInMarkdown(markdown: string, taskIndex: number): string {
  let currentIndex = 0;
  return markdown.replace(
    /^([ \t]*[-*+]|\d+[.)])[ \t]+\[([ xX])\]/gm,
    (match, prefix, checkState) => {
      if (currentIndex === taskIndex) {
        currentIndex++;
        const nextState = checkState === ' ' ? 'x' : ' ';
        return `${prefix} [${nextState}]`;
      }
      currentIndex++;
      return match;
    }
  );
}
