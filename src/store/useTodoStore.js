import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const useTodoStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      filter: 'all',
      searchQuery: '',
      sortBy: 'dueDate',

      addTask: (task) => set(s => ({
        tasks: [...s.tasks, {
          id: Date.now().toString(),
          title: task.title || '',
          description: task.description || '',
          dueDate: task.dueDate || today(),
          priority: task.priority || 'medium',
          category: task.category || 'personal',
          status: 'pending',
          notes: task.notes || '',
          tags: task.tags || [],
          createdAt: new Date().toISOString(),
          completedAt: null,
          archived: false,
        }]
      })),

      updateTask: (id, updates) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      deleteTask: (id) => set(s => ({
        tasks: s.tasks.filter(t => t.id !== id)
      })),

      toggleComplete: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id
          ? {
            ...t,
            status: t.status === 'done' ? 'pending' : 'done',
            completedAt: t.status === 'done' ? null : new Date().toISOString()
          }
          : t)
      })),

      archiveTask: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, archived: true } : t)
      })),

      unarchiveTask: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, archived: false } : t)
      })),

      setFilter: (filter) => set({ filter }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSortBy: (by) => set({ sortBy: by }),

      getTodayTasks: () => {
        const t = today();
        return get().tasks.filter(task => task.dueDate === t && !task.archived);
      },
      getPendingCount: () => get().tasks.filter(t => t.status === 'pending' && !t.archived).length,
      getCompletedTodayCount: () => {
        const t = today();
        return get().tasks.filter(task => {
          if (task.status !== 'done' || task.archived || !task.completedAt) return false;
          try {
            return format(new Date(task.completedAt), 'yyyy-MM-dd') === t;
          } catch (e) {
            return false;
          }
        }).length;
      },
    }),
    { name: 'lifeos-todos' }
  )
);
