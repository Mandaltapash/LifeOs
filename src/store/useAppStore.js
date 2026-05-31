import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      gateExamDate: '2027-02-01',
      geminiApiKey: '',
      settings: {
        name: 'Tapash',
        greeting: true,
        notifications: true,
        sound: true,
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setGateExamDate: (date) => set({ gateExamDate: date }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      updateSettings: (settings) => set(s => ({ settings: { ...s.settings, ...settings } })),
    }),
    { name: 'lifeos-app' }
  )
);
