import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderDraft } from "../api/console";
import { redactDraft, restoreDraft } from "../utils/draftPersistence";

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
    {
      name: "ddyidc_cart",
      version: 1,
      partialize: (state) => ({ items: state.items.map(redactDraft) }),
      migrate: (persisted) => persisted as { items: ReturnType<typeof redactDraft<CartItem>>[] },
      merge: (persisted, current) => {
        const saved = persisted as { items?: ReturnType<typeof redactDraft<CartItem>>[] } | undefined;
        return { ...current, items: (saved?.items ?? []).map((item) => restoreDraft<CartItem>(item)) };
      },
      onRehydrateStorage: () => (state) => {
        if (state) queueMicrotask(() => useCartStore.setState({ items: state.items }));
      },
    },
  ),
);
