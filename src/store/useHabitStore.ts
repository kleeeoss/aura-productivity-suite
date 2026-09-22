import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useActivityStore } from './useActivityStore';
import { calculateStreak } from '../utils/productivityMath';

export interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  completedDates: string[]; // Array of YYYY-MM-DD strings
  bestStreak: number;
}

export type Achievement = '7_day_streak' | '30_day_streak' | 'perfect_month' | '100_days_total';

interface HabitState {
  habits: Habit[];
  achievements: Achievement[];
  addHabit: (name: string, color: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDate: (id: string, dateStr: string) => void;
  unlockAchievement: (achievement: Achievement) => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      habits: [],
      achievements: [],
      addHabit: (name, color) => {
        const newHabit: Habit = {
          id: crypto.randomUUID(),
          name,
          color,
          createdAt: new Date().toISOString(),
          completedDates: [],
          bestStreak: 0,
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },
      deleteHabit: (id) =>
        set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),
      toggleHabitDate: (id, dateStr) =>
        set((state) => {
          const habits = state.habits.map((h) => {
            if (h.id === id) {
              const isCompleting = !h.completedDates.includes(dateStr);
              const completedDates = isCompleting
                ? [...h.completedDates, dateStr]
                : h.completedDates.filter((d) => d !== dateStr);
                
              if (isCompleting) {
                useActivityStore.getState().logActivity('habit', `Completed habit: ${h.name}`);
              }
                
              const currentStreak = calculateStreak(completedDates);
              const bestStreak = Math.max(h.bestStreak, currentStreak);
              
              return { ...h, completedDates, bestStreak };
            }
            return h;
          });
          return { habits };
        }),
      unlockAchievement: (achievement) => 
        set((state) => ({
          achievements: state.achievements.includes(achievement) 
            ? state.achievements 
            : [...state.achievements, achievement]
        }))
    }),
    {
      name: 'habit-storage',
    }
  )
);

// Re-export calculateStreak from productivityMath for backward compatibility
export { calculateStreak };
