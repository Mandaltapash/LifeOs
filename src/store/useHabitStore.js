import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const useHabitStore = create(
  persist(
    (set, get) => ({
      habits: [
        { id: '1', name: 'Coding', icon: '💻', color: '#6366f1', target: 1 },
        { id: '2', name: 'GATE Study', icon: '📚', color: '#10b981', target: 1 },
        { id: '3', name: 'Exercise', icon: '🏋️', color: '#f59e0b', target: 1 },
        { id: '4', name: 'Water Intake', icon: '💧', color: '#3b82f6', target: 8 },
        { id: '5', name: 'Reading', icon: '📖', color: '#8b5cf6', target: 1 },
        { id: '6', name: 'Typing Practice', icon: '⌨️', color: '#ec4899', target: 1 },
        { id: '7', name: 'Handwriting', icon: '✍️', color: '#14b8a6', target: 1 },
        { id: '8', name: 'Early Wake-up', icon: '🌅', color: '#f97316', target: 1 },
      ],
      // { habitId: { 'yyyy-MM-dd': count } }
      completions: {},
      streaks: {},

      addHabit: (habit) => set(s => ({
        habits: [...s.habits, {
          id: Date.now().toString(),
          name: habit.name,
          icon: habit.icon || '✅',
          color: habit.color || '#6366f1',
          target: habit.target || 1,
        }]
      })),

      removeHabit: (id) => set(s => ({
        habits: s.habits.filter(h => h.id !== id)
      })),

      toggleHabit: (habitId, date) => {
        const d = date || today();
        set(s => {
          const completions = { ...s.completions };
          if (!completions[habitId]) completions[habitId] = {};
          const current = completions[habitId][d] || 0;
          const habit = s.habits.find(h => h.id === habitId);
          const target = habit?.target || 1;
          completions[habitId][d] = current >= target ? 0 : current + 1;

          // Update streak
          const streaks = { ...s.streaks };
          streaks[habitId] = get()._calcStreak(habitId, completions, habit);

          return { completions, streaks };
        });
      },

      _calcStreak: (habitId, completions, habit) => {
        const target = habit?.target || 1;
        const data = completions[habitId] || {};
        let streak = 0;
        let d = new Date();
        // check yesterday first if today not done
        while (true) {
          const key = format(d, 'yyyy-MM-dd');
          if ((data[key] || 0) >= target) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      },

      getCompletionForDate: (habitId, date) => {
        const s = get();
        return (s.completions[habitId] || {})[date || today()] || 0;
      },

      isHabitDoneToday: (habitId) => {
        const s = get();
        const habit = s.habits.find(h => h.id === habitId);
        const count = (s.completions[habitId] || {})[today()] || 0;
        return count >= (habit?.target || 1);
      },

      getTodayCompletedCount: () => {
        const s = get();
        return s.habits.filter(h => {
          const count = (s.completions[h.id] || {})[today()] || 0;
          return count >= (h.target || 1);
        }).length;
      },

      getStreak: (habitId) => {
        return get().streaks[habitId] || 0;
      },

      getLongestStreak: () => {
        const s = get();
        const streaks = Object.values(s.streaks);
        return streaks.length ? Math.max(...streaks) : 0;
      },

      // Returns 7-day completion data for a habit
      getWeeklyData: (habitId) => {
        const s = get();
        const data = s.completions[habitId] || {};
        const habit = s.habits.find(h => h.id === habitId);
        const target = habit?.target || 1;
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const key = format(d, 'yyyy-MM-dd');
          return { date: key, done: (data[key] || 0) >= target };
        });
      },
    }),
    { name: 'lifeos-habits' }
  )
);
