import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useActivityStore } from './useActivityStore';

export interface NoteFolder {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown content
  tags: string[];
  folderId: string | null;
  updatedAt: string;
  isFavorite?: boolean;
  isPinned?: boolean;
}

interface NoteState {
  notes: Note[];
  folders: NoteFolder[];
  activeNoteId: string | null;
  addNote: (title?: string, folderId?: string | null) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  
  addFolder: (name: string, color: string) => void;
  deleteFolder: (id: string) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      notes: [],
      folders: [],
      activeNoteId: null,
      addNote: (title = 'Untitled Note', folderId = null) => {
        const id = crypto.randomUUID();
        const newNote: Note = {
          id,
          title,
          content: '',
          tags: [],
          folderId,
          updatedAt: new Date().toISOString(),
          isFavorite: false,
          isPinned: false
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: id,
        }));
        useActivityStore.getState().logActivity('note', `Created note: ${title}`);
        return id;
      },
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : n
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        })),
      setActiveNote: (id) => set({ activeNoteId: id }),
      
      addFolder: (name, color) =>
        set((state) => ({
          folders: [...state.folders, { id: crypto.randomUUID(), name, color }]
        })),
      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter(f => f.id !== id),
          notes: state.notes.map(n => n.folderId === id ? { ...n, folderId: null } : n)
        }))
    }),
    {
      name: 'note-storage',
    }
  )
);
