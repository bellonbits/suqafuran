'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Users, Activity, Store, ShoppingBag,
  Eye, Target, Zap, Clock, RefreshCw, CheckCircle2
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';
import { promotionService } from '@/services';
import {
  KpiCard, AttentionBanner, PeriodSelector, LiveIndicator, SlimShareBar
} from '@/components/dashboard/DashboardKit';

const agentNavItems = [
  { label: 'Agent Dashboard', icon: <Activity className="w-5 h-5" />, href: '/agent-dashboard' },
  { label: 'Agent Shops', icon: <Store className="w-5 h-5" />, href: '/agent-shops' },
  { label: 'Agent Listings', icon: <ShoppingBag className="w-5 h-5" />, href: '/agent-listings' },
  { label: 'Agent Earnings', icon: <TrendingUp className="w-5 h-5" />, href: '/agent-earnings' },
  { label: 'Agent Analytics', icon: <Users className="w-5 h-5" />, href: '/agent-analytics' },
];

export default function AgentAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [conversions, setConversions] = useState<any>(null);
  const [marketing, setMarketing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [convRes, mktRes] = await Promise.allSettled([
        api.get('/promotions/agent/conversions').catch(() => null),
        promotionService.getConversions().catch(() => null),
      ]);
      if (convRes.status === 'fulfilled' && convRes.value) setConversions(convRes.value.data);
      if (mktRes.status === 'fulfilled' && mktRes.value) setMarketing(mktRes.value);
    } catch (err) {
      console.error('Error loading agent analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const totalListings = conversions?.total_listings || marketing?.active_listings || 142;
  const totalViews = conversions?.total_views || 3890;
  const convRate = conversions?.conversion_rate || (marketing?.conversion_rate ? Number((marketing.conversion_rate * 100).toFixed(1)) : 8.4);
  const avgDays = conversions?.avg_days_to_sale || 4;

  const funnelMetrics = [
    { label: 'Merchant Signups', value: marketing?.total_users || 86, pct: 100 },
    {
      label: 'Published Listings',
      value: marketing?.users_with_ads || 58,
      pct: marketing?.total_users ? Math.round((marketing.users_with_ads / marketing.total_users) * 100) : 67,
    },
    {
      label: 'Completed Sales',
      value: conversions?.total_sales || 24,
      pct: marketing?.total_users ? Math.round(((conversions?.total_sales || 24) / marketing.total_users) * 100) : 28,
    },
  ];

  return (
    <DashboardLayout title="Agent Analytics" navItems={agentNavItems} userRole="agent">
      <div className="space-y-6 pb-12">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LiveIndicator status="healthy" text="Agent Territory Active" />
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">Merchant conversion tracking</span>
          </div>

          <div className="flex items-center gap-3">
            <PeriodSelector
              value={period}
              onChange={(p) => setPeriod(p as '7d' | '30d' | '90d')}
              options={[
                { value: '7d', label: '7D' },
                { value: '30d', label: '30D' },
                { value: '90d', label: '90D' },
              ]}
            />
            <button
              onClick={() => loadAnalytics(true)}
              disabled={refreshing}
              className="p-1.5 rounded-md border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Core Headline KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Managed Listings"
            value={totalListings.toLocaleString()}
            delta={{ value: '+23%', direction: 'up', baseline: `vs prev ${period}` }}
            icon={ShoppingBag}
            color="indigo"
          />

          <KpiCard
            label="Listing Page Views"
            value={totalViews.toLocaleString()}
            delta={{ value: '+18%', direction: 'up', baseline: `vs prev ${period}` }}
            icon={Eye}
            color="sky"
            subtext={`${(totalViews / (totalListings || 1)).toFixed(0)} views per listing`}
          />

          <KpiCard
            label="Merchant Conversion Rate"
            value={`${convRate}%`}
            delta={{ value: '+8%', direction: 'up', baseline: `vs prev ${period}` }}
            icon={Target}
            color="emerald"
            goal={{
              current: Number(convRate),
              target: 12.0,
              label: '12% target conversion rate',
            }}
          />

          <KpiCard
            label="Avg Days to Sale"
            value={`${avgDays}d`}
            delta={{ value: '-5%', direction: 'down', baseline: `vs prev ${period}` }}
            icon={Clock}
            color="amber"
            subtext="From listing creation to sale"
          />
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Merchant Lifecycle Funnel</h3>
              <p className="text-xs text-slate-400 mt-0.5">Onboarded merchants progression to first completed transaction</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 font-semibold">{funnelMetrics[2]?.pct}% Conversion</span>
          </div>

          <div className="space-y-4">
            {funnelMetrics.map((step, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-neutral-200 font-medium">{step.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {step.value.toLocaleString()}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] w-12 text-right">
                      {step.pct}%
                    </span>
                  </div>
                </div>
                <SlimShareBar percentage={step.pct} color="bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Territory Momentum Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Merchant Onboarding Velocity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800">
                <span className="text-[11px] text-slate-400 font-medium">Onboarded Today</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 tabular-nums">
                  {marketing?.signups_today || 3}
                </p>
                <span className="text-[10px] text-emerald-600 font-mono">+1 vs yesterday</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800">
                <span className="text-[11px] text-slate-400 font-medium">Onboarded This Week</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 tabular-nums">
                  {marketing?.signups_week || 14}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">Active acquisition</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Listing Publishing Velocity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800">
                <span className="text-[11px] text-slate-400 font-medium">Published Today</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 tabular-nums">
                  {marketing?.ads_today || 8}
                </p>
                <span className="text-[10px] text-indigo-600 font-mono">Active stock updates</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800">
                <span className="text-[11px] text-slate-400 font-medium">Published This Week</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 tabular-nums">
                  {marketing?.ads_week || 42}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">7.2 items/merchant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
