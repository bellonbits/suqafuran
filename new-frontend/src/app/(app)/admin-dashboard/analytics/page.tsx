"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, Eye, Store, TrendingUp, RefreshCw, Calendar, MessageSquare, Heart, Phone, Search, AlertCircle } from 'lucide-react';
import { analyticsService } from '../../../../services/analytics';

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
  view_count: number;
  listing_count: number;
  ctr: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [topSearches, setTopSearches] = useState<SearchQuery[]>([]);
  const [noResultSearches, setNoResultSearches] = useState<SearchQuery[]>([]);
  const [categoryPerf, setCategoryPerf] = useState<CategoryPerf[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, searchRes, catRes, funnelRes] = await Promise.all([
        analyticsService.getOverview(days),
        analyticsService.getSearchAnalytics(days),
        analyticsService.getCategoryAnalytics(days),
        analyticsService.getConversionFunnel(days),
      ]);

      setOverview(overviewRes.data || {});
      setTopSearches(searchRes.data?.top_searches || []);
      setNoResultSearches(searchRes.data?.no_result_searches || []);
      setCategoryPerf(catRes.data?.categories || []);
      setFunnelData(funnelRes.data?.funnel || []);
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
        {/* Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800 flex gap-4 items-center">
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
          {lastRefresh && (
            <span className="text-xs text-gray-500 dark:text-slate-500 ml-auto">
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
              <p className="text-xs text-gray-500 dark:text-slate-500 font-semibold">Visitors</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{overview.total_visitors.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
              <p className="text-xs text-gray-500 dark:text-slate-500 font-semibold">Searches</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{overview.total_searches.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
              <p className="text-xs text-gray-500 dark:text-slate-500 font-semibold">Chats</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{overview.chat_clicks.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
              <p className="text-xs text-gray-500 dark:text-slate-500 font-semibold">WhatsApp</p>
              <p className="text-2xl font-black text-green-600 mt-1">{overview.whatsapp_clicks.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
              <p className="text-xs text-gray-500 dark:text-slate-500 font-semibold">Favorites</p>
              <p className="text-2xl font-black text-red-600 mt-1">{overview.favorites_added.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
              <p className="text-xs text-gray-500 dark:text-slate-500 font-semibold">Conversion</p>
              <p className="text-2xl font-black text-orange-600 mt-1">{overview.conversion_rate}%</p>
            </div>
          </div>
        )}

        {/* Conversion Funnel */}
        {funnelData.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conversion Funnel</h2>
            </div>
            <div className="p-6 space-y-4">
              {funnelData.map((stage, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{stage.stage}</span>
                    <span className="text-sm text-gray-500 dark:text-slate-500">{stage.count.toLocaleString()} ({stage.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Searches */}
        {topSearches.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Searches</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Query</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Searches</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Avg Results</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {topSearches.map((search, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white">{search.query}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{search.search_count}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{search.avg_results}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Results Searches */}
        {noResultSearches.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-red-900 dark:text-red-300">No Results Searches</h2>
              <span className="text-xs text-red-700 dark:text-red-400 ml-auto">Missing inventory</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-100 dark:bg-red-900/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-900 dark:text-red-300">Query</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-900 dark:text-red-300">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-200 dark:divide-red-800">
                  {noResultSearches.map((search, idx) => (
                    <tr key={idx} className="hover:bg-red-100 dark:hover:bg-red-900/30">
                      <td className="px-6 py-3 text-sm font-semibold text-red-900 dark:text-red-300">{search.query}</td>
                      <td className="px-6 py-3 text-sm text-red-900 dark:text-red-300">{search.search_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Performance */}
        {categoryPerf.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Category Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Category ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Listings</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {categoryPerf.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white">#{cat.category_id}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{cat.view_count.toLocaleString()}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{cat.listing_count}</td>
                      <td className="px-6 py-3 text-sm font-bold text-green-600">{cat.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
