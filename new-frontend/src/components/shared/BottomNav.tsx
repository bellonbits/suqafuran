"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, PlusCircle, MessageCircleMore, CircleUser } from 'lucide-react';
import { useT } from '../../lib/i18n';

export const BottomNav: React.FC = () => {
    const pathname = usePathname();
    const t = useT();

    const isActive = (path: string) => {
        if (path === '/shops') {
            return pathname === '/' || pathname === '/shops' || pathname.startsWith('/shops/') || pathname.startsWith('/home');
        }
        return pathname === path || pathname.startsWith(path + '/');
    };

    const navItems = [
        { href: '/shops', icon: Home, label: 'Home', path: '/shops' },
        { href: '/favorites', icon: Heart, label: 'Favorites', path: '/favorites' },
        { href: '/sell', icon: PlusCircle, label: 'Sell', path: '/sell' },
        { href: '/messages', icon: MessageCircleMore, label: 'Chat', path: '/messages' },
        { href: '/account', icon: CircleUser, label: 'Profile', path: '/account' },
    ];

    return (
        <nav 
            className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]"
            style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.04)' }}
        >
            <div className="flex items-stretch h-[60px] px-1 justify-around">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex-1 flex flex-col items-center justify-center gap-1 relative active:scale-95 transition-transform"
                        >
                            <Icon className={`w-6 h-6 transition-colors duration-200 ${
                                active
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-400'
                            }`} />
                            <span className={`text-[10px] tracking-wide transition-colors duration-200 ${
                                active
                                    ? 'text-orange-600 dark:text-orange-400 font-bold'
                                    : 'text-gray-400 dark:text-zinc-500 font-semibold hover:text-gray-600 dark:hover:text-gray-400'
                            }`}>
                                {t(item.label)}
                            </span>

                            {/* Active indicator underline */}
                            {active && (
                                <div className="absolute bottom-0 w-8 h-[2.5px] bg-orange-600 dark:bg-orange-400 rounded-t-full animate-scale-in" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

