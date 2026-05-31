import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const useCodingStore = create(
  persist(
    (set, get) => ({
      stats: {
        dsaSolved: 0,
        pythonProblems: 0,
        projects: 0,
        githubContributions: 0,
        totalHours: 0,
      },
      dailyLog: [], // { date, dsaSolved, pythonProblems, hours, notes }
      problems: [], // { id, title, difficulty, topic, platform, solved, date, notes }

      updateStats: (field, value) => set(s => ({
        stats: { ...s.stats, [field]: value }
      })),

      addProblem: (problem) => set(s => ({
        problems: [...s.problems, {
          id: Date.now().toString(),
          title: problem.title || '',
          difficulty: problem.difficulty || 'medium',
          topic: problem.topic || 'arrays',
          platform: problem.platform || 'leetcode',
          solved: true,
          date: today(),
          notes: problem.notes || '',
          url: problem.url || '',
        }]
      })),

      removeProblem: (id) => set(s => ({
        problems: s.problems.filter(p => p.id !== id)
      })),

      logDay: (log) => set(s => {
        const existing = s.dailyLog.find(l => l.date === today());
        let dailyLog;
        if (existing) {
          dailyLog = s.dailyLog.map(l => l.date === today() ? { ...l, ...log } : l);
        } else {
          dailyLog = [...s.dailyLog, { date: today(), dsaSolved: 0, pythonProblems: 0, hours: 0, ...log }];
        }
        // update cumulative stats
        const stats = {
          ...s.stats,
          dsaSolved: s.stats.dsaSolved + (log.dsaSolved || 0),
          pythonProblems: s.stats.pythonProblems + (log.pythonProblems || 0),
          totalHours: s.stats.totalHours + (log.hours || 0),
        };
        return { dailyLog, stats };
      }),

      getWeeklyActivity: () => {
        const log = get().dailyLog;
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const key = format(d, 'yyyy-MM-dd');
          const entry = log.find(l => l.date === key) || {};
          return {
            date: format(d, 'EEE'),
            problems: (entry.dsaSolved || 0) + (entry.pythonProblems || 0),
            hours: entry.hours || 0,
          };
        });
      },

      getProblemsByTopic: () => {
        const problems = get().problems;
        const map = {};
        problems.forEach(p => {
          map[p.topic] = (map[p.topic] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
      },
    }),
    { name: 'lifeos-coding' }
  )
);
