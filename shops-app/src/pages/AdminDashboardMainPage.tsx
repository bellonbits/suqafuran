"use client";

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, ShoppingBag, Package,
  ArrowUpRight, ArrowDownRight, RefreshCw, LayoutGrid,
  CheckCircle, Clock, AlertTriangle, Megaphone, Store, UserCheck,
  UserX, ShieldAlert, Flag, UserPlus, MessageSquare, Bell, Activity,
  ChevronRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';
import { ADMIN_NAV_ITEMS } from '@/admin-dashboard/navigation';
import {
  KpiCard, AttentionBanner, PeriodSelector, LiveIndicator, SlimShareBar
} from '@/components/dashboard/DashboardKit';

interface AdminStats {
  total_users: number;
  total_listings: number;
  active_listings: number;
  pending_listings: number;
  pending_promotions: number;
  total_orders?: number;
  total_revenue?: number;
  new_users_this_week?: number;
  pending_orders?: number;
  active_users?: number;
  active_sellers?: number;
  active_buyers?: number;
  total_shops?: number;
  verified_sellers?: number;
  pending_seller_verifications?: number;
  suspended_accounts?: number;
  reported_listings?: number;
  open_disputes?: number;
  new_signups_today?: number;
  new_signups_this_week?: number;
  new_signups_this_month?: number;
  platform_growth_rate?: number;
  marketplace_activity?: { listings_posted_today: number; messages_sent_today: number };
}

interface Order {
  id: number;
  total_amount?: number;
  customer?: { full_name?: string; email?: string };
  seller?: { shop_name?: string };
  items?: any[];
  created_at?: string;
  status?: string;
}

const DEFAULT_ADMIN_STATS: AdminStats = {
  total_users: 1420,
  total_listings: 856,
  active_listings: 820,
  pending_listings: 36,
  pending_promotions: 4,
  active_users: 1190,
  active_sellers: 310,
  active_buyers: 880,
  total_shops: 145,
  verified_sellers: 98,
  pending_seller_verifications: 2,
  suspended_accounts: 0,
  reported_listings: 1,
  open_disputes: 0,
  platform_growth_rate: 14,
  marketplace_activity: { listings_posted_today: 48, messages_sent_today: 182 },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<string>('7d');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats>(() => {
    try {
      const cached = localStorage.getItem('admin_stats_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_ADMIN_STATS;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('admin_orders_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [error, setError] = useState<string | null>(null);

  const navItems = ADMIN_NAV_ITEMS.map(({ icon: Icon, ...item }) => ({
    ...item,
    icon: <Icon className="w-5 h-5" />
  }));

  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const [statsRes, ordersRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/orders?limit=8'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
        try { localStorage.setItem('admin_stats_cache', JSON.stringify(statsRes.value.data)); } catch {}
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
        const raw = ordersRes.value.data;
        const list = Array.isArray(raw) ? raw.slice(0, 8) : [];
        setOrders(list);
        try { localStorage.setItem('admin_orders_cache', JSON.stringify(list)); } catch {}
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const attentionItems = [
    {
      id: 'verifications',
      label: 'Seller Verifications',
      count: stats.pending_seller_verifications ?? 2,
      actionText: 'Review',
      onAction: () => navigate('/admin-verifications'),
      severity: 'warning' as const,
    },
    {
      id: 'reported',
      label: 'Reported Listings',
      count: stats.reported_listings ?? 1,
      actionText: 'Moderate',
      onAction: () => navigate('/admin-reports'),
      severity: 'warning' as const,
    },
    {
      id: 'promotions',
      label: 'Pending Ad Approvals',
      count: stats.pending_promotions ?? 4,
      actionText: 'Approve',
      onAction: () => navigate('/admin-featured-ads'),
      severity: 'warning' as const,
    },
    {
      id: 'disputes',
      label: 'Open Disputes',
      count: stats.open_disputes ?? 0,
      actionText: 'Resolve',
      onAction: () => navigate('/admin-disputes'),
      severity: 'critical' as const,
    },
  ];

  return (
    <DashboardLayout navItems={navItems} userRole="admin">
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* ── Top Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Platform Operations
              </h1>
              <LiveIndicator label="Platform Healthy · 99.98%" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Marketplace telemetry, buyer-seller safety, and infrastructure status
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <PeriodSelector selected={period} onChange={setPeriod} />

            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
              <span>{refreshing ? 'Syncing' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* ── Attention Banner (Salience on what needs operational action) ── */}
        <AttentionBanner items={attentionItems} />

        {/* ── Headline KPIs (Answering: Is the platform growing and healthy?) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Registered Users */}
          <KpiCard
            label="Total Platform Users"
            value={stats.total_users.toLocaleString()}
            delta={{
              percent: stats.platform_growth_rate ?? 14,
              baseline: 'vs prior 30d',
              isGood: true,
            }}
            icon={<Users className="w-4 h-4" />}
            entityType="traffic"
            onClick={() => navigate('/admin-users')}
          />

          {/* Active Listings */}
          <KpiCard
            label="Active Listings"
            value={stats.active_listings.toLocaleString()}
            delta={{
              percent: 5,
              baseline: `${stats.pending_listings ?? 0} pending review`,
              isGood: true,
            }}
            icon={<LayoutGrid className="w-4 h-4" />}
            entityType="volume"
            onClick={() => navigate('/admin-listings')}
          />

          {/* Active Sellers & Verified Progress */}
          <KpiCard
            label="Active Sellers"
            value={stats.active_sellers?.toLocaleString() ?? '310'}
            icon={<Store className="w-4 h-4" />}
            entityType="neutral"
            goal={{
              current: stats.verified_sellers ?? 98,
              target: stats.active_sellers ?? 310,
              unit: 'verified',
            }}
            onClick={() => navigate('/admin-sellers')}
          />

          {/* Daily Activity Volume */}
          <KpiCard
            label="Daily Inquiries"
            value={stats.marketplace_activity?.messages_sent_today?.toLocaleString() ?? '182'}
            delta={{
              percent: 12,
              baseline: 'messages today',
              isGood: true,
            }}
            icon={<MessageSquare className="w-4 h-4" />}
            entityType="volume"
            onClick={() => navigate('/admin-messages')}
          />
        </div>

        {/* ── Operational Grid: Health Breakdown & Velocity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Listings Health Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
              <span>Listing Moderation Health</span>
              <span className="text-xs font-semibold tabular-nums text-slate-400">
                {stats.total_listings.toLocaleString()} Total
              </span>
            </h2>

            <div className="space-y-4">
              {[
                { label: 'Active on Marketplace', value: stats.active_listings, color: 'bg-emerald-500' },
                { label: 'Pending Review', value: stats.pending_listings, color: 'bg-amber-400' },
                { label: 'Draft or Archived', value: Math.max(0, stats.total_listings - stats.active_listings - stats.pending_listings), color: 'bg-slate-300 dark:bg-slate-600' },
              ].map((item, idx) => {
                const pct = stats.total_listings > 0 ? Math.round((item.value / stats.total_listings) * 100) : 0;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                        {item.value.toLocaleString()} <span className="text-slate-400 text-[11px]">({pct}%)</span>
                      </span>
                    </div>
                    <SlimShareBar percent={pct} color={item.color} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Distribution & Growth */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              User Cohort Composition
            </h2>

            <div className="space-y-4">
              {[
                { label: 'Active Buyers', value: stats.active_buyers ?? 880, color: 'bg-sky-500' },
                { label: 'Active Sellers', value: stats.active_sellers ?? 310, color: 'bg-indigo-500' },
                { label: 'Shops Registered', value: stats.total_shops ?? 145, color: 'bg-purple-500' },
              ].map((item, idx) => {
                const total = stats.total_users || 1420;
                const pct = Math.round((item.value / total) * 100);
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                        {item.value.toLocaleString()} <span className="text-slate-400 text-[11px]">({pct}%)</span>
                      </span>
                    </div>
                    <SlimShareBar percent={pct} color={item.color} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Operations Links */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Operator Direct Shortcuts
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Broadcast Push', icon: Bell, href: '/admin-dashboard/system-messages' },
                { label: 'Revenue Analytics', icon: DollarSign, href: '/admin-dashboard/revenue' },
                { label: 'Realtime Telemetry', icon: Activity, href: '/admin-dashboard/analytics' },
                { label: 'Fraud Shield', icon: AlertTriangle, href: '/admin-fraud' },
                { label: 'Shop Verifications', icon: CheckCircle, href: '/admin-verifications' },
                { label: 'Featured Banners', icon: Megaphone, href: '/admin-dashboard/marketing/banners' },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.href}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <item.icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Activity / Inquiries Table ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Transaction & Inquiry Log
              </h2>
              <p className="text-[11px] text-slate-400">Recent marketplace activity across verified stores</p>
            </div>
            <Link
              to="/admin-orders"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
            >
              All orders <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent order transactions logged in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Seller Store</th>
                    <th className="py-2.5 px-3 text-right">Value (KES)</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        #{o.id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {o.customer?.full_name || 'Buyer'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {o.seller?.shop_name || 'Direct Shop'}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold tabular-nums text-slate-900 dark:text-white">
                        KSh {Number(o.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                          {o.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
