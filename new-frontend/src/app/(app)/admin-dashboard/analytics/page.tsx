"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, Eye, Store, TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import { analyticsService } from '../../../../services/analytics';

interface TopItem {
  listing_id: number;
  view_count: number;
  unique_users: number;
  unique_guests: number;
  total_unique_visitors: number;
}

interface TopShop {
  shop_owner_id: number;
  view_count: number;
  unique_users: number;
  unique_guests: number;
  total_unique_visitors: number;
}

interface LiveView {
  id: string;
  listing_id?: number;
  shop_owner_id?: number;
  user_id: number | null;
  device_type: string | null;
  viewed_at: string;
}

export default function AnalyticsDashboard() {
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [topShops, setTopShops] = useState<TopShop[]>([]);
  const [liveViews, setLiveViews] = useState<LiveView[]>([]);
  const [days, setDays] = useState(7);
  const [minutes, setMinutes] = useState(5);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [itemsRes, shopsRes, liveRes] = await Promise.all([
        analyticsService.getTopItems(days, 20),
        analyticsService.getTopShops(days, 20),
        analyticsService.getLiveViews(minutes),
      ]);

      setTopItems(itemsRes.data?.items || []);
      setTopShops(shopsRes.data?.shops || []);
      setLiveViews([
        ...(liveRes.data?.recent_item_views || []).map((v: any) => ({ ...v, type: 'item' })),
        ...(liveRes.data?.recent_shop_views || []).map((v: any) => ({ ...v, type: 'shop' })),
      ].sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()));

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [days, minutes]);

  const maxViewCount = Math.max(...topItems.map(i => i.view_count), 1);
  const maxShopViews = Math.max(...topShops.map(s => s.view_count), 1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800 flex gap-4 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Period:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Live window:</label>
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <option value={5}>5 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>

          {lastRefresh && (
            <span className="text-xs text-gray-500 dark:text-slate-500 ml-auto">
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Items</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {topItems.map((item) => (
                  <tr key={item.listing_id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white">#{item.listing_id}</td>
                    <td className="px-6 py-3 text-sm font-bold text-orange-600">{item.view_count}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{item.unique_users}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{item.unique_guests}</td>
                    <td className="px-6 py-3">
                      <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-full rounded-full"
                          style={{ width: `${(item.view_count / maxViewCount) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Shops</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {topShops.map((shop) => (
                  <tr key={shop.shop_owner_id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white">#{shop.shop_owner_id}</td>
                    <td className="px-6 py-3 text-sm font-bold text-blue-600">{shop.view_count}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{shop.unique_users}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{shop.unique_guests}</td>
                    <td className="px-6 py-3">
                      <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${(shop.view_count / maxShopViews) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Live Monitor</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {liveViews.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-slate-500">
                No activity
              </div>
            ) : (
              liveViews.map((view) => (
                <div key={view.id} className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {(view as any).type === 'item' ? `Item #${(view as any).listing_id}` : `Shop #${(view as any).shop_owner_id}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">
                    {view.user_id ? `User #${view.user_id}` : 'Guest'} • {view.device_type || 'unknown'} • {new Date(view.viewed_at).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
