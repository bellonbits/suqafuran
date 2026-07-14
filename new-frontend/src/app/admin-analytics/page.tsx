"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { adminService } from '@/services';
import type { AdminStats } from '@/services';

const AnalyticsPage = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center text-gray-500">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-500 mt-1">Platform metrics and performance data</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Total Users</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.total_users}</p>
              </div>
              <Users className="w-10 h-10 text-[#6cd4ff]" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Total Listings</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.total_listings}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Active Listings</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.active_listings}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Total Revenue</p>
                <p className="text-3xl font-black text-gray-900 mt-2">Ksh {(stats.total_revenue / 1000).toFixed(0)}k</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4">Pending Items</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-semibold">Listings</span>
                <span className="text-2xl font-black text-gray-900">{stats.pending_listings}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-semibold">Orders</span>
                <span className="text-2xl font-black text-gray-900">{stats.pending_orders}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-semibold">Promotions</span>
                <span className="text-2xl font-black text-gray-900">{stats.pending_promotions}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4">Orders</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-semibold">Total Orders</span>
                <span className="text-2xl font-black text-gray-900">{stats.total_orders || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-semibold">Pending</span>
                <span className="text-2xl font-black text-gray-900">{stats.pending_orders}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4">Deliveries</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-semibold">Active</span>
                <span className="text-2xl font-black text-gray-900">{stats.active_deliveries}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-semibold">Delayed</span>
                <span className="text-2xl font-black text-gray-900">{stats.delayed_deliveries}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
