import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';
import { resetAnalytics } from '../lib/analytics';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isHydrated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
    setHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isHydrated: false,
            login: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => {
                const current = useAuthStore.getState();
                if (!current.isAuthenticated && !current.token) {
                    return; // Already logged out, prevent redundant or recursive cleanup
                }
                resetAnalytics();
                // Clear state immediately so subsequent interceptor checks see not authenticated
                set({ user: null, token: null, isAuthenticated: false });
                try {
                    import('../services/push-notifications').then(({ pushNotificationsService }) => {
                        pushNotificationsService.unregisterDeviceToken();
                    }).catch(() => {});
                } catch {}
            },
            setUser: (user) => set({ user }),
            setHydrated: (state) => set({ isHydrated: state }),
        }),
        {
            name: 'suqafuran-auth-redesign',
            storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
            })),
            onRehydrateStorage: () => (state) => {
                if (state) state.setHydrated(true);
            },
        }
    )
);
