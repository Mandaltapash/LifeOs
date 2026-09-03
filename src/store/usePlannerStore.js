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

      addBlockToMultipleDates: (dates, block) => set(s => {
        if (!dates || !dates.length) return {};
        const newBlocks = { ...s.blocks };
        dates.forEach(d => {
          const existing = newBlocks[d] || [];
          newBlocks[d] = [...existing, {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            time: block.time || '08:00',
            endTime: block.endTime || '09:00',
            title: block.title || '',
            description: block.description || '',
            category: block.category || 'personal',
            priority: block.priority || 'medium',
            recurring: block.recurring || false,
            done: false,
          }].sort((a, b) => a.time.localeCompare(b.time));
        });
        return { blocks: newBlocks };
      }),

      copyBlockToDates: (sourceDate, blockId, targetDates) => set(s => {
        const sourceList = s.blocks[sourceDate] || [];
        const sourceBlock = sourceList.find(b => b.id === blockId);
        if (!sourceBlock || !targetDates || !targetDates.length) return {};

        const newBlocks = { ...s.blocks };
        targetDates.forEach(d => {
          const existing = newBlocks[d] || [];
          newBlocks[d] = [...existing, {
            ...sourceBlock,
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            done: false,
          }].sort((a, b) => a.time.localeCompare(b.time));
        });
        return { blocks: newBlocks };
      }),

      copyDayBlocks: (sourceDate, targetDates, overwrite = false) => set(s => {
        const sourceList = s.blocks[sourceDate] || [];
        if (!sourceList.length || !targetDates || !targetDates.length) return {};

        const newBlocks = { ...s.blocks };
        targetDates.forEach(d => {
          const cloned = sourceList.map(b => ({
            ...b,
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            done: false,
          }));

          if (overwrite) {
            newBlocks[d] = [...cloned].sort((a, b) => a.time.localeCompare(b.time));
          } else {
            const existing = newBlocks[d] || [];
            newBlocks[d] = [...existing, ...cloned].sort((a, b) => a.time.localeCompare(b.time));
          }
        });
        return { blocks: newBlocks };
      }),

      getBlocksForDate: (date) => {
        return get().blocks[date || today()] || [];
      },

      getTodayBlocks: () => get().blocks[today()] || [],
    }),
    { name: 'lifeos-planner' }
  )
);
