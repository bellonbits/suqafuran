"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Search, PlusCircle, ShoppingBag, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';

export const BottomNav: React.FC = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const dashboardTab = pathname === '/dashboard' ? (searchParams.get('tab') || 'overview') : null;

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const linkClasses = (active: boolean) =>
        `flex flex-col items-center justify-center gap-1 flex-1 text-center py-2 transition-all ${
            active
                ? 'text-primary dark:text-sky-400 font-bold scale-105'
                : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'
        }`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md bottom-nav-safe flex items-center justify-around md:hidden dark:border-slate-800 dark:bg-slate-900/95">
            {/* Home */}
            <Link href="/home" className={linkClasses(isActive('/home'))}>
                <Home className="h-5 w-5" />
                <span className="text-[10px]">Home</span>
            </Link>


            {/* Categories / Search */}
            <Link href="/search" className={linkClasses(isActive('/search'))}>
                <Search className="h-5 w-5" />
                <span className="text-[10px]">Explore</span>
            </Link>

            {/* Sell (Centered Callout) */}
            {isAuthenticated ? (
                <Link
                    href="/dashboard?tab=products"
                    className="flex flex-col items-center justify-center -translate-y-4 relative z-10 scale-110 active:scale-95"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 dark:bg-sky-500">
                        <PlusCircle className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300 mt-1">Sell</span>
                </Link>
            ) : (
                <button
                    onClick={() => openAuthModal('signin')}
                    className="flex flex-col items-center justify-center -translate-y-4 relative z-10 scale-110 active:scale-95 cursor-pointer"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 dark:bg-sky-500">
                        <PlusCircle className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300 mt-1">Sell</span>
                </button>
            )}

            {/* Orders */}
            {isAuthenticated ? (
                <Link href="/dashboard?tab=orders" className={linkClasses(dashboardTab === 'orders')}>
                    <ShoppingBag className="h-5 w-5" />
                    <span className="text-[10px]">Orders</span>
                </Link>
            ) : (
                <button onClick={() => openAuthModal('signin')} className={linkClasses(false) + ' cursor-pointer'}>
                    <ShoppingBag className="h-5 w-5" />
                    <span className="text-[10px]">Orders</span>
                </button>
            )}

            {/* Profile */}
            {isAuthenticated ? (
                <Link href="/dashboard" className={linkClasses(dashboardTab === 'overview')}>
                    <User className="h-5 w-5" />
                    <span className="text-[10px]">Profile</span>
                </Link>
            ) : (
                <button onClick={() => openAuthModal('signin')} className={linkClasses(false) + ' cursor-pointer'}>
                    <User className="h-5 w-5" />
                    <span className="text-[10px]">Profile</span>
                </button>
            )}
        </nav>
    );
};
