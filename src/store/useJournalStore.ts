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
      }
    }),
    {
      name: 'journal-storage-v2' // bumped version since schema changed
    }
  )
);
