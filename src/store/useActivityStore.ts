import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivityType = 'task' | 'pomodoro' | 'note' | 'journal' | 'habit' | 'event';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  timestamp: string; // ISO string
}

interface ActivityState {
  activities: Activity[];
  logActivity: (type: ActivityType, title: string) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: [],
      logActivity: (type, title) => {
        const newActivity: Activity = {
          id: crypto.randomUUID(),
          type,
          title,
          timestamp: new Date().toISOString()
        };
        // Keep the last 100 activities to prevent infinite growth
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 100)
        }));
      },
      clearActivities: () => set({ activities: [] })
    }),
    {
      name: 'activity-storage'
    }
  )
);
