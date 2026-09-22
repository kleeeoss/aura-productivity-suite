import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useActivityStore } from './useActivityStore';

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  
  // Morning
  morningIntentions: string;
  goals: string;
  gratitude: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible' | null;
  energyLevel: number | null; // 1-5
  sleepHours: number | null;
  stressLevel: number | null; // 1-5
  
  // Evening
  eveningReflections: string;
  wins: string;
  challenges: string;
  lessonsLearned: string;
  tomorrowPriorities: string;
  
  createdAt: string;
  updatedAt: string;
}

interface JournalState {
  entries: Record<string, JournalEntry>; // date -> entry
  getEntryForDate: (date: string) => JournalEntry | undefined;
  saveEntry: (entry: JournalEntry) => void;
  appendReflection: (date: string, reflection: string) => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: {},
      getEntryForDate: (date) => get().entries[date],
      saveEntry: (entry) => {
        const isNew = !get().entries[entry.date];
        set((state) => ({
          entries: {
            ...state.entries,
            [entry.date]: {
              ...entry,
              updatedAt: new Date().toISOString()
            }
          }
        }));
        if (isNew) {
          useActivityStore.getState().logActivity('journal', `Created journal entry for ${entry.date}`);
        } else {
          useActivityStore.getState().logActivity('journal', `Updated journal entry for ${entry.date}`);
        }
      },
      appendReflection: (date, reflection) => {
        const trimmed = reflection.trim();
        if (!trimmed) return;
        const current = get().entries[date];
        const updatedReflections = current?.eveningReflections
          ? `${current.eveningReflections}\n• ${trimmed}`
          : `• ${trimmed}`;

        const entryToSave: JournalEntry = current
          ? { ...current, eveningReflections: updatedReflections }
          : {
              id: crypto.randomUUID(),
              date,
              morningIntentions: '',
              goals: '',
              gratitude: '',
              mood: null,
              energyLevel: null,
              sleepHours: null,
              stressLevel: null,
              eveningReflections: updatedReflections,
              wins: '',
              challenges: '',
              lessonsLearned: '',
              tomorrowPriorities: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

        set((state) => ({
          entries: {
            ...state.entries,
            [date]: {
              ...entryToSave,
              updatedAt: new Date().toISOString()
            }
          }
        }));
        useActivityStore.getState().logActivity('journal', `Added quick reflection for ${date}`);
      }
    }),
    {
      name: 'journal-storage-v2' // bumped version since schema changed
    }
  )
);
