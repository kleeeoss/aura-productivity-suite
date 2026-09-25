import { create } from 'zustand';
import type { IVaultDriver, VaultFileInfo, VaultWatchEvent } from '../storage/IVaultDriver';
import { TauriVaultDriver } from '../storage/TauriVaultDriver';
import { parseFrontmatter, serializeFrontmatter } from '../storage/frontmatter';
import { migrateLegacyNotes, sanitizeFilename, resolveUniquePath } from '../utils/notesMigration';
import { useActivityStore } from './useActivityStore';

export interface NoteFolder {
  id: string; // Relative folder path e.g. "College/ML"
  name: string; // e.g. "ML"
  color?: string;
  path: string;
}

export interface Note {
  id: string; // Relative path or ID
  path: string; // e.g. "College/ML/CNN.md"
  title: string;
  content: string; // Markdown content
  tags: string[];
  folderId: string | null;
  updatedAt: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  frontmatter?: Record<string, unknown>;
}

export type EditorMode = 'reading' | 'source' | 'split' | 'mindmap';

interface NoteState {
  vaultRoot: string;
  driver: IVaultDriver;
  notes: Note[];
  folders: NoteFolder[];
  activeNoteId: string | null;
  activeNoteContent: string;
  activeNoteTitle: string;
  editorMode: EditorMode;
  isDirty: boolean;
  backlinks: string[];
  isExternalConflict: boolean;
  isLoading: boolean;
  unwatch: (() => void) | null;

  // Actions
  setDriver: (driver: IVaultDriver) => void;
  initVault: (customRoot?: string) => Promise<void>;
  scanVaultFiles: () => Promise<void>;
  setVaultRoot: (path: string) => Promise<void>;
  setEditorMode: (mode: EditorMode) => void;
  cycleEditorMode: () => void;
  setActiveNote: (idOrPath: string | null) => Promise<void>;
  setLocalContent: (content: string) => void;
  setLocalTitle: (title: string) => void;
  saveActiveNote: () => Promise<void>;
  updateActiveNoteLayout: (layout: Record<string, unknown>) => Promise<void>;
  addNote: (title?: string, folderId?: string | null, initialContent?: string) => Promise<string>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addFolder: (name: string, parentPath?: string) => Promise<void>;
  deleteFolder: (idOrPath: string) => Promise<void>;
  importFile: (filename: string, content: string, targetFolder?: string) => Promise<string>;
  resolveConflict: (resolution: 'keep-local' | 'load-external' | 'save-copy') => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  vaultRoot: 'AURA Notes',
  driver: new TauriVaultDriver(),
  notes: [],
  folders: [],
  activeNoteId: null,
  activeNoteContent: '',
  activeNoteTitle: '',
  editorMode: 'split',
  isDirty: false,
  backlinks: [],
  isExternalConflict: false,
  isLoading: false,
  unwatch: null,

  setDriver: (driver: IVaultDriver) => {
    const { unwatch } = get();
    if (unwatch) unwatch();
    set({ driver, unwatch: null });
  },

  initVault: async (customRoot?: string) => {
    const { unwatch: existingUnwatch } = get();
    if (existingUnwatch) {
      existingUnwatch();
    }
    const root = customRoot || get().vaultRoot || 'AURA Notes';
    set({ isLoading: true, vaultRoot: root, unwatch: null });

    const driver = get().driver;
    await driver.init(root);

    // Run legacy notes migration once if legacy note-storage exists
    try {
      await migrateLegacyNotes(driver);
    } catch (err) {
      console.warn('Note migration notice:', err);
    }

    // Set up recursive file watch listener
    const unwatch = driver.onWatchEvent((event: VaultWatchEvent) => {
      const state = get();
      const currentActive = state.notes.find((n) => n.id === state.activeNoteId);

      // Rescan vault to reflect any external file/folder additions or deletions
      state.scanVaultFiles().then(() => {
        if (currentActive && (event.path === currentActive.path || event.path === currentActive.id)) {
          if (!state.isDirty) {
            // Safe clean hot-reload
            state.driver.readFile(currentActive.path).then((raw) => {
              const { frontmatter, content } = parseFrontmatter(raw);
              set({
                activeNoteContent: content,
                activeNoteTitle: (frontmatter.title as string) || currentActive.title,
                isExternalConflict: false,
              });
            });
          } else {
            // Unsaved changes collide with external edit: show conflict banner
            set({ isExternalConflict: true });
          }
        }
      });
    });

    set({ unwatch });
    await (get() as any).scanVaultFiles();

    // Select first note if available and none selected
    const { notes, activeNoteId } = get();
    if (!activeNoteId && notes.length > 0) {
      await get().setActiveNote(notes[0].id);
    }

    set({ isLoading: false });
  },

  setVaultRoot: async (path: string) => {
    await get().initVault(path);
  },

  scanVaultFiles: async () => {
    const driver = get().driver;
    const fileInfos: VaultFileInfo[] = await driver.scanVault();

    const folders: NoteFolder[] = [];
    const notes: Note[] = [];

    for (const info of fileInfos) {
      if (info.isDirectory) {
        folders.push({
          id: info.path,
          name: info.name,
          path: info.path,
          color: '#6366f1',
        });
      } else if (info.name.endsWith('.md')) {
        let content = '';
        let frontmatter = info.frontmatter || {};
        try {
          const raw = await driver.readFile(info.path);
          const parsed = parseFrontmatter(raw);
          content = parsed.content;
          frontmatter = { ...parsed.frontmatter, ...frontmatter };
        } catch {
          // Fallback if read fails
        }

        const parts = info.path.split('/');
        const folderId = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
        const title = (frontmatter.title as string) || info.name.replace(/\.md$/, '');
        const id = (frontmatter.id as string) || info.path;
        const tags = Array.isArray(frontmatter.tags) ? (frontmatter.tags as string[]) : [];

        notes.push({
          id,
          path: info.path,
          title,
          content,
          tags,
          folderId,
          updatedAt: info.updatedAt,
          isPinned: !!frontmatter.pinned,
          isFavorite: !!frontmatter.favorite,
          frontmatter,
        });
      }
    }

    // Sort notes: pinned first, then favorites, then updated
    notes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    set({ folders, notes });
  },

  setEditorMode: (editorMode: EditorMode) => set({ editorMode }),

  cycleEditorMode: () => {
    const modes: EditorMode[] = ['reading', 'source', 'split'];
    const current = get().editorMode;
    const nextIdx = (modes.indexOf(current) + 1) % modes.length;
    set({ editorMode: modes[nextIdx] });
  },

  setActiveNote: async (idOrPath: string | null) => {
    const { isDirty, activeNoteId } = get();
    if (isDirty && activeNoteId && activeNoteId !== idOrPath) {
      await get().saveActiveNote();
    }

    if (!idOrPath) {
      set({
        activeNoteId: null,
        activeNoteContent: '',
        activeNoteTitle: '',
        isDirty: false,
        backlinks: [],
        isExternalConflict: false,
      });
      return;
    }

    const { notes, driver } = get();
    const note = notes.find((n) => n.id === idOrPath || n.path === idOrPath);

    if (note) {
      try {
        const raw = await driver.readFile(note.path);
        const { frontmatter, content } = parseFrontmatter(raw);
        const backlinks = await driver.getBacklinks(note.title);

        set({
          activeNoteId: note.id,
          activeNoteContent: content,
          activeNoteTitle: (frontmatter.title as string) || note.title,
          isDirty: false,
          backlinks,
          isExternalConflict: false,
        });
      } catch {
        set({
          activeNoteId: note.id,
          activeNoteContent: note.content,
          activeNoteTitle: note.title,
          isDirty: false,
          backlinks: [],
          isExternalConflict: false,
        });
      }
    }
  },

  setLocalContent: (content: string) => {
    set({ activeNoteContent: content, isDirty: true });
  },

  setLocalTitle: (title: string) => {
    set({ activeNoteTitle: title, isDirty: true });
  },

  saveActiveNote: async () => {
    const { activeNoteId, activeNoteContent, activeNoteTitle, notes, driver } = get();
    if (!activeNoteId) return;

    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    const now = new Date().toISOString();
    const frontmatter = {
      ...(note.frontmatter || {}),
      id: note.id,
      title: activeNoteTitle,
      tags: note.tags,
      updated: now,
      pinned: !!note.isPinned,
      favorite: !!note.isFavorite,
    };

    const fullMarkdown = serializeFrontmatter(frontmatter, activeNoteContent);
    await driver.writeFile(note.path, fullMarkdown);

    // If title changed, rename file to match title
    const cleanTitle = sanitizeFilename(activeNoteTitle);
    const expectedName = `${cleanTitle}.md`;
    const parts = note.path.split('/');
    const currentName = parts[parts.length - 1];

    if (expectedName !== currentName) {
      const folderPrefix = parts.length > 1 ? `${parts.slice(0, -1).join('/')}/` : '';
      const newPath = `${folderPrefix}${expectedName}`;
      try {
        await driver.renameFile(note.path, newPath);
      } catch (err) {
        console.warn('Rename file collision notice:', err);
      }
    }

    set({ isDirty: false, isExternalConflict: false });
    await (get() as any).scanVaultFiles();
    set({ activeNoteId: note.id });
  },

  updateActiveNoteLayout: async (layout: Record<string, unknown>) => {
    const { activeNoteId, notes, driver, activeNoteContent, activeNoteTitle } = get();
    if (!activeNoteId) return;

    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    const updatedFrontmatter = {
      ...(note.frontmatter || {}),
      mindmapLayout: layout,
    };
    note.frontmatter = updatedFrontmatter;

    const updatedNotes = notes.map((n) =>
      n.id === activeNoteId ? { ...n, frontmatter: updatedFrontmatter } : n
    );
    set({ notes: updatedNotes });

    const now = new Date().toISOString();
    const frontmatter = {
      ...updatedFrontmatter,
      id: note.id,
      title: activeNoteTitle,
      tags: note.tags,
      updated: now,
      pinned: !!note.isPinned,
      favorite: !!note.isFavorite,
    };

    const fullMarkdown = serializeFrontmatter(frontmatter, activeNoteContent);
    await driver.writeFile(note.path, fullMarkdown);
  },

  addNote: async (title = 'Untitled Note', folderId = null, initialContent = '') => {
    const { driver } = get();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const cleanTitle = sanitizeFilename(title);

    const frontmatter = {
      id,
      title,
      tags: [],
      created: now,
      updated: now,
      pinned: false,
      favorite: false,
    };

    const fullMarkdown = serializeFrontmatter(frontmatter, initialContent);
    const { path } = await resolveUniquePath(driver, folderId || '', cleanTitle, fullMarkdown);

    await driver.writeFile(path, fullMarkdown);
    useActivityStore.getState().logActivity('note', `Created note: ${title}`);

    await (get() as any).scanVaultFiles();
    await get().setActiveNote(id);
    return id;
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    const { notes, driver } = get();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const updatedNote: Note = { ...note, ...updates, updatedAt: new Date().toISOString() };
    const frontmatter = {
      ...(updatedNote.frontmatter || {}),
      id: updatedNote.id,
      title: updatedNote.title,
      tags: updatedNote.tags,
      updated: updatedNote.updatedAt,
      pinned: !!updatedNote.isPinned,
      favorite: !!updatedNote.isFavorite,
    };

    const fullMarkdown = serializeFrontmatter(frontmatter, updatedNote.content);
    await driver.writeFile(updatedNote.path, fullMarkdown);

    await (get() as any).scanVaultFiles();
  },

  deleteNote: async (id: string) => {
    const { notes, driver, activeNoteId } = get();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    await driver.deleteFile(note.path);
    if (activeNoteId === id) {
      set({
        activeNoteId: null,
        activeNoteContent: '',
        activeNoteTitle: '',
        isDirty: false,
        backlinks: [],
      });
    }

    await (get() as any).scanVaultFiles();
  },

  addFolder: async (name: string, parentPath = '') => {
    const { driver } = get();
    const clean = sanitizeFilename(name);
    const path = parentPath ? `${parentPath.replace(/\/+$/, '')}/${clean}` : clean;
    await driver.createFolder(path);
    await (get() as any).scanVaultFiles();
  },

  deleteFolder: async (idOrPath: string) => {
    const { driver } = get();
    await driver.deleteFolder(idOrPath);
    await (get() as any).scanVaultFiles();
  },

  importFile: async (filename: string, content: string, targetFolder = '') => {
    const { driver } = get();
    const { frontmatter, content: body } = parseFrontmatter(content);
    const now = new Date().toISOString();
    const title = (frontmatter.title as string) || filename.replace(/\.md$/i, '') || 'Imported Note';

    const merged = {
      id: frontmatter.id || crypto.randomUUID(),
      title,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      created: frontmatter.created || now,
      updated: frontmatter.updated || now,
      pinned: !!frontmatter.pinned,
      favorite: !!frontmatter.favorite,
      ...frontmatter,
    };

    const finalized = serializeFrontmatter(merged, body);
    const { path } = await resolveUniquePath(driver, targetFolder, title, finalized);
    await driver.writeFile(path, finalized);

    await (get() as any).scanVaultFiles();
    const importedId = merged.id as string;
    await get().setActiveNote(importedId);
    return path;
  },

  resolveConflict: async (resolution: 'keep-local' | 'load-external' | 'save-copy') => {
    const { activeNoteId, activeNoteTitle, activeNoteContent, notes, driver } = get();
    if (!activeNoteId) return;

    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    if (resolution === 'keep-local') {
      // Overwrite file with local version
      await get().saveActiveNote();
    } else if (resolution === 'load-external') {
      // Discard local edits and reload from disk
      const raw = await driver.readFile(note.path);
      const { frontmatter, content } = parseFrontmatter(raw);
      set({
        activeNoteContent: content,
        activeNoteTitle: (frontmatter.title as string) || note.title,
        isDirty: false,
        isExternalConflict: false,
      });
    } else if (resolution === 'save-copy') {
      const copyContent = activeNoteContent;
      const copyTitle = `${activeNoteTitle} (Local Copy)`;
      set({ isDirty: false, isExternalConflict: false });
      // Save local buffer as copy with local content
      await get().addNote(copyTitle, note.folderId, copyContent);
      // Reload original note from disk
      await get().setActiveNote(note.id);
    }
  },
}));
