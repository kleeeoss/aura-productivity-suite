import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { differenceInDays } from 'date-fns';
import { useActivityStore } from './useActivityStore';

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

// Helper function to calculate streaks (can be moved to a separate utils file later)
export const calculateStreak = (completedDates: string[]) => {
  if (completedDates.length === 0) return 0;
  
  const sortedDates = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  let currentDate = new Date();
  
  // Check if completed today or yesterday to continue streak
  const firstDate = new Date(sortedDates[0]);
  const diffToFirst = differenceInDays(currentDate, firstDate);
  
  if (diffToFirst > 1) return 0; // Streak broken
  
  for (let i = 0; i < sortedDates.length; i++) {
    const d = new Date(sortedDates[i]);
    if (i > 0) {
      const prevD = new Date(sortedDates[i - 1]);
      if (differenceInDays(prevD, d) === 1) {
        streak++;
      } else {
        break;
      }
    } else {
      streak++;
    }
  }
  return streak;
};
