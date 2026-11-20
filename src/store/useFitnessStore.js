import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const DEFAULT_FITNESS_GOALS = [
  { id: 'water', title: 'Water Intake', target: 8, current: 0, unit: 'glasses', color: '#38bdf8', category: 'water' },
  { id: 'sleep', title: 'Sleep Duration', target: 7, current: 0, unit: 'hours', color: '#a78bfa', category: 'sleep' },
  { id: 'weight', title: 'Body Weight', target: 70, current: 0, unit: 'kg', color: '#f59e0b', category: 'weight' },
];

export const useFitnessStore = create(
  persist(
    (set, get) => ({
      log: [], // { date, gym, waterGlasses, weight, sleepHours, exercises: [] }
      goals: {
        waterTarget: 8,
        sleepTarget: 7,
        weightTarget: 70,
      },
      fitnessGoals: DEFAULT_FITNESS_GOALS,

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

      updateGoals: (goals) => set(s => {
        const list = s.fitnessGoals && s.fitnessGoals.length > 0 ? s.fitnessGoals : DEFAULT_FITNESS_GOALS;
        const updatedList = list.map(g => {
          if (g.id === 'water' && goals.waterTarget !== undefined) return { ...g, target: Number(goals.waterTarget) };
          if (g.id === 'sleep' && goals.sleepTarget !== undefined) return { ...g, target: Number(goals.sleepTarget) };
          if (g.id === 'weight' && goals.weightTarget !== undefined) return { ...g, target: Number(goals.weightTarget) };
          return g;
        });
        return {
          goals: { ...s.goals, ...goals },
          fitnessGoals: updatedList,
        };
      }),

      addFitnessGoal: (goal) => set(s => {
        const id = goal.id || ('fgoal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
        const newGoal = {
          id,
          title: goal.title ? goal.title.trim() : 'Fitness Goal',
          target: Number(goal.target) || 1,
          current: Number(goal.current) || 0,
          unit: goal.unit ? goal.unit.trim() : '',
          color: goal.color || '#10b981',
          category: goal.category || 'custom',
        };
        const currentList = s.fitnessGoals && s.fitnessGoals.length > 0 ? s.fitnessGoals : DEFAULT_FITNESS_GOALS;
        const updatedList = [...currentList, newGoal];

        const newGoals = { ...s.goals };
        if (newGoal.category === 'water' || id === 'water') newGoals.waterTarget = newGoal.target;
        if (newGoal.category === 'sleep' || id === 'sleep') newGoals.sleepTarget = newGoal.target;
        if (newGoal.category === 'weight' || id === 'weight') newGoals.weightTarget = newGoal.target;

        return {
          fitnessGoals: updatedList,
          goals: newGoals,
        };
      }),

      updateFitnessGoal: (id, updates) => set(s => {
        const currentList = s.fitnessGoals && s.fitnessGoals.length > 0 ? s.fitnessGoals : DEFAULT_FITNESS_GOALS;
        const updatedList = currentList.map(g => {
          if (g.id !== id) return g;
          return {
            ...g,
            ...updates,
            target: updates.target !== undefined ? Number(updates.target) : g.target,
            current: updates.current !== undefined ? Number(updates.current) : g.current,
          };
        });

        const newGoals = { ...s.goals };
        const updatedItem = updatedList.find(g => g.id === id);
        if (updatedItem) {
          if (id === 'water' || updatedItem.category === 'water') newGoals.waterTarget = updatedItem.target;
          if (id === 'sleep' || updatedItem.category === 'sleep') newGoals.sleepTarget = updatedItem.target;
          if (id === 'weight' || updatedItem.category === 'weight') newGoals.weightTarget = updatedItem.target;
        }

        return {
          fitnessGoals: updatedList,
          goals: newGoals,
        };
      }),

      deleteFitnessGoal: (id) => set(s => {
        const currentList = s.fitnessGoals && s.fitnessGoals.length > 0 ? s.fitnessGoals : DEFAULT_FITNESS_GOALS;
        return {
          fitnessGoals: currentList.filter(g => g.id !== id),
        };
      }),

      updateFitnessGoalProgress: (id, val, isDelta = false) => set(s => {
        const currentList = s.fitnessGoals && s.fitnessGoals.length > 0 ? s.fitnessGoals : DEFAULT_FITNESS_GOALS;
        return {
          fitnessGoals: currentList.map(g => {
            if (g.id !== id) return g;
            const newCur = isDelta ? Math.max(0, (g.current || 0) + val) : Math.max(0, val);
            return { ...g, current: newCur };
          }),
        };
      }),

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
