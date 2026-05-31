import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNotesStore = create(
  persist(
    (set, get) => ({
      notes: [],
      activeCategory: 'all',

      addNote: (note) => set(s => ({
        notes: [
          {
            id: Date.now().toString(),
            title: note.title || 'Untitled',
            content: note.content || '',
            category: note.category || 'personal',
            tags: note.tags || [],
            pinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...s.notes,
        ]
      })),

      updateNote: (id, updates) => set(s => ({
        notes: s.notes.map(n =>
          n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
        )
      })),

      deleteNote: (id) => set(s => ({
        notes: s.notes.filter(n => n.id !== id)
      })),

      togglePin: (id) => set(s => ({
        notes: s.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)
      })),

      setActiveCategory: (cat) => set({ activeCategory: cat }),

      getFilteredNotes: (searchQuery = '', category = 'all') => {
        let notes = get().notes;
        if (category !== 'all') notes = notes.filter(n => n.category === category);
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          notes = notes.filter(n =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags.some(t => t.toLowerCase().includes(q))
          );
        }
        return [
          ...notes.filter(n => n.pinned),
          ...notes.filter(n => !n.pinned),
        ];
      },
    }),
    { name: 'lifeos-notes' }
  )
);
