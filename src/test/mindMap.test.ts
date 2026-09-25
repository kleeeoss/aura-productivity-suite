import { describe, it, expect, vi } from 'vitest';
import {
  markdownToMindMap,
  extractWikiLink,
  cleanNodeText,
} from '../extensions/mindmap/markdownToMindMap';
import { mindMapToMarkdown } from '../extensions/mindmap/mindMapToMarkdown';
import { computeMindMapLayout, measureNode } from '../extensions/mindmap/layoutEngine';
import type { MindMapNode } from '../extensions/types';

describe('Mind Map Extension - Hierarchy Parsing, Serialization & Layout', () => {
  describe('Wiki-link Extraction and Text Sanitization', () => {
    it('extracts plain wiki-link target from [[Note Name]]', () => {
      expect(extractWikiLink('Overview of [[Architecture]] system')).toBe('Architecture');
      expect(extractWikiLink('[[Direct Note]]')).toBe('Direct Note');
    });

    it('extracts target from aliased wiki-link [[Note Name|Alias]]', () => {
      expect(extractWikiLink('See [[Project Specs|Specifications]] here')).toBe('Project Specs');
    });

    it('returns undefined when no wiki-link is present', () => {
      expect(extractWikiLink('Standard text node')).toBeUndefined();
    });

    it('cleans node text cleanly', () => {
      expect(cleanNodeText('  Trimmed Text   ')).toBe('Trimmed Text');
    });
  });

  describe('Markdown to Mind Map Hierarchy Parser (markdownToMindMap)', () => {
    it('creates a default central node when markdown is empty', () => {
      const tree = markdownToMindMap('', 'Custom Central');
      expect(tree.id).toBe('root');
      expect(tree.text).toBe('Custom Central');
      expect(tree.level).toBe(0);
      expect(tree.children).toHaveLength(0);
    });

    it('parses single top-level H1 as the root node', () => {
      const md = '# Strategic Roadmap 2026';
      const tree = markdownToMindMap(md);
      expect(tree.text).toBe('Strategic Roadmap 2026');
      expect(tree.children).toHaveLength(0);
    });

    it('parses multi-level heading hierarchy into parent-child tree', () => {
      const md = [
        '# Master Project',
        '## Frontend Architecture',
        '### React Components',
        '### State Management',
        '## Backend Core',
        '### Rust Engine',
      ].join('\n');

      const tree = markdownToMindMap(md);
      expect(tree.text).toBe('Master Project');
      expect(tree.children).toHaveLength(2);

      const frontend = tree.children[0];
      expect(frontend.text).toBe('Frontend Architecture');
      expect(frontend.level).toBe(2);
      expect(frontend.children).toHaveLength(2);
      expect(frontend.children[0].text).toBe('React Components');
      expect(frontend.children[1].text).toBe('State Management');

      const backend = tree.children[1];
      expect(backend.text).toBe('Backend Core');
      expect(backend.children).toHaveLength(1);
      expect(backend.children[0].text).toBe('Rust Engine');
    });

    it('parses bullet lists and indented sub-lists under headings', () => {
      const md = [
        '# Design System',
        '## Glassmorphism',
        '- Refraction Blur',
        '- Specular Borders',
        '  - 1px Solid White',
        '  - Dynamic Hover Rings',
        '## Typography',
        '* Space Grotesk',
      ].join('\n');

      const tree = markdownToMindMap(md);
      expect(tree.children).toHaveLength(2);

      const glass = tree.children[0];
      expect(glass.children).toHaveLength(2);
      expect(glass.children[0].text).toBe('Refraction Blur');

      const borders = glass.children[1];
      expect(borders.text).toBe('Specular Borders');
      expect(borders.children).toHaveLength(2);
      expect(borders.children[0].text).toBe('1px Solid White');
      expect(borders.children[1].text).toBe('Dynamic Hover Rings');

      const typography = tree.children[1];
      expect(typography.children).toHaveLength(1);
      expect(typography.children[0].text).toBe('Space Grotesk');
    });

    it('extracts wiki-links within nodes during parsing', () => {
      const md = [
        '# Research Portal',
        '## Literature',
        '- Reviewing [[Quantum Computing]] foundation',
        '- See [[Deep Learning 2026|DL Paper]] for benchmark',
      ].join('\n');

      const tree = markdownToMindMap(md);
      const literature = tree.children[0];
      expect(literature.children[0].wikiLink).toBe('Quantum Computing');
      expect(literature.children[1].wikiLink).toBe('Deep Learning 2026');
    });

    it('handles mixed document with paragraphs and lists without throwing', () => {
      const md = [
        '# Notebook Notes',
        'This is an introductory paragraph.',
        '- Bullet point 1',
        'A second comment line.',
      ].join('\n');

      const tree = markdownToMindMap(md);
      expect(tree.text).toBe('Notebook Notes');
      expect(tree.children.length).toBeGreaterThan(0);
    });
  });

  describe('Mind Map to Markdown Serializer (mindMapToMarkdown)', () => {
    it('serializes a tree into clean, portable Markdown outline format', () => {
      const rootNode: MindMapNode = {
        id: 'root',
        text: 'Autonomous Agents',
        level: 0,
        children: [
          {
            id: 'c1',
            text: 'Perception',
            level: 1,
            children: [
              { id: 'c1-1', text: 'Sensory Inputs', level: 2, children: [] },
              { id: 'c1-2', text: 'Telemetry', level: 2, children: [] },
            ],
          },
          {
            id: 'c2',
            text: 'Execution',
            level: 1,
            children: [
              { id: 'c2-1', text: 'Tool Invocation', level: 2, children: [] },
            ],
          },
        ],
      };

      const markdown = mindMapToMarkdown(rootNode);
      expect(markdown).toContain('# Autonomous Agents');
      expect(markdown).toContain('## Perception');
      expect(markdown).toContain('- Sensory Inputs');
      expect(markdown).toContain('- Telemetry');
      expect(markdown).toContain('## Execution');
      expect(markdown).toContain('- Tool Invocation');
    });

    it('maintains round-trip parsing and serialization fidelity', () => {
      const original = [
        '# Core System',
        '',
        '## Module A',
        '- Unit 1',
        '- Unit 2',
        '',
        '## Module B',
        '- Unit 3',
        '',
      ].join('\n');

      const parsed = markdownToMindMap(original);
      const serialized = mindMapToMarkdown(parsed);
      const reParsed = markdownToMindMap(serialized);

      expect(reParsed.text).toBe('Core System');
      expect(reParsed.children).toHaveLength(2);
      expect(reParsed.children[0].text).toBe('Module A');
      expect(reParsed.children[0].children).toHaveLength(2);
      expect(reParsed.children[1].text).toBe('Module B');
      expect(reParsed.children[1].children).toHaveLength(1);
    });
  });

  describe('Mind Map Layout Engine (computeMindMapLayout)', () => {
    const sampleTree: MindMapNode = {
      id: 'root',
      text: 'Central Intelligence',
      level: 0,
      children: [
        {
          id: 'branch-1',
          text: 'Vision System',
          level: 1,
          children: [
            { id: 'leaf-1', text: 'Object Detection', level: 2, children: [] },
            { id: 'leaf-2', text: 'Depth Estimation', level: 2, children: [] },
          ],
        },
        {
          id: 'branch-2',
          text: 'Speech System',
          level: 1,
          children: [
            { id: 'leaf-3', text: 'Whisper Offline', level: 2, children: [] },
          ],
        },
      ],
    };

    it('measures node dimensions proportionally to text and hierarchy level', () => {
      const rootSize = measureNode(sampleTree);
      const leafSize = measureNode(sampleTree.children[0].children[0]);
      expect(rootSize.height).toBeGreaterThan(leafSize.height);
      expect(rootSize.width).toBeGreaterThan(100);
      expect(leafSize.width).toBeGreaterThan(50);
    });

    it('computes positions, connectors, and bounds for two-sided horizontal mind map', () => {
      const layout = computeMindMapLayout(sampleTree);

      expect(layout.root.x).toBe(0);
      expect(layout.root.y).toBe(0);
      expect(layout.nodes.length).toBe(6); // root + 2 branches + 3 leaves
      expect(layout.connectors.length).toBe(5); // 5 connections

      // Check connectors format (cubic bezier path: M x1 y1 C cp1x cp1y, cp2x cp2y, x2 y2)
      for (const conn of layout.connectors) {
        expect(conn.path).toMatch(/^M\s+-?\d+(\.\d+)?\s+-?\d+(\.\d+)?\s+C/);
      }

      // Check bounding box
      expect(layout.bounds.width).toBeGreaterThan(300);
      expect(layout.bounds.height).toBeGreaterThan(100);
      expect(layout.bounds.minX).toBeLessThan(0);
      expect(layout.bounds.maxX).toBeGreaterThan(0);
    });

    it('excludes descendants of collapsed branches from layout and connectors', () => {
      const collapsedTree: MindMapNode = {
        ...sampleTree,
        children: [
          {
            ...sampleTree.children[0],
            isCollapsed: true, // Collapsed
          },
          sampleTree.children[1],
        ],
      };

      const layout = computeMindMapLayout(collapsedTree);
      // Leaves of branch-1 should not be in computed nodes
      const nodeIds = layout.nodes.map((n) => n.id);
      expect(nodeIds).toContain('root');
      expect(nodeIds).toContain('branch-1');
      expect(nodeIds).not.toContain('leaf-1');
      expect(nodeIds).not.toContain('leaf-2');
      expect(nodeIds).toContain('branch-2');
      expect(nodeIds).toContain('leaf-3');
    });

    it('honors manual node position overrides from frontmatter metadata', () => {
      const manualPositions = {
        'branch-1': { x: 350, y: 120 },
      };

      const layout = computeMindMapLayout(sampleTree, { manualPositions });
      const branch1 = layout.nodes.find((n) => n.id === 'branch-1');
      expect(branch1?.x).toBe(350);
      expect(branch1?.y).toBe(120);
    });

    it('handles large maps with 150+ nodes with high layout performance', () => {
      const largeTree: MindMapNode = {
        id: 'large-root',
        text: 'Large Scale Project',
        level: 0,
        children: [],
      };

      for (let b = 1; b <= 10; b++) {
        const branch: MindMapNode = {
          id: `b-${b}`,
          text: `Branch ${b}`,
          level: 1,
          children: [],
        };
        for (let l = 1; l <= 14; l++) {
          branch.children.push({
            id: `b-${b}-l-${l}`,
            text: `Leaf ${b}.${l}`,
            level: 2,
            children: [],
          });
        }
        largeTree.children.push(branch);
      }

      const start = performance.now();
      const layout = computeMindMapLayout(largeTree);
      const elapsed = performance.now() - start;

      expect(layout.nodes.length).toBe(151); // 1 root + 10 branches + 140 leaves
      expect(layout.connectors.length).toBe(150);
      expect(elapsed).toBeLessThan(100); // Must be <100ms
    });
  });

  describe('Wiki-link Navigation Interaction Protocol', () => {
    it('dispatches onNavigateWikiLink callback when wiki-link pill is clicked', async () => {
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { MindMapCanvas } = await import('../extensions/mindmap/MindMapCanvas');
      const React = await import('react');

      const markdown = '# Main Note\n## Related Note\n- See [[System Architecture]] here';
      const navigateMock = vi.fn();

      const html = renderToStaticMarkup(
        React.createElement(MindMapCanvas, {
          content: markdown,
          noteTitle: 'Main Note',
          onNavigateWikiLink: navigateMock,
        })
      );

      // Verify wiki-link pill indicator exists in rendered SVG markup
      expect(html).toContain('Open linked note: System Architecture');
      expect(html).toContain('🔗');
    });
  });

  describe('Frontmatter Layout Persistence Protocol', () => {
    it('serializes and parses mindmapLayout metadata in YAML frontmatter', async () => {
      const { parseFrontmatter, serializeFrontmatter } = await import('../storage/frontmatter');

      const frontmatter = {
        id: 'note-123',
        title: 'Mindmap Note',
        tags: ['strategy', 'planning'],
        mindmapLayout: {
          positions: {
            root: { x: 0, y: 0 },
            'node-1': { x: 220, y: -80 },
          },
          collapsed: ['node-2'],
        },
      };

      const markdown = '# Central Idea\n\n## Subtopic\n- Point 1\n';
      const serialized = serializeFrontmatter(frontmatter, markdown);

      expect(serialized).toContain('mindmapLayout:');
      expect(serialized).toContain('# Central Idea');

      const reparsed = parseFrontmatter(serialized);
      expect(reparsed.frontmatter.title).toBe('Mindmap Note');
      expect(reparsed.frontmatter.mindmapLayout).toBeDefined();

      const layout = reparsed.frontmatter.mindmapLayout as any;
      expect(layout.positions).toBeDefined();
      expect(layout.positions.root).toEqual({ x: 0, y: 0 });
      expect(layout.positions['node-1']).toEqual({ x: 220, y: -80 });
      expect(layout.collapsed).toContain('node-2');
    });

    it('strips YAML frontmatter in markdownToMindMap so keys do not become nodes', () => {
      const rawWithFrontmatter = [
        '---',
        'id: note-abc',
        'title: Project Architecture',
        'tags: [system, rust]',
        'mindmapLayout: {"positions":{}}',
        '---',
        '# Core Project',
        '## Engine',
        '- Pipeline',
      ].join('\n');

      const tree = markdownToMindMap(rawWithFrontmatter);
      expect(tree.text).toBe('Core Project');
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].text).toBe('Engine');
      expect(tree.children[0].children).toHaveLength(1);
      expect(tree.children[0].children[0].text).toBe('Pipeline');

      // Ensure no frontmatter metadata leaked as nodes
      const allTexts: string[] = [];
      function collectTexts(n: MindMapNode) {
        allTexts.push(n.text);
        n.children.forEach(collectTexts);
      }
      collectTexts(tree);
      expect(allTexts).not.toContain('---');
      expect(allTexts).not.toContain('id: note-abc');
      expect(allTexts).not.toContain('tags: [system, rust]');
    });

    it('maintains deterministic node IDs across multiple parses for layout persistence', () => {
      const md = [
        '# Project Alpha',
        '## Module 1',
        '- Task A',
        '- Task B',
        '## Module 2',
        '- Task C',
      ].join('\n');

      const tree1 = markdownToMindMap(md);
      const tree2 = markdownToMindMap(md);

      expect(tree1.id).toBe(tree2.id);
      expect(tree1.children[0].id).toBe(tree2.children[0].id);
      expect(tree1.children[0].children[0].id).toBe(tree2.children[0].children[0].id);
      expect(tree1.children[0].children[1].id).toBe(tree2.children[0].children[1].id);
      expect(tree1.children[1].id).toBe(tree2.children[1].id);
      expect(tree1.children[1].children[0].id).toBe(tree2.children[1].children[0].id);

      // Verify layout positions match the deterministic IDs
      const manualPositions = {
        [tree1.children[0].id]: { x: 300, y: 150 },
      };
      const layout = computeMindMapLayout(tree2, { manualPositions });
      const targetNode = layout.nodes.find((n) => n.id === tree1.children[0].id);
      expect(targetNode?.x).toBe(300);
      expect(targetNode?.y).toBe(150);
    });

    it('preserves sibling relationships without demotion during round-trip serialization', () => {
      const initialTree: MindMapNode = {
        id: 'root',
        text: 'Root Topic',
        level: 0,
        children: [
          {
            id: 'node-0',
            text: 'Branch 1',
            level: 1,
            children: [
              {
                id: 'node-0-0',
                text: 'Subtopic A',
                level: 2,
                children: [
                  { id: 'node-0-0-0', text: 'Leaf 1', level: 3, children: [] },
                ],
              },
              {
                id: 'node-0-1',
                text: 'Subtopic B',
                level: 2,
                children: [],
              },
            ],
          },
        ],
      };

      const serialized = mindMapToMarkdown(initialTree);
      const reparsed = markdownToMindMap(serialized);

      const branch = reparsed.children[0];
      expect(branch.text).toBe('Branch 1');
      // Subtopic A and Subtopic B MUST be siblings under Branch 1
      expect(branch.children).toHaveLength(2);
      expect(branch.children[0].text).toBe('Subtopic A');
      expect(branch.children[1].text).toBe('Subtopic B');
      expect(branch.children[0].children).toHaveLength(1);
      expect(branch.children[0].children[0].text).toBe('Leaf 1');
    });
  });

  describe('Extension Architecture Protocol', () => {
    it('exports noteExtensions registry and mindMapExtension definition', async () => {
      const { noteExtensions, mindMapExtension } = await import('../extensions');
      expect(Array.isArray(noteExtensions)).toBe(true);
      expect(noteExtensions).toContain(mindMapExtension);
      expect(mindMapExtension.id).toBe('mindmap');
      expect(mindMapExtension.name).toBe('Mind Map');
      expect(mindMapExtension.component).toBeDefined();
    });
  });

  describe('MindMapCanvas React Component Static Rendering', () => {
    it('renders toolbar controls, SVG canvas, and nodes without errors', async () => {
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { MindMapCanvas } = await import('../extensions/mindmap/MindMapCanvas');
      const React = await import('react');

      const sampleMarkdown = '# Brainstorming 2026\n\n## Vision\n- Offline First\n- Local Only\n';
      const html = renderToStaticMarkup(
        React.createElement(MindMapCanvas, {
          content: sampleMarkdown,
          noteTitle: 'Brainstorming 2026',
        })
      );

      // Verify toolbar buttons
      expect(html).toContain('Child');
      expect(html).toContain('Sibling');
      expect(html).toContain('SVG');
      expect(html).toContain('PNG');
      expect(html).toContain('Search nodes...');

      // Verify SVG canvas
      expect(html).toContain('<svg');
      expect(html).toContain('mindmap-connectors');
      expect(html).toContain('mindmap-nodes');

      // Verify node text
      expect(html).toContain('Brainstorming 2026');
      expect(html).toContain('Vision');
      expect(html).toContain('Offline First');
    });
  });
});
