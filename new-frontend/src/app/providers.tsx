"use client";

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuth';
import { useFavoritesStore } from '../store/useFavorites';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
                refetchOnWindowFocus: false,
                retry: false
            }
        }
    }));

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);

    useEffect(() => {
        if (isHydrated && isAuthenticated) {
            useFavoritesStore.getState().hydrate();
        }
    }, [isHydrated, isAuthenticated]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
