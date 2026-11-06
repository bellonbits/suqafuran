"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Plus, MessageCircleMore, Menu } from 'lucide-react';
import { useT } from '../../lib/i18n';
import { useFavoritesStore } from '../../store/useFavorites';
import { useMobileMenuStore } from '../../store/useMobileMenu';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuth';

export const BottomNav: React.FC = () => {
    const pathname = usePathname();
    const t = useT();
    const favoritesCount = useFavoritesStore((s) => s.ids?.size ?? 0);
    const { isOpen: isMobileMenuOpen, toggle: toggleMobileMenu } = useMobileMenuStore();
    const { isAuthenticated, user } = useAuthStore();
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Live sync unread message badge count
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setUnreadMessages(0);
            return;
        }

        let isMounted = true;
        const fetchUnreadCount = async () => {
            try {
                const res = await api.get('/messages/conversations');
                if (Array.isArray(res.data) && isMounted) {
                    const total = res.data.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
                    setUnreadMessages(total);
                }
            } catch {
                // Ignore transient network errors
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isAuthenticated, user?.id]);

    // Do not show marketplace bottom nav on seller dashboard or admin panel
    if (pathname?.startsWith('/seller-dashboard') || pathname?.startsWith('/admin')) {
        return null;
    }

    const isActive = (path: string) => {
        if (path === '/') {
            return (pathname === '/' || pathname === '/shops') && !isMobileMenuOpen;
        }
        return (pathname === path || pathname.startsWith(path + '/')) && !isMobileMenuOpen;
    };

    return (
        <nav 
            className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white dark:bg-neutral-950 border-t border-gray-100 dark:border-neutral-800 pb-[env(safe-area-inset-bottom)]"
            style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.04)' }}
        >
            <div className="flex items-stretch h-[60px] px-1 justify-around">
                {/* 1. Home */}
                <Link
                    href="/"
                    className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 relative active:scale-95 transition-transform"
                >
                    <Home className={`w-5 h-5 transition-colors duration-200 ${
                        isActive('/')
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-400'
                    }`} />
                    <span className={`max-w-full truncate whitespace-nowrap leading-none tracking-tight text-[10px] transition-colors duration-200 ${
                        isActive('/')
                            ? 'text-orange-600 dark:text-orange-400 font-bold'
                            : 'text-gray-400 dark:text-zinc-500 font-semibold'
                    }`}>
                        {t('Home')}
                    </span>
                    {isActive('/') && (
                        <div className="absolute bottom-0 w-8 h-[2.5px] bg-orange-600 dark:bg-orange-400 rounded-t-full" />
                    )}
                </Link>

                {/* 2. Favorites */}
                <Link
                    href="/favorites"
                    className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 relative active:scale-95 transition-transform"
                >
                    <div className="relative">
                        <Heart className={`w-5 h-5 transition-colors duration-200 ${
                            isActive('/favorites')
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-400'
                        }`} />
                        {favoritesCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center">
                                {favoritesCount > 99 ? '99+' : favoritesCount}
                            </span>
                        )}
                    </div>
                    <span className={`max-w-full truncate whitespace-nowrap leading-none tracking-tight text-[10px] transition-colors duration-200 ${
                        isActive('/favorites')
                            ? 'text-orange-600 dark:text-orange-400 font-bold'
                            : 'text-gray-400 dark:text-zinc-500 font-semibold'
                    }`}>
                        {t('Favorites')}
                    </span>
                    {isActive('/favorites') && (
                        <div className="absolute bottom-0 w-8 h-[2.5px] bg-orange-600 dark:bg-orange-400 rounded-t-full" />
                    )}
                </Link>

                {/* 3. Sell (Elevated pill / button) */}
                <Link
                    href="/seller-dashboard/products/add"
                    className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 relative active:scale-95 transition-transform"
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 -mt-2">
                        <Plus className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 leading-none">
                        {t('Sell')}
                    </span>
                </Link>

                {/* 4. Chat / Messages */}
                <Link
                    href="/messages"
                    className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 relative active:scale-95 transition-transform"
                >
                    <div className="relative">
                        <MessageCircleMore className={`w-5 h-5 transition-colors duration-200 ${
                            isActive('/messages')
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-400'
                        }`} />
                        {unreadMessages > 0 && (
                            <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center">
                                {unreadMessages > 99 ? '99+' : unreadMessages}
                            </span>
                        )}
                    </div>
                    <span className={`max-w-full truncate whitespace-nowrap leading-none tracking-tight text-[10px] transition-colors duration-200 ${
                        isActive('/messages')
                            ? 'text-orange-600 dark:text-orange-400 font-bold'
                            : 'text-gray-400 dark:text-zinc-500 font-semibold'
                    }`}>
                        {t('Chat')}
                    </span>
                    {isActive('/messages') && (
                        <div className="absolute bottom-0 w-8 h-[2.5px] bg-orange-600 dark:bg-orange-400 rounded-t-full" />
                    )}
                </Link>

                {/* 5. Menu Drawer Trigger */}
                <button
                    type="button"
                    onClick={toggleMobileMenu}
                    className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 relative active:scale-95 transition-transform"
                    aria-label="Open Menu"
                >
                    <Menu className={`w-5 h-5 transition-colors duration-200 ${
                        isMobileMenuOpen
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-400'
                    }`} />
                    <span className={`max-w-full truncate whitespace-nowrap leading-none tracking-tight text-[10px] transition-colors duration-200 ${
                        isMobileMenuOpen
                            ? 'text-orange-600 dark:text-orange-400 font-bold'
                            : 'text-gray-400 dark:text-zinc-500 font-semibold'
                    }`}>
                        {t('Menu')}
                    </span>
                    {isMobileMenuOpen && (
                        <div className="absolute bottom-0 w-8 h-[2.5px] bg-orange-600 dark:bg-orange-400 rounded-t-full" />
                    )}
                </button>
            </div>
        </nav>
    );
};
