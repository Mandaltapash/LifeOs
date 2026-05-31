import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGoalsStore = create(
  persist(
    (set, get) => ({
      goals: [
        {
          id: '1', title: 'Crack GATE', type: 'long',
          description: 'Get selected in top IITs through GATE CS 2027',
          deadline: '2027-02-28', progress: 10,
          milestones: [
            { id: 'm1', title: 'Complete all subjects', done: false },
            { id: 'm2', title: 'Solve 500+ PYQs', done: false },
            { id: 'm3', title: 'Score 70+ in mock tests', done: false },
          ],
          category: 'academic', color: '#6366f1',
        },
        {
          id: '2', title: 'Build CollegeX', type: 'long',
          description: 'Build and launch CollegeX platform',
          deadline: '2026-12-31', progress: 5,
          milestones: [
            { id: 'm4', title: 'MVP ready', done: false },
            { id: 'm5', title: 'Beta launch', done: false },
          ],
          category: 'project', color: '#10b981',
        },
        {
          id: '3', title: 'Start Freelancing', type: 'long',
          description: 'Get first paid client',
          deadline: '2026-09-30', progress: 0,
          milestones: [],
          category: 'career', color: '#f59e0b',
        },
        {
          id: '4', title: 'Finish DBMS', type: 'short',
          description: 'Complete DBMS for GATE',
          deadline: '2026-07-31', progress: 20,
          milestones: [],
          category: 'academic', color: '#ec4899',
        },
        {
          id: '5', title: 'Complete Python DSA', type: 'short',
          description: 'Finish Python-based DSA problems on LeetCode',
          deadline: '2026-08-31', progress: 15,
          milestones: [],
          category: 'coding', color: '#8b5cf6',
        },
      ],

      addGoal: (goal) => set(s => ({
        goals: [...s.goals, {
          id: Date.now().toString(),
          title: goal.title || '',
          type: goal.type || 'short',
          description: goal.description || '',
          deadline: goal.deadline || '',
          progress: 0,
          milestones: [],
          category: goal.category || 'personal',
          color: goal.color || '#6366f1',
        }]
      })),

      updateGoal: (id, updates) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, ...updates } : g)
      })),

      deleteGoal: (id) => set(s => ({
        goals: s.goals.filter(g => g.id !== id)
      })),

      addMilestone: (goalId, title) => set(s => ({
        goals: s.goals.map(g =>
          g.id === goalId
            ? {
              ...g,
              milestones: [...g.milestones, {
                id: Date.now().toString(),
                title,
                done: false,
              }]
            }
            : g
        )
      })),

      toggleMilestone: (goalId, milestoneId) => set(s => ({
        goals: s.goals.map(g =>
          g.id === goalId
            ? {
              ...g,
              milestones: g.milestones.map(m =>
                m.id === milestoneId ? { ...m, done: !m.done } : m
              )
            }
            : g
        )
      })),

      editMilestone: (goalId, milestoneId, newTitle) => set(s => ({
        goals: s.goals.map(g =>
          g.id === goalId
            ? {
              ...g,
              milestones: g.milestones.map(m =>
                m.id === milestoneId ? { ...m, title: newTitle } : m
              )
            }
            : g
        )
      })),

      deleteMilestone: (goalId, milestoneId) => set(s => ({
        goals: s.goals.map(g =>
          g.id === goalId
            ? {
              ...g,
              milestones: g.milestones.filter(m => m.id !== milestoneId)
            }
            : g
        )
      })),

      updateProgress: (id, progress) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g)
      })),
    }),
    { name: 'lifeos-goals' }
  )
);
