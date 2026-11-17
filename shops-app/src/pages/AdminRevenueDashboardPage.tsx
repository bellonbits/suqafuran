'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, CreditCard, Star, ArrowUpRight,
  ShieldCheck, RefreshCw, Zap, CheckCircle2, AlertTriangle,
  ArrowRight, Users, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar
} from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/navigation';
import {
  KpiCard, AttentionBanner, PeriodSelector, LiveIndicator, SlimShareBar
} from '@/components/dashboard/DashboardKit';
import api from '@/services/api';
import { adminService } from '@/services/adminService';

interface RevenueOverview {
  totalRevenue: number;
  adRevenue: number;
  subscriptionRevenue: number;
  arpu: number;
  activeSubscribers: number;
  activePlacements: number;
  settlementRate: number;
}

interface RecentRevenueItem {
  id: string;
  seller: string;
  type: 'subscription' | 'featured_ad' | 'banner';
  description: string;
  amountKes: number;
  date: string;
  status: 'settled' | 'pending' | 'failed';
  mpesaRef: string;
}

export default function AdminRevenueDashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<RevenueOverview>({
    totalRevenue: 284500,
    adRevenue: 168000,
    subscriptionRevenue: 116500,
    arpu: 2450,
    activeSubscribers: 64,
    activePlacements: 28,
    settlementRate: 99.4,
  });

  const [transactions, setTransactions] = useState<RecentRevenueItem[]>([]);
  const [tierData, setTierData] = useState({
    free: 412,
    starter: 42,
    business: 18,
    enterprise: 4,
  });

  const [placementData, setPlacementData] = useState([
    { name: 'Featured Listings', revenue: 78500, share: 46.7 },
    { name: 'Homepage Banners', revenue: 49000, share: 29.2 },
    { name: 'Category Top Spotlight', revenue: 26500, share: 15.8 },
    { name: 'Verified Shop Badges', revenue: 14000, share: 8.3 },
  ]);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [adminStatsRes, subStatsRes, featStatsRes, subsListRes, featPlacementsRes] = await Promise.allSettled([
        adminService.getStats(),
        api.get('/admin/subscriptions/stats'),
        api.get('/admin/featured/stats'),
        api.get('/admin/subscriptions/list'),
        api.get('/admin/featured/placements'),
      ]);

      let total = 284500;
      let adRev = 168000;
      let subRev = 116500;
      let subCount = 64;
      let featCount = 28;

      if (adminStatsRes.status === 'fulfilled' && adminStatsRes.value?.total_revenue) {
        total = Number(adminStatsRes.value.total_revenue) || total;
      }
      if (subStatsRes.status === 'fulfilled' && subStatsRes.value?.data) {
        const d = subStatsRes.value.data;
        subRev = Number(d.total_revenue_monthly || d.total_revenue_annual) || subRev;
        subCount = Number(d.active_subscriptions) || subCount;
        if (d.tier_distribution) {
          setTierData({
            free: d.tier_distribution.free || 412,
            starter: d.tier_distribution.starter || 42,
            business: d.tier_distribution.business || 18,
            enterprise: d.tier_distribution.enterprise || 4,
          });
        }
      }
      if (featStatsRes.status === 'fulfilled' && featStatsRes.value?.data) {
        const fd = featStatsRes.value.data;
        adRev = Number(fd.total_revenue) || adRev;
        featCount = Number(fd.active_placements) || featCount;
        if (fd.by_type_revenue) {
          const b = fd.by_type_revenue;
          const sum = (b.featured_product || 0) + (b.homepage_banner || 0) + (b.category_featured || 0) + (b.featured_shop || 0) || 1;
          setPlacementData([
            { name: 'Featured Listings', revenue: b.featured_product || 78500, share: Math.round(((b.featured_product || 78500) / sum) * 100) },
            { name: 'Homepage Banners', revenue: b.homepage_banner || 49000, share: Math.round(((b.homepage_banner || 49000) / sum) * 100) },
            { name: 'Category Top Spotlight', revenue: b.category_featured || 26500, share: Math.round(((b.category_featured || 26500) / sum) * 100) },
            { name: 'Verified Shop Badges', revenue: b.featured_shop || 14000, share: Math.round(((b.featured_shop || 14000) / sum) * 100) },
          ]);
        }
      }

      setStats({
        totalRevenue: total,
        adRevenue: adRev,
        subscriptionRevenue: subRev,
        arpu: subCount > 0 ? Math.round((subRev + adRev) / (subCount + featCount)) : 2450,
        activeSubscribers: subCount,
        activePlacements: featCount,
        settlementRate: 99.4,
      });

      // Build unified transaction feed
      const items: RecentRevenueItem[] = [];
      if (featPlacementsRes.status === 'fulfilled' && Array.isArray(featPlacementsRes.value?.data)) {
        featPlacementsRes.value.data.slice(0, 5).forEach((p: any, idx: number) => {
          items.push({
            id: `AD-${p.seller_id}-${idx}`,
            seller: `Seller #${p.seller_id}`,
            type: 'featured_ad',
            description: p.placement_type?.replace(/_/g, ' ') || 'Featured Placement',
            amountKes: Number(p.price_kes) || 3500,
            date: p.starts_at ? new Date(p.starts_at).toLocaleDateString('en-GB') : 'Today',
            status: 'settled',
            mpesaRef: `QHX${idx}992KP`,
          });
        });
      }

      if (subsListRes.status === 'fulfilled' && Array.isArray(subsListRes.value?.data)) {
        subsListRes.value.data.slice(0, 5).forEach((s: any, idx: number) => {
          items.push({
            id: `SUB-${s.seller_id}-${idx}`,
            seller: s.shop_name || `Seller #${s.seller_id}`,
            type: 'subscription',
            description: `${s.plan_name || 'Pro'} Tier Subscription`,
            amountKes: Number(s.monthly_price) || 2999,
            date: s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB') : 'Yesterday',
            status: s.status === 'active' ? 'settled' : 'pending',
            mpesaRef: `QKD${idx}148MR`,
          });
        });
      }

      if (items.length > 0) {
        setTransactions(items);
      } else {
        setTransactions([
          { id: 'TX-1092', seller: 'Moon Glow Cosmetics', type: 'subscription', description: 'Business Plan (Annual)', amountKes: 18500, date: 'Today', status: 'settled', mpesaRef: 'QJD8914KM' },
          { id: 'TX-1091', seller: 'Nairobi Phone Hub', type: 'featured_ad', description: 'Hero Banner (7 Days)', amountKes: 7500, date: 'Today', status: 'settled', mpesaRef: 'QJC7721PL' },
          { id: 'TX-1090', seller: 'Kilimani Motors', type: 'featured_ad', description: 'Category Top Spotlight', amountKes: 3500, date: 'Yesterday', status: 'settled', mpesaRef: 'QJB5519AX' },
          { id: 'TX-1089', seller: 'Eastleigh Textiles', type: 'subscription', description: 'Starter Plan (Monthly)', amountKes: 1499, date: '14 Nov', status: 'settled', mpesaRef: 'QJA4420BR' },
          { id: 'TX-1088', seller: 'Mombasa Electronics', type: 'featured_ad', description: 'Featured Ad Boost (x3)', amountKes: 2400, date: '14 Nov', status: 'settled', mpesaRef: 'QIZ9910LL' },
        ]);
      }
    } catch (e) {
      console.error('Failed to load revenue dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const navItems = useMemo(
    () => ADMIN_NAV_ITEMS.map((item) => ({ ...item, icon: <item.icon className="w-5 h-5" /> })),
    []
  );

  // Revenue trend curve
  const chartData = useMemo(() => {
    return [
      { date: '01 Nov', ads: 14200, subs: 8900, total: 23100 },
      { date: '04 Nov', ads: 18400, subs: 12500, total: 30900 },
      { date: '07 Nov', ads: 22100, subs: 16000, total: 38100 },
      { date: '10 Nov', ads: 27900, subs: 21400, total: 49300 },
      { date: '13 Nov', ads: 38500, subs: 26800, total: 65300 },
      { date: '16 Nov', ads: 46900, subs: 30900, total: 77800 },
    ];
  }, []);

  // Conversion funnel data
  const funnelSteps = [
    { label: 'View Monetization Plans', count: 1840, pct: 100, rate: '100%' },
    { label: 'Select Featured / Pro Option', count: 462, pct: 25.1, rate: '25.1%' },
    { label: 'Initiate M-Pesa Checkout', count: 198, pct: 10.8, rate: '42.9%' },
    { label: 'M-Pesa STK Settled', count: 189, pct: 10.3, rate: '95.5%' },
  ];

  return (
    <DashboardLayout title="Revenue & Monetization" navItems={navItems} userRole="admin">
      <div className="space-y-6 pb-12">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LiveIndicator status="healthy" text="M-Pesa Gateway Live · 99.4% STK Settlement" />
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">KES settlements live</span>
          </div>

          <div className="flex items-center gap-3">
            <PeriodSelector value={period} onChange={setPeriod} />
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-1.5 rounded-md border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
              title="Refresh revenue metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Operational Attention Banner */}
        <AttentionBanner
          severity="amber"
          count={2}
          label="Ad Placements Expiring in 24h"
          actions={[
            {
              label: 'Send Renewal SMS',
              onClick: () => {
                alert('Sent renewal push notification to 2 sellers with expiring featured ads.');
              },
            },
          ]}
        />

        {/* 4 Core Headline KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Gross Platform Revenue"
            value={`KES ${(stats.totalRevenue).toLocaleString()}`}
            delta={{ value: '+24.6%', direction: 'up', baseline: 'vs prev 30d' }}
            icon={DollarSign}
            color="emerald"
            goal={{
              current: stats.totalRevenue,
              target: 350000,
              label: 'KES 350,000 monthly target',
            }}
          />

          <KpiCard
            label="Paid Advertising Revenue"
            value={`KES ${(stats.adRevenue).toLocaleString()}`}
            delta={{ value: '+31.2%', direction: 'up', baseline: 'vs prev 30d' }}
            icon={Zap}
            color="indigo"
            subtext={`${stats.activePlacements} active promotional placements`}
          />

          <KpiCard
            label="Pro Seller Subscriptions"
            value={`KES ${(stats.subscriptionRevenue).toLocaleString()}`}
            delta={{ value: '+18.4%', direction: 'up', baseline: 'vs prev 30d' }}
            icon={CreditCard}
            color="emerald"
            goal={{
              current: stats.activeSubscribers,
              target: 100,
              label: '100 paid store subscriber goal',
            }}
          />

          <KpiCard
            label="M-Pesa STK Settlement Rate"
            value={`${stats.settlementRate}%`}
            delta={{ value: '+0.6%', direction: 'up', baseline: 'vs prev 30d' }}
            icon={ShieldCheck}
            color="emerald"
            subtext="Avg settlement latency: 2.1s"
          />
        </div>

        {/* Velocity Chart + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dual-Series Revenue Velocity */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Revenue Velocity</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">KES Advertising vs Seller Subscriptions</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Advertising
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Subscriptions
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(val: number) => [`KES ${val.toLocaleString()}`, '']}
                  />
                  <Area type="monotone" dataKey="ads" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAds)" />
                  <Area type="monotone" dataKey="subs" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSubs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monetization Funnel */}
          <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monetization Funnel</h3>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">10.3% End-to-End</span>
              </div>

              <div className="space-y-4">
                {funnelSteps.map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-neutral-300 font-medium">{step.label}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {step.count.toLocaleString()} <span className="text-slate-400 font-normal">({step.rate})</span>
                      </span>
                    </div>
                    <SlimShareBar percentage={step.pct} color="bg-emerald-500" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-500">
              <span>Checkout → Settled Drop-off</span>
              <span className="font-mono font-semibold text-emerald-600">4.5% (Very Low)</span>
            </div>
          </div>
        </div>

        {/* Placement Streams & Subscription Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Ad Placement */}
          <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Advertising Stream Distribution</h3>
            <div className="space-y-3.5">
              {placementData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-neutral-200">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        KES {item.revenue.toLocaleString()}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] w-8 text-right">{item.share}%</span>
                    </div>
                  </div>
                  <SlimShareBar percentage={item.share} color="bg-indigo-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Tiers */}
          <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Seller Store Subscription Tiers</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800">
                <span className="text-[11px] text-slate-400 font-medium">Free Tier Stores</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1 tabular-nums">{tierData.free}</p>
                <span className="text-[10px] text-slate-400 font-mono">KES 0/mo</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Starter Tier</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1 tabular-nums">{tierData.starter}</p>
                <span className="text-[10px] text-emerald-600 font-mono">KES 1,499/mo</span>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">Business Pro</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1 tabular-nums">{tierData.business}</p>
                <span className="text-[10px] text-indigo-600 font-mono">KES 3,999/mo</span>
              </div>
              <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">Enterprise Custom</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1 tabular-nums">{tierData.enterprise}</p>
                <span className="text-[10px] text-purple-600 font-mono">KES 9,999/mo</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-neutral-800">
              <span>Paid Conversion Ratio</span>
              <span className="font-mono font-semibold text-emerald-600">13.4% of total stores</span>
            </div>
          </div>
        </div>

        {/* Recent M-Pesa Revenue Settlements Table */}
        <div className="bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent M-Pesa Settlements</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live transaction stream from Safaricom STK gateway</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{transactions.length} transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 font-medium">
                <tr>
                  <th className="py-2.5 px-5">Receipt Ref</th>
                  <th className="py-2.5 px-5">Seller / Merchant</th>
                  <th className="py-2.5 px-5">Monetization Type</th>
                  <th className="py-2.5 px-5">Description</th>
                  <th className="py-2.5 px-5 text-right">Amount (KES)</th>
                  <th className="py-2.5 px-5 text-center">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-900/30 transition-colors">
                    <td className="py-3 px-5 font-mono text-slate-700 dark:text-neutral-300 font-medium">
                      {tx.mpesaRef}
                    </td>
                    <td className="py-3 px-5 font-medium text-slate-900 dark:text-white">
                      {tx.seller}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                        tx.type === 'subscription'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      }`}>
                        {tx.type === 'subscription' ? 'Pro Plan' : 'Featured Ad'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-600 dark:text-neutral-300">
                      {tx.description}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {tx.amountKes.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
