import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const usePlannerStore = create(
  persist(
    (set, get) => ({
      // { 'yyyy-MM-dd': [block, ...] }
      blocks: {},

      addBlock: (date, block) => set(s => {
        const d = date || today();
        const existing = s.blocks[d] || [];
        return {
          blocks: {
            ...s.blocks,
            [d]: [...existing, {
              id: Date.now().toString(),
              time: block.time || '08:00',
              endTime: block.endTime || '09:00',
              title: block.title || '',
              description: block.description || '',
              category: block.category || 'personal',
              priority: block.priority || 'medium',
              recurring: block.recurring || false,
              done: false,
            }].sort((a, b) => a.time.localeCompare(b.time))
          }
        };
      }),

      updateBlock: (date, id, updates) => set(s => ({
        blocks: {
          ...s.blocks,
          [date]: (s.blocks[date] || []).map(b => b.id === id ? { ...b, ...updates } : b)
        }
      })),

      deleteBlock: (date, id) => set(s => ({
        blocks: {
          ...s.blocks,
          [date]: (s.blocks[date] || []).filter(b => b.id !== id)
        }
      })),

      toggleBlock: (date, id) => set(s => ({
        blocks: {
          ...s.blocks,
          [date]: (s.blocks[date] || []).map(b => b.id === id ? { ...b, done: !b.done } : b)
        }
      })),

      reorderBlocks: (date, newOrder) => set(s => ({
        blocks: { ...s.blocks, [date]: newOrder }
      })),

      getBlocksForDate: (date) => {
        return get().blocks[date || today()] || [];
      },

      getTodayBlocks: () => get().blocks[today()] || [],
    }),
    { name: 'lifeos-planner' }
  )
);
