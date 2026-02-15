import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            token: null,
            login: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
            setUser: (user) => set({ user }),
            updateUser: (updatedFields) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updatedFields } : null
                })),
        }),
        {
            name: 'suqafuran-auth',
        }
    )
);
