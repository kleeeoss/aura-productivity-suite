/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toggleTaskInMarkdown } from '../utils/markdownUtils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Markdown Layout Containment Protocol & Offline Math Rendering', () => {
  const indexCss = fs.readFileSync(path.resolve(__dirname, '../index.css'), 'utf-8');
  const themesCss = fs.readFileSync(path.resolve(__dirname, '../themes.css'), 'utf-8');

  describe('Defect 2 Resolution: Pathological Layout Containment (kkkkkk... Bug)', () => {
    it('enforces min-width: 0 on all flex ancestors to prevent intrinsic blowout', () => {
      expect(indexCss).toContain('.notes-container');
      expect(indexCss).toContain('.notes-editor-panel');
      expect(indexCss).toContain('.editor-split-container');
      expect(indexCss).toContain('.editor-pane');
      expect(indexCss).toContain('.markdown-preview');
      expect(indexCss).toContain('min-width: 0;');
    });

    it('enforces overflow-wrap: anywhere and word-break: break-word across text elements', () => {
      expect(indexCss).toContain('overflow-wrap: anywhere;');
      expect(indexCss).toContain('word-break: break-word;');
    });

    it('constrains code blocks and tables into self-contained scroll containers', () => {
      expect(indexCss).toContain('.table-container,');
      expect(indexCss).toContain('.markdown-preview pre');
      expect(indexCss).toContain('max-width: 100%;');
      expect(indexCss).toContain('overflow-x: auto;');
    });
  });

  describe('Defect 1 Resolution: KaTeX Offline Mathematical Engine', () => {
    it('imports local katex.css at the top of index.css', () => {
      expect(indexCss).toContain("@import url('./katex.css');");
    });

    it('bundles KaTeX fonts locally in public/fonts/katex/ without CDN dependencies', () => {
      const katexDir = path.resolve(__dirname, '../../public/fonts/katex');
      expect(fs.existsSync(katexDir)).toBe(true);

      const files = fs.readdirSync(katexDir);
      const woff2Files = files.filter((f: string) => f.endsWith('.woff2'));
      expect(woff2Files.length).toBeGreaterThan(10);
    });

    it('references local KaTeX fonts via /fonts/katex/ in katex.css', () => {
      const katexCss = fs.readFileSync(path.resolve(__dirname, '../katex.css'), 'utf-8');
      expect(katexCss).toContain('/fonts/katex/KaTeX_');
      expect(katexCss).not.toContain('https://cdn.jsdelivr.net');
    });
  });

  describe('Obsidian Benchmark: Callouts, Tables & Wiki-Links', () => {
    it('defines callout CSS styling for NOTE, TIP, WARNING, DANGER, and INFO', () => {
      expect(indexCss).toContain('.callout');
      expect(indexCss).toContain('.callout-note');
      expect(indexCss).toContain('.callout-tip');
      expect(indexCss).toContain('.callout-warning');
      expect(indexCss).toContain('.callout-danger');
      expect(indexCss).toContain('.callout-info');
    });

    it('defines internal Wiki-link styling', () => {
      expect(indexCss).toContain('.wiki-link');
      expect(indexCss).toContain('--md-wikilink-color');
    });

    it('defines GFM table container and cell styling', () => {
      expect(indexCss).toContain('.table-container table');
      expect(indexCss).toContain('border-collapse: collapse;');
    });
  });

  describe('Multiverse Visual Engine Markdown Token Matrix', () => {
    const requiredThemes = [
      'translucent-cockpit',
      'cyber-cli',
      'neo-brutalist',
      'editorial-broadsheet',
      'technical-blueprint',
      '8bit-arcade',
      'obsidian-monolith',
      'zen-botanical',
    ];

    it.each(requiredThemes)(
      'defines semantic --md-* tokens for theme world: %s',
      (themeName) => {
        expect(themesCss).toContain(`[data-theme='${themeName}']`);
        // Check that theme block has --md-h1-color and --md-math-color
        const themeIndex = themesCss.indexOf(`[data-theme='${themeName}']`);
        const openBrace = themesCss.indexOf('{', themeIndex);
        const closeBrace = themesCss.indexOf('}', openBrace);
        const themeBlock = themesCss.slice(openBrace, closeBrace);

        expect(themeBlock).toContain('--md-h1-color');
        expect(themeBlock).toContain('--md-math-color');
        expect(themeBlock).toContain('--md-wikilink-color');
      }
    );
  });

  describe('Interactive Task Checkbox Toggling in Reading Mode', () => {
    it('toggles unchecked item [ ] to checked [x] at target index', () => {
      const initial = '- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3';
      const toggled = toggleTaskInMarkdown(initial, 0);
      expect(toggled).toBe('- [x] Task 1\n- [x] Task 2\n- [ ] Task 3');
    });

    it('toggles checked item [x] to unchecked [ ] at target index', () => {
      const initial = '- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3';
      const toggled = toggleTaskInMarkdown(initial, 1);
      expect(toggled).toBe('- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3');
    });

    it('supports numbered and indented task lists cleanly', () => {
      const initial = '1. [ ] Ordered task\n  * [x] Indented bullet task';
      const toggled = toggleTaskInMarkdown(initial, 1);
      expect(toggled).toBe('1. [ ] Ordered task\n  * [ ] Indented bullet task');
    });
  });

  describe('Raw HTML & README Blocks Rendering Protocol', () => {
    it('defines CSS alignment rules for HTML div, p and img blocks', () => {
      expect(indexCss).toContain('.markdown-preview [align="center"]');
      expect(indexCss).toContain('.markdown-preview div[align="center"]');
      expect(indexCss).toContain('.markdown-preview [align="center"] img');
      expect(indexCss).toContain('.markdown-preview details');
      expect(indexCss).toContain('.markdown-preview summary');
    });

    it('renders GitHub README style raw HTML elements into proper DOM nodes instead of raw text', async () => {
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { MarkdownRenderer } = await import('../components/MarkdownRenderer');
      const React = await import('react');

      const markdownWithHtml = [
        '<div align="center">',
        '  <h1>Lucid-CI</h1>',
        '  <p>Automated Continuous Integration Runner</p>',
        '  <a href="https://github.com/example/lucid-ci"><img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status" /></a>',
        '</div>',
        '<details><summary>System Architecture</summary><p>Detailed explanation here.</p></details>',
      ].join('\n');

      const html = renderToStaticMarkup(
        React.createElement(MarkdownRenderer, { content: markdownWithHtml })
      );

      // Verify DOM tags exist and were parsed as HTML, not escaped as &lt;div&gt;
      expect(html).toContain('<div align="center">');
      expect(html).toContain('<h1>Lucid-CI</h1>');
      expect(html).toContain('<p>Automated Continuous Integration Runner</p>');
      expect(html).toContain('href="https://github.com/example/lucid-ci"');
      expect(html).toContain('src="https://img.shields.io/badge/build-passing-brightgreen"');
      expect(html).toContain('alt="Build Status"');
      expect(html).toContain('<details><summary>System Architecture</summary>');
      expect(html).toContain('<p>Detailed explanation here.</p>');
      expect(html).not.toContain('&lt;div');
      expect(html).not.toContain('&lt;h1&gt;');
      expect(html).not.toContain('&lt;details&gt;');
    });
  });
});

