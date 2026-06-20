"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Home, ShoppingBag, Store, Tag, Wine, ShoppingCart, Clock, 
    Shirt, Smartphone, Sparkles, Gift, Heart, Trophy, Leaf, 
    PawPrint, HeartPulse, LogIn 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';

export const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();

    const menuItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Grocery', path: '/grocery', icon: ShoppingBag },
        { name: 'Retail', path: '/retail', icon: Store },
        { name: 'Deals', path: '/deals', icon: Tag },
        { name: 'Alcohol', path: '/alcohol', icon: Wine },
        { name: 'SuqaMart', path: '/suqamart', icon: ShoppingCart },
        { name: 'Convenience', path: '/convenience', icon: Clock },
        { name: 'Flowers', path: '/flowers', icon: Sparkles },
        { name: 'Apparel', path: '/apparel', icon: Shirt },
        { name: 'Electronics', path: '/electronics', icon: Smartphone },
        { name: 'Party', path: '/party', icon: Sparkles },
        { name: 'Gifts', path: '/gifts', icon: Gift },
        { name: 'Beauty', path: '/beauty', icon: Heart },
        { name: 'Sports', path: '/sports', icon: Trophy },
        { name: 'CBD/THC', path: '/cbd', icon: Leaf },
        { name: 'Pets', path: '/pets', icon: PawPrint },
        { name: 'Health', path: '/health', icon: HeartPulse },
        { name: 'Home Goods', path: '/home-goods', icon: Home },
        { name: 'Gift Cards', path: '/gift-cards', icon: Gift },
    ];

    return (
        <aside className="w-60 border-r border-gray-100 bg-white hidden md:flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 dark:border-slate-800 dark:bg-slate-900 overflow-y-auto shrink-0 pb-6 scrollbar-thin scrollbar-thumb-gray-200">
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
                            className={`flex items-center gap-3.5 px-6 py-3.5 text-xs font-bold transition-all relative ${
                                isActive 
                                    ? 'text-primary bg-sky-50/50 dark:bg-sky-500/10 dark:text-sky-400 font-extrabold' 
                                    : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary dark:bg-sky-500" />
                            )}
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </div>

            {!isAuthenticated && (
                <div className="px-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <Link
                        href="/login"
                        className="flex items-center gap-3 text-xs font-extrabold text-gray-700 hover:text-primary dark:text-slate-200 dark:hover:text-sky-400"
                    >
                        <LogIn className="h-4.5 w-4.5" />
                        <span>Sign up or Login</span>
                    </Link>
                </div>
            )}
        </aside>
    );
};
