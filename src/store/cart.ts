import type { CartItemType } from '#/lib/types'
import { create } from 'zustand'

interface CartStore {
  items: CartItemType[]
  addItem: (item: CartItemType) => void
  removeItem: (id: string, material: string, color?: string) => void
  updateQty: (
    id: string,
    material: string,
    color: string | undefined,
    qty: number,
  ) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) =>
          i.id === item.id &&
          i.material === item.material &&
          i.color === item.color,
      )
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id &&
            i.material === item.material &&
            i.color === item.color
              ? { ...i, qty: i.qty + item.qty }
              : i,
          ),
        }
      }
      return { items: [...state.items, item] }
    }),

  removeItem: (id, material, color) =>
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.id === id && i.material === material && i.color === color),
      ),
    })),

  updateQty: (id, material, color, qty) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id && i.material === material && i.color === color
          ? { ...i, qty }
          : i,
      ),
    })),

  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
  totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}))
