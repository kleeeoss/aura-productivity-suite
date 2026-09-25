import type { NoteExtension } from './types';
import { MindMapCanvas } from './mindmap';

export * from './types';
export * from './mindmap';

export const mindMapExtension: NoteExtension = {
  id: 'mindmap',
  name: 'Mind Map',
  description: 'Interactive visual mind map view over Markdown outline',
  icon: 'Network',
  component: MindMapCanvas,
};

export const noteExtensions: NoteExtension[] = [
  mindMapExtension,
];
