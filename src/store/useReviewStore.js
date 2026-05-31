import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const useReviewStore = create(
  persist(
    (set, get) => ({
      reviews: [],

      saveReview: (review) => set(s => {
        const existing = s.reviews.find(r => r.date === today());
        if (existing) {
          return { reviews: s.reviews.map(r => r.date === today() ? { ...r, ...review } : r) };
        }
        return {
          reviews: [...s.reviews, {
            date: today(),
            completed: review.completed || '',
            missed: review.missed || '',
            improvements: review.improvements || '',
            priorities: review.priorities || ['', '', ''],
            mood: review.mood || 3,
            createdAt: new Date().toISOString(),
          }]
        };
      }),

      getTodayReview: () => get().reviews.find(r => r.date === today()),

      getRecentReviews: (n = 7) => {
        return get().reviews
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, n);
      },
    }),
    { name: 'lifeos-reviews' }
  )
);
