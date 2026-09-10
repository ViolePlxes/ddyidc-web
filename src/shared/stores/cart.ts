import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderDraft } from "../api/console";

export interface CartItem extends OrderDraft {
  cartId: string;
}

interface CartState {
  items: CartItem[];
  add: (draft: OrderDraft) => void;
  remove: (cartId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (draft) =>
        set((state) => ({
          items: [
            ...state.items,
            { ...draft, cartId: `${draft.productId}-${Date.now()}` },
          ],
        })),
      remove: (cartId) =>
        set((state) => ({ items: state.items.filter((item) => item.cartId !== cartId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "ddyidc_cart" },
  ),
);
