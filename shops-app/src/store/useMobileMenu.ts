import { create } from 'zustand';

interface MobileMenuState {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    setOpen: (open: boolean) => void;
}

export const useMobileMenuStore = create<MobileMenuState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    setOpen: (isOpen) => set({ isOpen }),
}));

