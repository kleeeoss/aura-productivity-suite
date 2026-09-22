import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useActivityStore } from './useActivityStore';
import { useTaskStore } from './useTaskStore';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export interface CompletionPrompt {
  id: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: string;
}

interface FocusState {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  
  // Timer State
  timeLeft: number;
  isActive: boolean;
  mode: TimerMode;
  
  // Active Linked Task
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;

  // Post-session reflection prompt
  completionPrompt: CompletionPrompt | null;
  dismissCompletionPrompt: () => void;

  // Ambient Volumes
  volumes: Record<string, number>;
  
  pomodorosCompletedToday: number;
  
  // Historical Tracking
  longestSession: number; // in minutes
  currentStreak: number;
  totalFocusTime: number; // in minutes
  dailyFocusHours: Record<string, number>; // date (YYYY-MM-DD) -> minutes
  
  // Actions
  setDurations: (work: number, shortBreak: number, longBreak: number) => void;
  setVolume: (trackId: string, volume: number) => void;
  
  // Timer Actions
  setTimeLeft: (time: number) => void;
  setIsActive: (active: boolean) => void;
  setMode: (mode: TimerMode) => void;
  
  // Categories & History
  currentCategory: string;
  setCurrentCategory: (category: string) => void;
  sessionHistory: { id: string; category: string; duration: number; timestamp: string; taskId?: string }[];
  
  incrementPomodoros: () => void;
  resetPomodoros: () => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set) => ({
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      
      timeLeft: 25 * 60,
      isActive: false,
      mode: 'work',
      
      activeTaskId: null,
      setActiveTaskId: (id) => set({ activeTaskId: id }),

      completionPrompt: null,
      dismissCompletionPrompt: () => set({ completionPrompt: null }),

      volumes: {
        'lofi': 0,
        'rain': 0,
        'coffee': 0,
        'fireplace': 0,
        'ocean': 0,
        'wind': 0,
        'keyboard': 0,
      },
      
      pomodorosCompletedToday: 0,
      
      longestSession: 0,
      currentStreak: 0,
      totalFocusTime: 0,
      dailyFocusHours: {},
      
      currentCategory: 'Deep Work',
      sessionHistory: [],
      
      setCurrentCategory: (category) => set({ currentCategory: category }),
      
      setDurations: (work, shortBreak, longBreak) =>
        set({ workDuration: work, breakDuration: shortBreak, longBreakDuration: longBreak }),
        
      setVolume: (trackId, volume) =>
        set((state) => ({
          volumes: {
            ...state.volumes,
            [trackId]: volume
          }
        })),
        
      setTimeLeft: (time) => set({ timeLeft: time }),
      setIsActive: (active) => set({ isActive: active }),
      setMode: (mode) => set({ mode }),
      
      incrementPomodoros: () => {
        let linkedTaskTitle: string | null = null;
        
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const newTotal = state.totalFocusTime + state.workDuration;
          const newLongest = Math.max(state.longestSession, state.workDuration);
          const newDaily = { ...state.dailyFocusHours };
          newDaily[today] = (newDaily[today] || 0) + state.workDuration;
          
          if (state.activeTaskId) {
            const task = useTaskStore.getState().tasks.find(t => t.id === state.activeTaskId);
            if (task) {
              linkedTaskTitle = task.title;
            }
            useTaskStore.getState().addTimeSpent(state.activeTaskId, state.workDuration);
          }

          const newSession = {
            id: crypto.randomUUID(),
            category: state.currentCategory,
            duration: state.workDuration,
            timestamp: new Date().toISOString(),
            taskId: state.activeTaskId || undefined,
          };
          
          return { 
            pomodorosCompletedToday: state.pomodorosCompletedToday + 1,
            totalFocusTime: newTotal,
            longestSession: newLongest,
            dailyFocusHours: newDaily,
            sessionHistory: [newSession, ...state.sessionHistory].slice(0, 500),
            completionPrompt: {
              id: crypto.randomUUID(),
              taskId: state.activeTaskId || undefined,
              taskTitle: linkedTaskTitle || undefined,
              timestamp: new Date().toISOString(),
            },
          };
        });

        const activityTitle = linkedTaskTitle 
          ? `Completed a focus session: ${linkedTaskTitle}`
          : `Completed a focus session`;
        useActivityStore.getState().logActivity('pomodoro', activityTitle);
      },
      resetPomodoros: () => set({ pomodorosCompletedToday: 0 }),
    }),
    {
      name: 'focus-storage-v2',
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isActive: _isActive, completionPrompt: _prompt, ...rest } = state;
        return rest;
      },
    }
  )
);
