import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home, Package, MessageSquare, Store, User, Plus
} from 'lucide-react';
import { DashboardShell, type NavSection, type NavItem } from '../components/dashboard/DashboardShell';
import { sellerDashboardService } from '../services/sellerDashboardService';

export const SellerDashboardLayout: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['seller-dashboard-stats'],
    queryFn: sellerDashboardService.getDashboardStats,
    staleTime: 30_000,
  });

  const unreadMessages = stats?.unread_messages || 0;
  const activeProducts = stats?.active_products || 0;

  const sections: NavSection[] = [
    {
      title: 'Seller Menu',
      items: [
        { id: 'home', label: 'Home', path: '/seller-dashboard', icon: Home },
        {
          id: 'products',
          label: 'My Products',
          path: '/seller-dashboard/products',
          icon: Package,
          badge: activeProducts > 0 ? activeProducts : null,
          badgeTone: 'blue',
        },
        {
          id: 'messages',
          label: 'Messages',
          path: '/seller-dashboard/messages',
          icon: MessageSquare,
          badge: unreadMessages > 0 ? unreadMessages : null,
          badgeTone: 'amber',
        },
        { id: 'shop', label: 'My Shop', path: '/seller-dashboard/shop', icon: Store },
        { id: 'settings', label: 'My Account', path: '/seller-dashboard/settings', icon: User },
      ],
    },
  ];

  const mobileBottomNavItems: NavItem[] = [
    { id: 'home', label: 'Home', path: '/seller-dashboard', icon: Home },
    { id: 'products', label: 'Products', path: '/seller-dashboard/products', icon: Package },
    { id: 'new', label: 'Post', path: '/seller-dashboard/products/new', icon: Plus },
    { id: 'messages', label: 'Messages', path: '/seller-dashboard/messages', icon: MessageSquare, badge: unreadMessages },
    { id: 'shop', label: 'Shop', path: '/seller-dashboard/shop', icon: Store },
  ];

  return (
    <DashboardShell
      sections={sections}
      brandTitle="Suqafuran"
      brandSubtitle="Seller Center"
      showMobileBottomNav={true}
      mobileBottomNavItems={mobileBottomNavItems}
      actions={
        <Link
          to="/seller-dashboard/products/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Product</span>
        </Link>
      }
    >
      <Outlet />
    </DashboardShell>
  );
};

export default SellerDashboardLayout;
