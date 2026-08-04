"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  LayoutDashboard, Package, Users, DollarSign, TrendingUp,
  ShoppingCart, Eye, UserCheck, AlertTriangle,
  ArrowLeft, Menu, X, Search, Loader, Zap, Grid3x3,
  FileText, MessageSquare, Shield, Tag, Percent, TrendingDown,
  Activity
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AdminHeader } from '@/components/AdminHeader';
import api from '@/services/api';
import { ADMIN_NAV_ITEMS } from '@/admin-dashboard/navigation';

const AdminDashboard = () => {
  const [showSellerHub, setShowSellerHub] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch admin stats
      const statsRes = await api.get('/admin/stats').catch(() => null);
      if (statsRes?.data) setStats(statsRes.data);

      // Fetch recent checkout activity
      const ordersRes = await api.get('/admin/orders?limit=10').catch(() => null);
      if (ordersRes?.data) setOrders(Array.isArray(ordersRes.data) ? ordersRes.data.slice(0, 10) : []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = ADMIN_NAV_ITEMS.map(({ icon: Icon, ...item }) => ({
    ...item,
    icon: <Icon className="w-5 h-5" />
  }));

  const metrics = [
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Total Users',
      value: stats?.total_users?.toString() || '0',
      subtext: `${stats?.new_users_this_week || 0} this week`,
      trend: 'up' as const,
      trendPercent: 12,
      color: 'blue' as const,
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      label: 'Total Orders',
      value: stats?.total_orders?.toString() || '0',
      subtext: `${stats?.pending_orders || 0} pending`,
      trend: 'up' as const,
      trendPercent: 8,
      color: 'green' as const,
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Total Revenue',
      value: `Ksh ${Math.round((stats?.total_revenue || 0) / 1000)}k`,
      subtext: 'All time revenue',
      trend: 'up' as const,
      trendPercent: 23,
      color: 'purple' as const,
    },
  ];


  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" navItems={navItems} userRole="admin">
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <AdminHeader />
      <DashboardLayout
        title="Admin Dashboard"
        navItems={navItems}
        userRole="admin"
      >
      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {metrics.map((metric, idx) => (
          <MetricCard key={idx} {...metric} />
        ))}
      </motion.div>

      {/* Seller Hub Section - if admin is also a seller */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 p-6 bg-purple-50 rounded-xl border border-purple-200"
      >
        <div>
          <p className="text-sm text-purple-600 font-semibold mb-2">My Sales (Seller)</p>
          <p className="text-3xl font-black text-gray-900">{stats?.seller_sales || 0}</p>
          <p className="text-xs text-gray-500 mt-1">↑ {stats?.seller_sales_trend || 0}% this month</p>
        </div>
        <div>
          <p className="text-sm text-purple-600 font-semibold mb-2">Seller Revenue</p>
          <p className="text-3xl font-black text-gray-900">Ksh {Math.round((stats?.seller_revenue || 0) / 1000)}k</p>
          <p className="text-xs text-gray-500 mt-1">↑ {stats?.seller_revenue_trend || 0}% earnings</p>
        </div>
        <div>
          <p className="text-sm text-purple-600 font-semibold mb-2">Active Products</p>
          <p className="text-3xl font-black text-gray-900">{stats?.seller_active_products || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.seller_out_of_stock || 0} out of stock</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/seller-dashboard'}
          className="w-full h-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors"
        >
          Go to Seller Dashboard →
        </motion.button>
      </motion.div>

      {/* Management Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <h2 className="text-2xl font-black text-gray-900 mb-6">Management Hub</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Users', icon: Users, href: '/admin-users', color: 'blue' },
            { label: 'Listings', icon: Grid3x3, href: '/admin-listings', color: 'green' },
            { label: 'Verifications', icon: UserCheck, href: '/admin-verifications', color: 'purple' },
            { label: 'Categories', icon: Zap, href: '/admin-categories', color: 'orange' },
            { label: 'Support', icon: MessageSquare, href: '/admin-support', color: 'cyan' },
            { label: 'Fraud Detection', icon: Shield, href: '/admin-fraud', color: 'red' },
            { label: 'Unusual Accounts', icon: AlertTriangle, href: '/admin-unusual-accounts', color: 'yellow' },
            { label: 'Marketing', icon: TrendingUp, href: '/admin-marketing', color: 'green' },
            { label: 'Reports', icon: FileText, href: '/admin-reports', color: 'blue' },
            { label: 'Orders', icon: ShoppingCart, href: '/admin-orders', color: 'purple' },
          ].map((item, idx) => {
            const colorClasses: any = {
              blue: 'bg-blue-50 border-blue-200 text-[#5bc0e8] hover:bg-[#e0f7ff]',
              green: 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100',
              purple: 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100',
              orange: 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100',
              pink: 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100',
              indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100',
              cyan: 'bg-cyan-50 border-cyan-200 text-#6cd4ff hover:bg-#e0f7ff',
              red: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100',
              yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100',
            };
            const Icon = item.icon;
            return (
              <Link key={idx} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${colorClasses[item.color as keyof typeof colorClasses]}`}
                >
                  <Icon className="w-6 h-6 mb-3" />
                  <p className="font-bold text-sm">{item.label}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Seller Hub Banner (if admin is also a seller) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setShowSellerHub(!showSellerHub)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black mb-2">My Seller Hub</h3>
            <p className="text-purple-100">Access your seller dashboard and manage products, orders & earnings</p>
          </div>
          <TrendingUp className="w-16 h-16 opacity-20" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders — same data as the Orders page (checkout receipts) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-gray-900">Recent Orders</h2>
            <Link href="/admin-orders" className="text-[#6cd4ff] hover:text-sky-700 text-sm font-semibold">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {orders.length > 0 ? (
              orders.map((order) => {
                const contacted = order.contacted_whatsapp || order.contacted_call || order.contacted_message;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[#c0eeff] flex items-center justify-center text-[#6cd4ff] font-bold flex-shrink-0 text-xs">
                          #
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{order.customer?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 truncate">{order.seller?.shop_name || 'Unknown Shop'} · {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">Ksh {(order.total_amount || 0).toLocaleString()}</p>
                      <p className={`text-xs font-semibold mt-1 ${contacted ? 'text-green-600' : 'text-yellow-600'}`}>
                        {contacted ? 'Contacted seller' : 'No contact yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No orders available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats - Only if data available */}
        {(stats?.system_sessions || stats?.system_success_rate || stats?.system_response_time || stats?.system_uptime) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-black text-gray-900 mb-6">System Health</h2>
            <div className="space-y-4">
              {stats?.system_sessions && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Active Sessions</span>
                  <span className="font-bold text-[#5bc0e8]">{stats.system_sessions.toLocaleString()}</span>
                </div>
              )}
              {stats?.system_success_rate && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Success Rate</span>
                  <span className="font-bold text-green-600">{stats.system_success_rate}%</span>
                </div>
              )}
              {stats?.system_response_time && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Avg Response</span>
                  <span className="font-bold text-purple-600">{stats.system_response_time}ms</span>
                </div>
              )}
              {stats?.system_uptime && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">System Uptime</span>
                  <span className="font-bold text-orange-600">{stats.system_uptime}%</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      </DashboardLayout>
    </>
  );
};

export default AdminDashboard;
