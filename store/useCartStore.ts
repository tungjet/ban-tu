import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  quantity: number;
}

interface CartStore {
  isOpen: boolean;
  items: CartItem[];
  toggleCart: (open?: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      isOpen: false,
      items: [],

      toggleCart: (open) => set((state) => ({
        isOpen: open !== undefined ? open : !state.isOpen,
      })),

      addItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id);

        if (existingItem) {
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }

        return {
          items: [...state.items, { ...item, quantity: 1 }],
        };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: quantity < 1
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) =>
              i.id === id ? { ...i, quantity } : i
            ),
      })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'bantu-cart', // key trong localStorage
      partialize: (state) => ({ items: state.items }), // chỉ persist items, không persist isOpen
    }
  )
);
