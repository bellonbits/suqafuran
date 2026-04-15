import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nativeStorage } from './nativeStorage';
import type { User } from '../types/auth';
export type { User };

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
            // Use native NSUserDefaults/SharedPreferences on device,
            // localStorage on web — so the session survives app restarts.
            storage: createJSONStorage(() => nativeStorage),
        }
    )
);
