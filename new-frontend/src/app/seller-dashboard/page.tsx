"use client";

import React, { useState, useEffect } from 'react';
import {
  DollarSign, ShoppingCart, Package, TrendingUp,
  AlertCircle, Eye, MessageSquare, Star, Clock, CheckCircle, Loader
} from 'lucide-react';
import api from '@/services/api';

const StatCard = ({ icon: Icon, label, value, color = 'blue' }: any) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default function SellerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('[DEBUG] Loading dashboard data');
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        api.get('/dashboard/stats').catch((err) => {
          console.error('[ERROR] Stats fetch:', err);
          return null;
        }),
        api.get('/listings/me?limit=10').catch((err) => {
          console.error('[ERROR] Products fetch:', err);
          return null;
        }),
        api.get('/orders?limit=5').catch((err) => {
          console.error('[ERROR] Orders fetch:', err);
          return null;
        }),
      ]);

      console.log('[DEBUG] Stats response:', statsRes?.data);
      if (statsRes?.data) {
        setStats(statsRes.data);
      }
      
      console.log('[DEBUG] Products response:', productsRes?.data);
      if (productsRes?.data) {
        const listingsArray = Array.isArray(productsRes.data) ? productsRes.data : [];
        console.log('[DEBUG] Products loaded:', listingsArray.length);
        setTopProducts(listingsArray.slice(0, 4));
      }
      
      console.log('[DEBUG] Orders response:', ordersRes?.data);
      if (ordersRes?.data) {
        const ordersArray = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.orders || [];
        console.log('[DEBUG] Orders loaded:', ordersArray.length);
        setRecentOrders(ordersArray.slice(0, 5));
      }
    } catch (error) {
      console.error('[ERROR] Loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalProducts = stats?.listings || 0;
  const totalMessages = stats?.messages || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-slate-400">Welcome back! Here's your shop performance.</p>
      </div>

      <div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Total Revenue" value={`KSh ${(stats?.balance || 0).toLocaleString()}`} color="green" />
          <StatCard icon={ShoppingCart} label="Total Orders" value={stats?.total_orders || "0"} color="blue" />
          <StatCard icon={Package} label="Active Products" value={totalProducts.toString()} color="blue" />
          <StatCard icon={Eye} label="Shop Views" value={stats?.views || "0"} color="purple" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Recent Orders</h3>
            <a href="/seller-dashboard/orders" className="text-orange-600 hover:text-orange-700 font-semibold text-sm">View All →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400">No recent orders</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 dark:border-slate-800">
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{order.id}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">KSh {(order.total_amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        }`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Top Products</h3>
            <a href="/seller-dashboard/products" className="text-orange-600 hover:text-orange-700 font-semibold text-sm">View All →</a>
          </div>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">No products listed yet</p>
            ) : (
              topProducts.map((product) => (
                <div key={product.id} className="pb-4 border-b border-gray-100 dark:border-slate-800 last:border-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 truncate">{product.title || 'Unnamed Product'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-slate-400">{product.views || 0} views</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">KSh {((product.price || 0)).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
