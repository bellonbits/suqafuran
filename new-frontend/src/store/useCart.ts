import { create } from 'zustand';

interface CartItem {
    id: number;
    name: string;
    price: number;
    currency: string;
    image?: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addToCart: (item: { id: number; name: string; price: number; currency: string; image?: string }) => void;
    removeFromCart: (id: number) => void;
    setQuantity: (id: number, quantity: number) => void;
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
    setQuantity: (id, quantity) => set((state) => ({
        items: quantity <= 0
            ? state.items.filter(i => i.id !== id)
            : state.items.map(i => i.id === id ? { ...i, quantity } : i)
    })),
    clearCart: () => set({ items: [] }),
    getCartCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
    }
}));
