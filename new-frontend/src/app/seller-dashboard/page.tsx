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
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
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
      const productsArray = Array.isArray(productsRes?.data) ? productsRes.data : [];
      const ordersArray = Array.isArray(ordersRes?.data) ? ordersRes.data : ordersRes?.data?.orders || [];

      console.log('[DEBUG] Products loaded:', productsArray.length);
      console.log('[DEBUG] Orders loaded:', ordersArray.length);

      if (statsRes?.data || (productsArray.length > 0 || ordersArray.length > 0)) {
        // Calculate real stats from data
        const totalRevenue = ordersArray.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        const totalOrders = ordersArray.length;
        const totalProducts = productsArray.length;

        setStats({
          ...statsRes?.data,
          total_orders: totalOrders,
          balance: totalRevenue,
          listings: totalProducts,
        });
      }

      if (productsArray.length > 0) {
        setTopProducts(productsArray.slice(0, 4));
      }

      if (ordersArray.length > 0) {
        setRecentOrders(ordersArray.slice(0, 5));
      }

      // Generate mock visitor data based on orders (in production, this would come from a visitor tracking API)
      if (ordersRes?.data) {
        const ordersArray = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const visitors = ordersArray.slice(0, 10).map((order: any, index: number) => ({
          id: order.id,
          name: order.customer_name || `Customer ${index + 1}`,
          action: order.status === 'completed' ? 'Purchased' : 'Browsing',
          time: new Date(order.created_at).toLocaleTimeString(),
          timestamp: new Date(order.created_at).getTime(),
        }));
        setRecentVisitors(visitors.sort((a: any, b: any) => b.timestamp - a.timestamp));
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

  const safeStats = stats || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-slate-400">Welcome back! Here's your shop performance.</p>
      </div>

      <div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Total Revenue" value={`KSh ${(safeStats.balance || 0).toLocaleString()}`} color="green" />
          <StatCard icon={ShoppingCart} label="Total Orders" value={safeStats.total_orders || "0"} color="blue" />
          <StatCard icon={Package} label="Active Products" value={totalProducts.toString()} color="blue" />
          <StatCard icon={Eye} label="Shop Views" value={safeStats.views || "0"} color="purple" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Recent Activity</h3>
            <a href="/seller-dashboard/customers" className="text-orange-600 hover:text-orange-700 font-semibold text-sm">View All →</a>
          </div>

          {recentVisitors.length > 0 && (
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Shop Visitors</h4>
              <div className="space-y-2">
                {recentVisitors.slice(0, 5).map((visitor) => (
                  <div key={visitor.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{visitor.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{visitor.action}</p>
                    </div>
                    <p className="text-xs text-gray-500 ml-2">{visitor.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Orders</h4>
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
                    <tr key={order.order_id || order.id || 'N/A'} className="border-b border-gray-100 dark:border-slate-800">
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{order.order_id || order.id || 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">KSh {(order.total_amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          (order.status === 'delivered' || order.status === 'completed')
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
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 truncate">{product.title_en || product.title || 'Untitled Product'}</p>
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
