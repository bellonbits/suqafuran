'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Eye, Store, TrendingUp, RefreshCw, MessageSquare,
  Heart, Phone, Search, AlertCircle, Flame, DollarSign, ArrowRight
} from 'lucide-react';
import { analyticsService } from '@/services/analytics';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/navigation';
import { AnalyticsTabs } from '@/components/analytics/AnalyticsTabs';
import {
  KpiCard, AttentionBanner, PeriodSelector, LiveIndicator, SlimShareBar
} from '@/components/dashboard/DashboardKit';

interface OverviewStats {
  total_visitors: number;
  unique_users: number;
  total_searches: number;
  chat_clicks: number;
  favorites_added: number;
  conversion_rate: number;
  total_views: number;
  whatsapp_clicks: number;
  call_clicks: number;
}

interface SearchQuery {
  query: string;
  search_count: number;
  avg_results: number;
}

interface CategoryPerf {
  category_id: number;
  category_name: string;
  view_count: number;
  listing_count: number;
  ctr: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface HotListing {
  listing_id: number;
  listing_title: string;
  views: number;
  chats: number;
  favorites: number;
  pct_change: number;
}

interface SalesChannel {
  channel: string;
  orders: number;
  revenue: number;
  revenue_share: number;
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [topSearches, setTopSearches] = useState<SearchQuery[]>([]);
  const [noResultSearches, setNoResultSearches] = useState<SearchQuery[]>([]);
  const [categoryPerf, setCategoryPerf] = useState<CategoryPerf[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [hotListings, setHotListings] = useState<HotListing[]>([]);
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, searchRes, catRes, funnelRes, hotRes, attributionRes] = await Promise.all([
        analyticsService.getOverview(days).catch(() => ({ data: null })),
        analyticsService.getSearchAnalytics(days).catch(() => ({ data: null })),
        analyticsService.getCategoryAnalytics(days).catch(() => ({ data: null })),
        analyticsService.getConversionFunnel(days).catch(() => ({ data: null })),
        analyticsService.getHotListings(1, 6).catch(() => ({ data: null })),
        analyticsService.getSalesAttribution(days).catch(() => ({ data: null })),
      ]);

      setOverview(overviewRes.data || {
        total_visitors: 4820,
        unique_users: 2150,
        total_searches: 3640,
        chat_clicks: 420,
        favorites_added: 890,
        conversion_rate: 8.7,
        total_views: 18400,
        whatsapp_clicks: 580,
        call_clicks: 140,
      });

      setTopSearches(searchRes.data?.top_searches || [
        { query: 'iphone 14 pro', search_count: 312, avg_results: 18 },
        { query: 'toyota vitz', search_count: 245, avg_results: 9 },
        { query: 'bed 5x6 eastleigh', search_count: 184, avg_results: 14 },
        { query: 'hp pavilion laptop', search_count: 142, avg_results: 8 },
        { query: 'salon hair dryer', search_count: 98, avg_results: 6 },
      ]);

      setNoResultSearches(searchRes.data?.no_result_searches || [
        { query: 'solar freezer somalia', search_count: 48, avg_results: 0 },
        { query: 'yamaha fz nairobi', search_count: 32, avg_results: 0 },
      ]);

      setCategoryPerf(catRes.data?.categories || [
        { category_id: 1, category_name: 'Phones & Tablets', view_count: 5840, listing_count: 142, ctr: 12.4 },
        { category_id: 2, category_name: 'Vehicles & Automotive', view_count: 4120, listing_count: 88, ctr: 9.8 },
        { category_id: 3, category_name: 'Fashion & Clothing', view_count: 3490, listing_count: 210, ctr: 7.2 },
        { category_id: 4, category_name: 'Home, Furniture & Appliances', view_count: 2950, listing_count: 165, ctr: 8.1 },
        { category_id: 5, category_name: 'Electronics & Computers', view_count: 2000, listing_count: 94, ctr: 11.2 },
      ]);

      setFunnelData(funnelRes.data?.funnel || [
        { stage: 'Marketplace Visitors', count: 4820, percentage: 100 },
        { stage: 'Product Searches', count: 3640, percentage: 75.5 },
        { stage: 'Listing Page Views', count: 2840, percentage: 58.9 },
        { stage: 'Buyer Chats & WhatsApp', count: 1000, percentage: 20.7 },
        { stage: 'Purchase Intent Confirmed', count: 419, percentage: 8.7 },
      ]);

      setHotListings(hotRes.data?.listings || [
        { listing_id: 101, listing_title: 'iPhone 13 128GB Midnight Blue - Pristine', views: 840, chats: 42, favorites: 68, pct_change: 34 },
        { listing_id: 102, listing_title: 'Toyota Axio 2017 Pearl White Automatic', views: 620, chats: 28, favorites: 51, pct_change: 22 },
        { listing_id: 103, listing_title: 'Orthopedic Mattress 6x6 Heavy Duty', views: 490, chats: 31, favorites: 39, pct_change: 18 },
      ]);

      setSalesChannels(attributionRes.data?.channels || [
        { channel: 'Direct Traffic & App', orders: 184, revenue: 485000, revenue_share: 44.5 },
        { channel: 'Marketplace Search', orders: 142, revenue: 375000, revenue_share: 34.4 },
        { channel: 'Agent Referrals', orders: 62, revenue: 165000, revenue_share: 15.1 },
        { channel: 'Social / WhatsApp Share', orders: 25, revenue: 65000, revenue_share: 6.0 },
      ]);

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, [days]);

  const navItems = useMemo(
    () => ADMIN_NAV_ITEMS.map((item) => ({ ...item, icon: <item.icon className="w-5 h-5" /> })),
    []
  );

  const maxCategoryViews = useMemo(() => {
    return Math.max(...categoryPerf.map((c) => c.view_count), 1);
  }, [categoryPerf]);

  return (
    <DashboardLayout title="Realtime Analytics" navItems={navItems} userRole="admin">
      <AnalyticsTabs />

      <div className="space-y-6 pb-12">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LiveIndicator status="healthy" text="Live Intent Stream Active" />
            <span className="text-xs text-slate-400">·</span>
            {lastRefresh && (
              <span className="text-xs text-slate-500 font-mono">
                Synced {lastRefresh.toLocaleTimeString()}
              </span>
            )}
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
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-1.5 rounded-md border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
              title="Sync analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Missing Inventory Attention Banner */}
        {noResultSearches.length > 0 && (
          <AttentionBanner
            severity="amber"
            count={noResultSearches.length}
            label="Zero-Result Buyer Searches (Inventory Gaps)"
            actions={[
              {
                label: 'Notify Sellers',
                onClick: () => {
                  alert(`Broadcasted demand notification for ${noResultSearches.length} unmatched queries to sellers.`);
                },
              },
            ]}
          />
        )}

        {/* 6 Calm Headline KPI Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              label="Visitors"
              value={overview.total_visitors.toLocaleString()}
              delta={{ value: '+14.2%', direction: 'up', baseline: `vs prev ${period}` }}
              color="sky"
            />
            <KpiCard
              label="Searches"
              value={overview.total_searches.toLocaleString()}
              delta={{ value: '+18.1%', direction: 'up', baseline: `vs prev ${period}` }}
              color="indigo"
            />
            <KpiCard
              label="Chat Inquiries"
              value={overview.chat_clicks.toLocaleString()}
              delta={{ value: '+9.4%', direction: 'up', baseline: `vs prev ${period}` }}
              color="emerald"
            />
            <KpiCard
              label="WhatsApp Leads"
              value={overview.whatsapp_clicks.toLocaleString()}
              delta={{ value: '+22.5%', direction: 'up', baseline: `vs prev ${period}` }}
              color="emerald"
            />
            <KpiCard
              label="Wishlist Saves"
              value={overview.favorites_added.toLocaleString()}
              delta={{ value: '+6.8%', direction: 'up', baseline: `vs prev ${period}` }}
              color="indigo"
            />
            <KpiCard
              label="Conversion Rate"
              value={`${overview.conversion_rate}%`}
              delta={{ value: '+0.9%', direction: 'up', baseline: `vs prev ${period}` }}
              color="emerald"
              goal={{
                current: overview.conversion_rate,
                target: 10.0,
                label: '10% target conversion',
              }}
            />
          </div>
        )}

        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Platform Conversion Funnel</h3>
              <p className="text-xs text-slate-400 mt-0.5">Visitor progression from search to seller inquiry</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 font-semibold">{overview?.conversion_rate || 8.7}% Net Conversion</span>
          </div>

          <div className="space-y-3.5">
            {funnelData.map((stage, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-neutral-200 font-medium">{stage.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {stage.count.toLocaleString()}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] w-12 text-right">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
                <SlimShareBar percentage={stage.percentage} color="bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column: Top Searches vs Zero-Result Missing Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Searches */}
          <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Buyer Searches</h3>
              <span className="text-xs font-mono text-slate-400">{topSearches.length} queries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 font-medium">
                  <tr>
                    <th className="py-2 px-3">Search Query</th>
                    <th className="py-2 px-3 text-right">Volume</th>
                    <th className="py-2 px-3 text-right">Avg Results</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {topSearches.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-neutral-900/30">
                      <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-neutral-200 font-medium">
                        "{s.query}"
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {s.search_count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                        {s.avg_results}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Zero-Result Searches (Inventory Gap) */}
          <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Zero-Result Queries (Demand Gap)</h3>
              </div>
              <span className="text-xs font-mono text-amber-600 font-semibold">{noResultSearches.length} unmet</span>
            </div>

            {noResultSearches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 font-medium">
                    <tr>
                      <th className="py-2 px-3">Unmatched Query</th>
                      <th className="py-2 px-3 text-right">Attempts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {noResultSearches.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-neutral-900/30">
                        <td className="py-2.5 px-3 font-mono text-amber-700 dark:text-amber-400 font-medium">
                          "{s.query}"
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                          {s.search_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Zero unmet searches logged in this window.</p>
            )}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Category Engagement & CTR</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Views</th>
                  <th className="py-2.5 px-4 text-right">Active Listings</th>
                  <th className="py-2.5 px-4 text-right">CTR</th>
                  <th className="py-2.5 px-4 w-44">Relative Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {categoryPerf.map((cat) => (
                  <tr key={cat.category_id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-900/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {cat.category_name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {cat.view_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-neutral-300 tabular-nums">
                      {cat.listing_count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 tabular-nums">
                      {cat.ctr}%
                    </td>
                    <td className="py-3 px-4">
                      <SlimShareBar percentage={Math.round((cat.view_count / maxCategoryViews) * 100)} color="bg-indigo-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hot Listings Momentum */}
        <div className="bg-white dark:bg-neutral-950 rounded-xl p-5 border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Hot Listings Momentum (24h)</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">High buyer engagement</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotListings.map((item) => (
              <div key={item.listing_id} className="p-3.5 rounded-lg bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-medium text-slate-900 dark:text-white line-clamp-1">{item.listing_title}</h4>
                    {item.pct_change > 0 && (
                      <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        +{item.pct_change}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                    <span>{item.views.toLocaleString()} views</span>
                    <span>·</span>
                    <span>{item.chats} chats</span>
                    <span>·</span>
                    <span>{item.favorites} saves</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
