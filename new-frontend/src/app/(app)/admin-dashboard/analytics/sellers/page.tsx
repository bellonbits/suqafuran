"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Calendar, RefreshCw, MessageSquare, Eye } from 'lucide-react';
import { analyticsService } from '../../../../../services/analytics';

interface SellerRanking {
  rank: number;
  shop_id: number;
  shop_name: string;
  value: number;
}

export default function SellerRankings() {
  const [rankings, setRankings] = useState<SellerRanking[]>([]);
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<"views" | "chats" | "conversions">("views");
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getSellerRankings(days, metric);
      setRankings(res.data?.rankings || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch seller rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [days, metric]);

  const getMetricLabel = () => {
    switch (metric) {
      case 'views': return 'Shop Views';
      case 'chats': return 'Chat Started';
      case 'conversions': return 'Contacts';
      default: return 'Metric';
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Rankings</h1>
          </div>
          <button
            onClick={fetchRankings}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
        {/* Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800 flex gap-4 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Period:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Metric:</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as any)}
              className="rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <option value="views">Shop Views</option>
              <option value="chats">Chats Started</option>
              <option value="conversions">Contacts</option>
            </select>
          </div>

          {lastRefresh && (
            <span className="text-xs text-gray-500 dark:text-slate-500 ml-auto">
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Rankings */}
        {rankings.length > 0 && (
          <div className="space-y-4">
            {rankings.map((seller) => (
              <div
                key={seller.shop_id}
                className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-800 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl font-black w-12 text-center">
                      {getMedalEmoji(seller.rank)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {seller.shop_name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Shop #{seller.shop_id}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black text-orange-600">
                      {seller.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {getMetricLabel()}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-600"
                      style={{
                        width: `${Math.min(
                          100,
                          (seller.value / Math.max(...rankings.map((r) => r.value))) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
