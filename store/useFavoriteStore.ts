import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteItem {
  id: string | number;
  name: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  slug?: string | null;
}

interface FavoriteStore {
  items: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string | number) => void;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set) => ({
      items: [],

      toggleFavorite: (item) => set((state) => {
        const exists = state.items.some((i) => i.id === item.id);
        if (exists) {
          return { items: state.items.filter((i) => i.id !== item.id) };
        }
        return { items: [...state.items, item] };
      }),

      removeFavorite: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),

      clearFavorites: () => set({ items: [] }),
    }),
    {
      name: 'bantu-favorites', // key in localStorage
    }
  )
);
