"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Search, Grid3x3, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';

export const BottomNav: React.FC = () => {
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { href: '/home', icon: Home, label: 'Home', path: '/home' },
        { href: '/checkout', icon: ShoppingCart, label: 'Cart', path: '/checkout' },
        { href: '/search', icon: Search, label: 'Search', path: '/search' },
        { href: '/', icon: Grid3x3, label: 'Categories', path: '/categories' },
        { href: '/account', icon: User, label: 'Profile', path: '/account' },
    ];

    const linkClasses = (active: boolean) =>
        `flex flex-col items-center justify-center gap-1.5 flex-1 px-2 py-3 transition-all duration-200 ${
            active
                ? 'text-[#6cd4ff]'
                : 'text-gray-500 dark:text-slate-400'
        } hover:text-[#6cd4ff] dark:hover:text-[#6cd4ff]`;

    const iconClasses = (active: boolean) =>
        `h-6 w-6 transition-all ${active ? 'scale-110' : 'scale-100'}`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-sm safe-area-inset-bottom">
            <div className="flex items-center justify-around h-20 max-w-md mx-auto px-0">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={linkClasses(active)}
                        >
                            <Icon className={iconClasses(active)} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
