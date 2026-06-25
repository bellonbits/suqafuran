"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';
import { useSidebarStore } from '../../store/useSidebar';
import { listingsService } from '../../services/listings';
import { getCategoryIcon } from '../../lib/categoryIcons';
import { useLocalizedField } from '../../lib/i18n';
import type { Category } from '../../types';

export const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const collapsed = useSidebarStore((s) => s.collapsed);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        listingsService.getCategories()
            .then(data => setCategories(data || []))
            .catch(() => setCategories([]));
    }, []);

    const field = useLocalizedField();

    const menuItems = categories.map(cat => ({
        name: field(cat.name_en, cat.name_so).split(' (')[0],
        path: `/${cat.slug}`,
        icon: getCategoryIcon(cat.slug),
    }));

    // Admin, agent, and seller dashboards are full-focus workspaces — the
    // marketplace browsing sidebar competes for attention there, so hide it.
    const isWorkspaceRoute = pathname.startsWith('/admin') || pathname.startsWith('/agent') || pathname.startsWith('/dashboard');
    if (isWorkspaceRoute) return null;

    return (
        <aside className={`${collapsed ? 'w-16' : 'w-60'} border-r border-gray-100 bg-white hidden md:flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 dark:border-slate-800 dark:bg-slate-900 overflow-y-auto shrink-0 pb-6 scrollbar-thin scrollbar-thumb-gray-200 transition-all duration-200`}>
            <div className="py-4 space-y-1">
                {menuItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = item.path === '/'
                        ? pathname === '/'
                        : pathname === item.path;

                    return (
                        <Link
                            key={idx}
                            href={item.path}
                            title={collapsed ? item.name : undefined}
                            className={`flex items-center text-xs font-bold transition-all relative ${
                                collapsed ? 'justify-center px-2 py-3' : 'gap-3.5 px-6 py-3.5'
                            } ${
                                isActive
                                    ? 'text-primary bg-sky-50/50 dark:bg-sky-500/10 dark:text-sky-400 font-extrabold'
                                    : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary dark:bg-sky-500" />
                            )}
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </div>

            {!isAuthenticated && (
                <div className={`${collapsed ? 'px-2' : 'px-6'} pt-4 border-t border-gray-100 dark:border-slate-800`}>
                    <button
                        onClick={() => openAuthModal('signin')}
                        title={collapsed ? 'Sign up or Login' : undefined}
                        className={`flex items-center text-xs font-extrabold text-gray-700 hover:text-primary dark:text-slate-200 dark:hover:text-sky-400 cursor-pointer ${collapsed ? 'justify-center w-full' : 'gap-3'}`}
                    >
                        <LogIn className="h-4.5 w-4.5 shrink-0" />
                        {!collapsed && <span>Sign up or Login</span>}
                    </button>
                </div>
            )}
        </aside>
    );
};
