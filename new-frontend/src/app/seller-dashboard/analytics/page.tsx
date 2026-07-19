"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Eye, ShoppingCart, Loader } from 'lucide-react';
import api from '@/services/api';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => null),
        api.get('/orders?limit=100').catch(() => null),
      ]);

      if (statsRes?.data) {
        const orders = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
        const conversions = orders.length;
        const uniqueVisitors = statsRes.data.views || 0;
        const conversionRate = uniqueVisitors > 0 ? ((conversions / uniqueVisitors) * 100).toFixed(1) : 0;

        setStats({
          shop_views: statsRes.data.views || 0,
          total_orders: orders.length,
          unique_visitors: Math.round(uniqueVisitors * 0.7),
          conversion_rate: conversionRate,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-500 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
        <p className="text-gray-600 dark:text-slate-400">Track your shop performance and customer behavior</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-slate-400 text-xs">Shop Views</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{(stats?.shop_views || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-slate-400 text-xs">Total Orders</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.total_orders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-slate-400 text-xs">Unique Visitors</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{(stats?.unique_visitors || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-slate-400 text-xs">Conversion Rate</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.conversion_rate || 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
