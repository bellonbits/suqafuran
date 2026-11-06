import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  title: string;
  title_en?: string;
  price: number;
  image?: string;
  images?: string[];
  quantity: number;
  seller_id?: string;
  owner_id?: string | number;
  shop_id?: string | number;
  shop_name?: string;
  seller_name?: string;
  owner?: {
    id?: string | number;
    full_name?: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
    business_name?: string;
  };
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  clearSellerItems: (sellerId: string) => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        set((state) => {
          const existing = state.items.find((i) => String(i.id) === String(item.id));
          if (existing) {
            return {
              items: state.items.map((i) =>
                String(i.id) === String(item.id)
                  ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => String(i.id) !== String(productId)) };
          }
          return {
            items: state.items.map((i) =>
              String(i.id) === String(productId) ? { ...i, quantity } : i
            ),
          };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => String(i.id) !== String(productId)),
        }));
      },

      clearSellerItems: (sellerId: string) => {
        set((state) => ({
          items: state.items.filter((i) => {
            const sid = String(i.seller_id || i.owner_id || i.owner?.id || '');
            return sid !== String(sellerId);
          }),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalCount: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      },

      getTotalPrice: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      },
    }),
    {
      name: 'suqafuran_cart_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
