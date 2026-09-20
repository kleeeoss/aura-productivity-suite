import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'glass' | 'ocean' | 'midnight' | 'sunset' | 'forest' | 'minimalist';
export type AppMode = 'light' | 'dark' | 'auto';
export type FontStyle = 'inter' | 'roboto' | 'monospace' | 'serif';
export type TempUnit = 'celsius' | 'fahrenheit';

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
    (set) => ({
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
    }
  )
);
