import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const usePomodoroStore = create(
  persist(
    (set, get) => ({
      sessions: [],
      settings: {
        focusTime: 25,
        breakTime: 5,
        mode: '25/5',
      },
      totalFocusMinutes: 0,

      setMode: (mode) => {
        const modes = { '25/5': { focusTime: 25, breakTime: 5 }, '50/10': { focusTime: 50, breakTime: 10 } };
        if (modes[mode]) {
          set({ settings: { ...modes[mode], mode } });
        } else {
          set(s => ({ settings: { ...s.settings, mode: 'custom' } }));
        }
      },

      setCustomTime: (focusTime, breakTime) => set({
        settings: { focusTime, breakTime, mode: 'custom' }
      }),

      completeSession: (type, minutes) => set(s => ({
        sessions: [...s.sessions, {
          id: Date.now().toString(),
          date: today(),
          type, // 'focus' | 'break'
          minutes,
          completedAt: new Date().toISOString(),
        }],
        totalFocusMinutes: type === 'focus' ? s.totalFocusMinutes + minutes : s.totalFocusMinutes,
      })),

      getTodaySessions: () => {
        return get().sessions.filter(s => s.date === today() && s.type === 'focus');
      },

      getTodayFocusMinutes: () => {
        return get().sessions
          .filter(s => s.date === today() && s.type === 'focus')
          .reduce((sum, s) => sum + s.minutes, 0);
      },

      getWeeklyFocusData: () => {
        const sessions = get().sessions;
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const key = format(d, 'yyyy-MM-dd');
          const minutes = sessions
            .filter(s => s.date === key && s.type === 'focus')
            .reduce((sum, s) => sum + s.minutes, 0);
          return { date: format(d, 'EEE'), hours: Math.round(minutes / 60 * 10) / 10 };
        });
      },
    }),
    { name: 'lifeos-pomodoro' }
  )
);
