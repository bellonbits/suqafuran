"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, ShoppingCart, MessageCircle, User, Store } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';
import api from '../../services/api';

const baseNavItems = [
  { href: '/shops', label: 'Home', icon: Home },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/checkout', label: 'Cart', icon: ShoppingCart },
  { href: '/messages', label: 'Chat', icon: MessageCircle },
  { href: '/account', label: 'Profile', icon: User },
];

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [navItems, setNavItems] = useState(baseNavItems);
  const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);

  // Fetch seller status when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchSellerStatus = async () => {
        try {
          const response = await api.get('/sellers/check', {
            params: { user_id: String(user.id) }
          });
          setIsVerifiedSeller(response.data?.is_seller === true);
        } catch (error) {
          setIsVerifiedSeller(false);
        }
      };
      fetchSellerStatus();
    } else {
      setIsVerifiedSeller(false);
    }
  }, [isAuthenticated, user?.id]);

  // Update nav items when seller status changes
  useEffect(() => {
    if (isVerifiedSeller && isAuthenticated) {
      setNavItems([
        { href: '/shops', label: 'Home', icon: Home },
        { href: '/favorites', label: 'Favorites', icon: Heart },
        { href: '/seller-dashboard', label: 'Seller', icon: Store },
        { href: '/messages', label: 'Chat', icon: MessageCircle },
        { href: '/account', label: 'Profile', icon: User },
      ]);
    } else {
      setNavItems(baseNavItems);
    }
  }, [isVerifiedSeller, isAuthenticated]);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 sm:hidden z-40">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg px-2 py-3 border border-orange-200 dark:border-orange-900/40">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 transition-all relative group ${
                  active
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6 mb-1.5 transition-transform group-hover:scale-110" />
                <span className="text-xs font-semibold tracking-tight">{item.label}</span>

                {/* Active indicator underline */}
                {active && (
                  <div className="absolute -bottom-1.5 left-2 right-2 h-0.5 bg-orange-600 dark:bg-orange-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
