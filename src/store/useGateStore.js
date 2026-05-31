import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

const SUBJECTS = [
  { id: 'programming', name: 'Programming & C', color: '#6366f1' },
  { id: 'ds', name: 'Data Structures', color: '#10b981' },
  { id: 'algorithms', name: 'Algorithms', color: '#f59e0b' },
  { id: 'dbms', name: 'DBMS', color: '#ec4899' },
  { id: 'os', name: 'Operating Systems', color: '#8b5cf6' },
  { id: 'cn', name: 'Computer Networks', color: '#3b82f6' },
  { id: 'toc', name: 'TOC', color: '#14b8a6' },
  { id: 'compiler', name: 'Compiler Design', color: '#f97316' },
  { id: 'aptitude', name: 'Aptitude', color: '#84cc16' },
  { id: 'maths', name: 'Mathematics', color: '#06b6d4' },
];

export const useGateStore = create(
  persist(
    (set, get) => ({
      subjects: SUBJECTS,
      // { subjectId: { videos, hours, pyqs, notes, revisions } }
      progress: {},
      mockTests: [],
      studyLog: [], // { date, subjectId, hours, type }

      updateProgress: (subjectId, field, value) => set(s => ({
        progress: {
          ...s.progress,
          [subjectId]: {
            ...(s.progress[subjectId] || { videos: 0, hours: 0, pyqs: 0, notes: 0, revisions: 0 }),
            [field]: value,
          }
        }
      })),

      addStudySession: (subjectId, hours) => set(s => {
        const today_ = today();
        const existing = s.studyLog.find(l => l.date === today_ && l.subjectId === subjectId);
        let log;
        if (existing) {
          log = s.studyLog.map(l =>
            l.date === today_ && l.subjectId === subjectId
              ? { ...l, hours: l.hours + hours }
              : l
          );
        } else {
          log = [...s.studyLog, { date: today_, subjectId, hours }];
        }
        // Also update total hours in progress
        const current = s.progress[subjectId] || { videos: 0, hours: 0, pyqs: 0, notes: 0, revisions: 0 };
        return {
          studyLog: log,
          progress: {
            ...s.progress,
            [subjectId]: { ...current, hours: current.hours + hours }
          }
        };
      }),

      addMockTest: (test) => set(s => ({
        mockTests: [...s.mockTests, {
          id: Date.now().toString(),
          date: test.date || today(),
          score: test.score || 0,
          maxScore: test.maxScore || 100,
          name: test.name || 'Mock Test',
          notes: test.notes || '',
        }]
      })),

      removeMockTest: (id) => set(s => ({
        mockTests: s.mockTests.filter(t => t.id !== id)
      })),

      getTotalHours: () => {
        const p = get().progress;
        return Object.values(p).reduce((acc, s) => acc + (s.hours || 0), 0);
      },

      getSubjectProgress: (subjectId) => {
        return get().progress[subjectId] || { videos: 0, hours: 0, pyqs: 0, notes: 0, revisions: 0 };
      },

      getWeeklyStudyHours: () => {
        const log = get().studyLog;
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const key = format(d, 'yyyy-MM-dd');
          const hours = log.filter(l => l.date === key).reduce((sum, l) => sum + l.hours, 0);
          return { date: format(d, 'EEE'), hours };
        });
      },
    }),
    { name: 'lifeos-gate' }
  )
);
