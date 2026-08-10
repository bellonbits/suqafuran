"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Store } from 'lucide-react';

interface ShopModeToggleProps {
    active: 'products' | 'shops';
}

// Lets a buyer explicitly switch between browsing by product (the homepage)
// and browsing by shop (the full shop directory) -- shown on both pages so
// switching works in either direction.
export function ShopModeToggle({ active }: ShopModeToggleProps) {
    return (
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-full w-max mx-auto">
            <Link
                href="/"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    active === 'products'
                        ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
            >
                <ShoppingBag className="w-4 h-4" />
                Shop by Products
            </Link>
            <Link
                href="/shops"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    active === 'shops'
                        ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
            >
                <Store className="w-4 h-4" />
                Shop by Shops
            </Link>
        </div>
    );
}
