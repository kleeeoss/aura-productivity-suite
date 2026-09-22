import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useFocusStore } from './useFocusStore';
import { audioEngine } from '../utils/audioEngine';

export type AppTheme = 'glass' | 'ocean' | 'midnight' | 'sunset' | 'forest' | 'minimalist';
export type AppMode = 'light' | 'dark' | 'auto';
export type FontStyle = 'inter' | 'roboto' | 'monospace' | 'serif';
export type TempUnit = 'celsius' | 'fahrenheit';

export interface FocusSpace {
  id: string;
  name: string;
  icon: 'code' | 'study' | 'write' | 'sparkles';
  description: string;
  workDuration: number; // in minutes
  breakDuration: number;
  longBreakDuration: number;
  theme: AppTheme;
  accentColor: string;
  noises: {
    white: number;
    brown: number;
    pink: number;
  };
  category: string;
  isBuiltIn?: boolean;
}

export const DEFAULT_FOCUS_SPACES: FocusSpace[] = [
  {
    id: 'deep-code',
    name: 'Deep Code',
    icon: 'code',
    description: '50m hyperfocus with deep brown noise in dark midnight atmosphere',
    workDuration: 50,
    breakDuration: 10,
    longBreakDuration: 15,
    theme: 'midnight',
    accentColor: '#6366f1',
    noises: { white: 0, brown: 45, pink: 0 },
    category: 'Coding',
    isBuiltIn: true,
  },
  {
    id: 'study-sprint',
    name: 'Study Sprint',
    icon: 'study',
    description: '25m classic Pomodoro with balanced white noise in serene forest theme',
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    theme: 'forest',
    accentColor: '#10b981',
    noises: { white: 25, brown: 0, pink: 0 },
    category: 'Studying',
    isBuiltIn: true,
  },
  {
    id: 'flow-writing',
    name: 'Flow / Writing',
    icon: 'write',
    description: '45m distraction-free session with soft pink noise in minimalist styling',
    workDuration: 45,
    breakDuration: 10,
    longBreakDuration: 20,
    theme: 'minimalist',
    accentColor: '#ec4899',
    noises: { white: 0, brown: 0, pink: 35 },
    category: 'Writing',
    isBuiltIn: true,
  },
];

export type DashboardWidgetId = 'clock' | 'weather' | 'score' | 'habits' | 'tasks' | 'activity' | 'quote';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  label: string;
  visible: boolean;
  order: number;
}

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  { id: 'clock', label: 'Greeting & Live Clock', visible: true, order: 0 },
  { id: 'weather', label: 'Weather Information', visible: true, order: 1 },
  { id: 'score', label: 'Productivity Score', visible: true, order: 2 },
  { id: 'habits', label: 'Quick Habit Tracker', visible: true, order: 3 },
  { id: 'tasks', label: 'Prioritized Tasks', visible: true, order: 4 },
  { id: 'activity', label: 'Recent Activity Feed', visible: true, order: 5 },
  { id: 'quote', label: 'Daily Inspiration Quote', visible: true, order: 6 },
];

interface SettingsState {
  theme: AppTheme;
  mode: AppMode;
  font: FontStyle;
  tempUnit: TempUnit;
  accentColor: string;
  disableAnimations: boolean;
  reduceMotion: boolean;
  defaultPomodoroLength: number;
  defaultShortBreakLength: number;
  defaultLongBreakLength: number;
  uiScale: number;
  
  // Focus Spaces
  focusSpaces: FocusSpace[];
  activeSpaceId: string;
  setActiveSpace: (id: string) => void;
  createCustomSpace: (space: Omit<FocusSpace, 'id' | 'isBuiltIn'>) => void;
  deleteCustomSpace: (id: string) => void;

  // Modular Dashboard
  dashboardWidgets: DashboardWidgetConfig[];
  toggleWidgetVisibility: (id: DashboardWidgetId) => void;
  moveWidgetOrder: (id: DashboardWidgetId, direction: 'up' | 'down') => void;
  resetDashboardWidgets: () => void;

  setTheme: (theme: AppTheme) => void;
  setMode: (mode: AppMode) => void;
  setFont: (font: FontStyle) => void;
  setTempUnit: (unit: TempUnit) => void;
  setAccentColor: (color: string) => void;
  setDisableAnimations: (disable: boolean) => void;
  setReduceMotion: (reduce: boolean) => void;
  setDefaultPomodoroLength: (length: number) => void;
  setDefaultShortBreakLength: (length: number) => void;
  setDefaultLongBreakLength: (length: number) => void;
  setUiScale: (scale: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'glass',
      mode: 'dark',
      font: 'inter',
      tempUnit: 'fahrenheit',
      accentColor: '#3b82f6',
      disableAnimations: false,
      reduceMotion: false,
      defaultPomodoroLength: 25,
      defaultShortBreakLength: 5,
      defaultLongBreakLength: 15,
      uiScale: 100,

      focusSpaces: DEFAULT_FOCUS_SPACES,
      activeSpaceId: 'deep-code',

      dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,

      toggleWidgetVisibility: (id) =>
        set((state) => ({
          dashboardWidgets: state.dashboardWidgets.map((w) =>
            w.id === id ? { ...w, visible: !w.visible } : w
          ),
        })),

      moveWidgetOrder: (id, direction) =>
        set((state) => {
          const sorted = [...state.dashboardWidgets].sort((a, b) => a.order - b.order);
          const index = sorted.findIndex((w) => w.id === id);
          if (index === -1) return state;
          const targetIndex = direction === 'up' ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= sorted.length) return state;

          // Swap orders
          const temp = sorted[index].order;
          sorted[index].order = sorted[targetIndex].order;
          sorted[targetIndex].order = temp;

          return { dashboardWidgets: [...sorted] };
        }),

      resetDashboardWidgets: () =>
        set({ dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS }),

      setActiveSpace: (id: string) => {
        const space = get().focusSpaces.find((s) => s.id === id);
        if (!space) return;

        // 1. Update settings
        set({
          activeSpaceId: id,
          theme: space.theme,
          accentColor: space.accentColor,
          defaultPomodoroLength: space.workDuration,
          defaultShortBreakLength: space.breakDuration,
          defaultLongBreakLength: space.longBreakDuration,
        });

        // 2. Dispatch to focus store
        const focusStore = useFocusStore.getState();
        focusStore.setDurations(space.workDuration, space.breakDuration, space.longBreakDuration);
        focusStore.setCurrentCategory(space.category);
        if (!focusStore.isActive) {
          focusStore.setTimeLeft(space.workDuration * 60);
        }

        // 3. Update ambient noise mixer
        focusStore.setVolume('white', space.noises.white);
        focusStore.setVolume('brown', space.noises.brown);
        focusStore.setVolume('pink', space.noises.pink);

        // 4. Update audio engine
        try {
          audioEngine.setNoiseVolume('white', space.noises.white);
          audioEngine.setNoiseVolume('brown', space.noises.brown);
          audioEngine.setNoiseVolume('pink', space.noises.pink);
        } catch {
          // Audio context might be uninitialized in SSR/testing environments
        }
      },

      createCustomSpace: (newSpace) => {
        const space: FocusSpace = {
          ...newSpace,
          id: crypto.randomUUID(),
          isBuiltIn: false,
        };
        set((state) => ({
          focusSpaces: [...state.focusSpaces, space],
        }));
      },

      deleteCustomSpace: (id: string) => {
        set((state) => {
          const spaceToDelete = state.focusSpaces.find((s) => s.id === id);
          if (spaceToDelete?.isBuiltIn) return state; // Do not delete built-ins
          const remaining = state.focusSpaces.filter((s) => s.id !== id);
          const nextActiveId = state.activeSpaceId === id ? 'deep-code' : state.activeSpaceId;
          return {
            focusSpaces: remaining,
            activeSpaceId: nextActiveId,
          };
        });
      },

      setTheme: (theme) => set({ theme }),
      setMode: (mode) => set({ mode }),
      setFont: (font) => set({ font }),
      setTempUnit: (tempUnit) => set({ tempUnit }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setDisableAnimations: (disableAnimations) => set({ disableAnimations }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setDefaultPomodoroLength: (defaultPomodoroLength) => set({ defaultPomodoroLength }),
      setDefaultShortBreakLength: (defaultShortBreakLength) => set({ defaultShortBreakLength }),
      setDefaultLongBreakLength: (defaultLongBreakLength) => set({ defaultLongBreakLength }),
      setUiScale: (uiScale) => set({ uiScale }),
    }),
    {
      name: 'settings-storage',
      merge: (persistedState: any, currentState) => {
        // Ensure default built-in focus spaces are always present
        const savedSpaces = persistedState?.focusSpaces || [];
        const builtInIds = new Set(DEFAULT_FOCUS_SPACES.map(s => s.id));
        const mergedSpaces = [
          ...DEFAULT_FOCUS_SPACES,
          ...savedSpaces.filter((s: FocusSpace) => !builtInIds.has(s.id)),
        ];

        // Ensure default widgets are present
        const savedWidgets = persistedState?.dashboardWidgets || [];
        const savedWidgetIds = new Set(savedWidgets.map((w: any) => w.id));
        const mergedWidgets = [
          ...savedWidgets,
          ...DEFAULT_DASHBOARD_WIDGETS.filter((w) => !savedWidgetIds.has(w.id)),
        ];

        return {
          ...currentState,
          ...persistedState,
          focusSpaces: mergedSpaces,
          dashboardWidgets: mergedWidgets,
        };
      },
    }
  )
);
