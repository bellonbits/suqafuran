'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Zap, Search, Bell } from 'lucide-react';

export const MarketplaceMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: '/offers', icon: ShoppingBag, label: 'My Offers', description: 'Manage offers' },
    { href: '/price-alerts', icon: Zap, label: 'Price Alerts', description: 'Watch prices' },
    { href: '/saved-searches', icon: Search, label: 'Saved Searches', description: 'Save queries' },
    { href: '/settings/notifications', icon: Bell, label: 'Notifications', description: 'Email settings' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <ShoppingBag className="w-5 h-5" />
        <span className="text-sm font-medium">Marketplace</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0"
              >
                <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
