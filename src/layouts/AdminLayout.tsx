import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, Store, ShoppingBag, FolderTree,
  ShieldCheck, ShieldAlert, Flag, CreditCard, Receipt,
  Zap, Megaphone, BarChart3, Bell, Settings, ExternalLink
} from 'lucide-react';
import { DashboardShell, type NavSection } from '../components/dashboard/DashboardShell';
import { adminService } from '../services/adminService';

export const AdminLayout: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats-summary'],
    queryFn: adminService.getStats,
    staleTime: 60_000,
  });

  const pendingVerifs = (stats as any)?.pending_verifications || 0;
  const pendingReports = (stats as any)?.reported_listings || 0;

  const sections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { id: 'overview', label: 'Overview', path: '/admin-dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', path: '/admin-dashboard/analytics', icon: BarChart3 },
        { id: 'notifications', label: 'Notifications', path: '/admin-dashboard/notifications', icon: Bell },
      ],
    },
    {
      title: 'Marketplace',
      items: [
        { id: 'listings', label: 'Listings', path: '/admin-dashboard/listings', icon: ShoppingBag },
        { id: 'categories', label: 'Categories', path: '/admin-dashboard/categories', icon: FolderTree },
        { id: 'sellers', label: 'Sellers & Shops', path: '/admin-dashboard/sellers', icon: Store },
        { id: 'users', label: 'Users', path: '/admin-dashboard/users', icon: Users },
      ],
    },
    {
      title: 'Trust & Safety',
      items: [
        {
          id: 'verifications',
          label: 'Verifications',
          path: '/admin-dashboard/verifications',
          icon: ShieldCheck,
          badge: pendingVerifs > 0 ? pendingVerifs : null,
          badgeTone: 'amber',
        },
        {
          id: 'moderation',
          label: 'Fraud Moderation',
          path: '/admin-dashboard/fraud-moderation',
          icon: ShieldAlert,
        },
        {
          id: 'reports',
          label: 'Reports & Flags',
          path: '/admin-dashboard/reports',
          icon: Flag,
          badge: pendingReports > 0 ? pendingReports : null,
          badgeTone: 'rose',
        },
      ],
    },
    {
      title: 'Revenue & Growth',
      items: [
        { id: 'promotions', label: 'Promotions & Boosts', path: '/admin-dashboard/promotions', icon: Zap },
        { id: 'vouchers', label: 'Vouchers & Discounts', path: '/admin-dashboard/vouchers', icon: Receipt },
        { id: 'marketing', label: 'Marketing Automation', path: '/admin-dashboard/marketing', icon: Megaphone },
        { id: 'support', label: 'Support & Tickets', path: '/admin-dashboard/support', icon: Settings },
      ],
    },
  ];

  return (
    <DashboardShell
      sections={sections}
      brandTitle="Suqafuran"
      brandSubtitle="Admin Console"
      actions={
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">View Marketplace</span>
        </Link>
      }
    >
      <Outlet />
    </DashboardShell>
  );
};

export default AdminLayout;
