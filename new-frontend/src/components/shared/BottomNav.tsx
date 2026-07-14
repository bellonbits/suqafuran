"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Search, ShoppingBag, User, Leaf } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';

export const BottomNav: React.FC = () => {
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { href: '/home', icon: Home, label: 'Home', path: '/home' },
        { href: '/checkout', icon: ShoppingCart, label: 'Cart', path: '/checkout' },
        { href: '/sell', icon: Leaf, label: 'Sell', path: '/sell', isCentered: true },
        { href: '/search', icon: Search, label: 'Search', path: '/search' },
        { href: '/account', icon: User, label: 'Account', path: '/account' },
    ];

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden safe-area-inset-bottom">
            <div className="flex items-center justify-center gap-6 px-8 py-4 bg-white dark:bg-slate-800 rounded-full shadow-lg">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    if (item.isCentered) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center gap-1 transition-all duration-200 transform hover:scale-110"
                            >
                                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-md">
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                {active && <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>}
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center gap-1.5 transition-all duration-200 hover:scale-110"
                        >
                            <Icon className={`w-6 h-6 transition-colors ${
                                active
                                    ? 'text-gray-800 dark:text-white'
                                    : 'text-gray-400 dark:text-gray-500'
                            }`} />
                            {active && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
