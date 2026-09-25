export interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  isCollapsed?: boolean;
  wikiLink?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  side?: 'left' | 'right';
  color?: string;
}

export interface MindMapLayoutMetadata {
  [key: string]: unknown;
  positions?: Record<string, { x: number; y: number }>;
  collapsed?: string[];
  zoom?: number;
  pan?: { x: number; y: number };
}

export interface NoteExtensionProps {
  content: string;
  noteTitle?: string;
  frontmatter?: Record<string, unknown>;
  onContentChange?: (newContent: string) => void;
  onLayoutChange?: (layout: MindMapLayoutMetadata | Record<string, unknown>) => void;
  onNavigateWikiLink?: (noteTitleOrPath: string) => void;
  className?: string;
}

export interface NoteExtension {
  id: string;
  name: string;
  description: string;
  icon: string;
  component?: React.ComponentType<NoteExtensionProps>;
}
