import { create } from 'zustand';

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addToCart: (item: { id: number; name: string; price: number }) => void;
    removeFromCart: (id: number) => void;
    clearCart: () => void;
    getCartCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    addToCart: (item) => set((state) => {
        const existing = state.items.find(i => i.id === item.id);
        if (existing) {
            return {
                items: state.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
            };
        }
        return {
            items: [...state.items, { ...item, quantity: 1 }]
        };
    }),
    removeFromCart: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
    })),
    clearCart: () => set({ items: [] }),
    getCartCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
    }
}));
