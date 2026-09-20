import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Tab = 'dashboard' | 'focus' | 'tasks' | 'notes' | 'habits' | 'journal' | 'statistics' | 'settings';

interface AppState {
  activeTab: Tab;
  isFocusModeActive: boolean;
  userName: string;
  avatar: string | null; // Base64 or URL
  setActiveTab: (tab: Tab) => void;
  setFocusMode: (active: boolean) => void;
  setUserName: (name: string) => void;
  setAvatar: (avatar: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'dashboard',
      isFocusModeActive: false,
      userName: 'User',
      avatar: null,
      setActiveTab: (tab) => set({ activeTab: tab }),
      setFocusMode: (active) => set({ isFocusModeActive: active }),
      setUserName: (userName) => set({ userName }),
      setAvatar: (avatar) => set({ avatar }),
    }),
    {
      name: 'app-storage-v2',
      partialize: (state) => ({ activeTab: state.activeTab, userName: state.userName, avatar: state.avatar }),
    }
  )
);
