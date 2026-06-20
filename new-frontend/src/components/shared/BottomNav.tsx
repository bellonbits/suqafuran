"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, ShoppingBag, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';

export const BottomNav: React.FC = () => {
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const linkClasses = (path: string) => 
        `flex flex-col items-center justify-center gap-1 flex-1 text-center py-2 transition-all ${
            isActive(path) 
                ? 'text-primary dark:text-sky-400 font-bold scale-105' 
                : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'
        }`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md bottom-nav-safe flex items-center justify-around md:hidden dark:border-slate-800 dark:bg-slate-900/95">
            {/* Home */}
            <Link href="/" className={linkClasses('/')}>
                <Home className="h-5 w-5" />
                <span className="text-[10px]">Home</span>
            </Link>

            {/* Categories / Search */}
            <Link href="/search" className={linkClasses('/search')}>
                <Search className="h-5 w-5" />
                <span className="text-[10px]">Explore</span>
            </Link>

            {/* Sell (Centered Callout) */}
            <Link 
                href="/dashboard/products" 
                className="flex flex-col items-center justify-center -translate-y-4 relative z-10 scale-110 active:scale-95"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 dark:bg-sky-500">
                    <PlusCircle className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300 mt-1">Sell</span>
            </Link>

            {/* Orders */}
            <Link href="/dashboard/orders" className={linkClasses('/dashboard/orders')}>
                <ShoppingBag className="h-5 w-5" />
                <span className="text-[10px]">Orders</span>
            </Link>

            {/* Profile */}
            <Link href={isAuthenticated ? '/dashboard' : '/login'} className={linkClasses(isAuthenticated ? '/dashboard' : '/login')}>
                <User className="h-5 w-5" />
                <span className="text-[10px]">Profile</span>
            </Link>
        </nav>
    );
};
