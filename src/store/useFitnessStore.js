import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const useFitnessStore = create(
  persist(
    (set, get) => ({
      log: [], // { date, gym, waterGlasses, weight, sleepHours, exercises: [] }
      goals: {
        waterTarget: 8,
        sleepTarget: 7,
        weightTarget: 70,
      },

      logDay: (data) => set(s => {
        const t = today();
        const existing = s.log.find(l => l.date === t);
        if (existing) {
          return { log: s.log.map(l => l.date === t ? { ...l, ...data } : l) };
        }
        return {
          log: [...s.log, {
            date: t,
            gym: false,
            waterGlasses: 0,
            weight: null,
            sleepHours: 0,
            exercises: [],
            ...data,
          }]
        };
      }),

      updateGoals: (goals) => set(s => ({ goals: { ...s.goals, ...goals } })),

      getTodayLog: () => get().log.find(l => l.date === today()) || {
        date: today(), gym: false, waterGlasses: 0, weight: null, sleepHours: 0, exercises: []
      },

      getWeeklyData: () => {
        const log = get().log;
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const key = format(d, 'yyyy-MM-dd');
          const entry = log.find(l => l.date === key) || {};
          return {
            date: format(d, 'EEE'),
            water: entry.waterGlasses || 0,
            sleep: entry.sleepHours || 0,
            weight: entry.weight || null,
            gym: entry.gym ? 1 : 0,
          };
        });
      },

      getGymStreak: () => {
        const log = get().log;
        let streak = 0;
        const d = new Date();
        while (true) {
          const key = format(d, 'yyyy-MM-dd');
          const entry = log.find(l => l.date === key);
          if (entry?.gym) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      },
    }),
    { name: 'lifeos-fitness' }
  )
);
