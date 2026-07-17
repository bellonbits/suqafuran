"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  LayoutDashboard, Package, Users, DollarSign, TrendingUp,
  ShoppingCart, AlertCircle, Eye, UserCheck, BarChart3,
  Truck, MapPin, Clock, CheckCircle, AlertTriangle, XCircle,
  ArrowLeft, Menu, X, Bell, Search, Loader, Zap, Grid3x3,
  FileText, MessageSquare, Shield, Tag, Percent, TrendingDown,
  Activity, Radio, Network
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AdminHeader } from '@/components/AdminHeader';
import api from '@/services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSellerHub, setShowSellerHub] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch admin stats
      const statsRes = await api.get('/admin/stats').catch(() => null);
      if (statsRes?.data) setStats(statsRes.data);

      // Fetch orders
      const ordersRes = await api.get('/admin/orders?limit=10').catch(() => null);
      if (ordersRes?.data) setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);

      // Fetch recent transactions
      const txRes = await api.get('/promotions/agent/payment-queue').catch(() => null);
      if (txRes?.data) setTransactions(Array.isArray(txRes.data) ? txRes.data.slice(0, 5) : []);

      // Fetch deliveries
      const delRes = await api.get('/delivery/my/delivery?limit=10').catch(() => null);
      if (delRes?.data) setDeliveries(Array.isArray(delRes.data) ? delRes.data : []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/admin-dashboard' },
    { label: 'Agent Dashboard', icon: <TrendingUp className="w-5 h-5" />, href: '/agent-dashboard' },
    { label: 'Users', icon: <Users className="w-5 h-5" />, href: '/admin-users' },
    { label: 'Listings', icon: <Grid3x3 className="w-5 h-5" />, href: '/admin-listings' },
    { label: 'Verifications', icon: <UserCheck className="w-5 h-5" />, href: '/admin-verifications' },
    { label: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, href: '/admin-orders' },
    { label: 'Transactions', icon: <DollarSign className="w-5 h-5" />, href: '/admin-transactions' },
    { label: 'Deliveries', icon: <Truck className="w-5 h-5" />, href: '/admin-deliveries' },
    { label: 'Sellers', icon: <Package className="w-5 h-5" />, href: '/admin-sellers' },
    { label: 'Categories', icon: <Zap className="w-5 h-5" />, href: '/admin-categories' },
    { label: 'Vouchers', icon: <Tag className="w-5 h-5" />, href: '/admin-vouchers' },
    { label: 'Promotions', icon: <Percent className="w-5 h-5" />, href: '/admin-promotions' },
    { label: 'Support', icon: <MessageSquare className="w-5 h-5" />, href: '/admin-support' },
    { label: 'Fraud', icon: <Shield className="w-5 h-5" />, href: '/admin-fraud' },
    { label: 'Unusual Accounts', icon: <AlertTriangle className="w-5 h-5" />, href: '/admin-unusual-accounts' },
    { label: 'Marketing', icon: <TrendingUp className="w-5 h-5" />, href: '/admin-marketing' },
    { label: 'Reports', icon: <FileText className="w-5 h-5" />, href: '/admin-reports' },
    { label: 'Disputes', icon: <AlertCircle className="w-5 h-5" />, href: '/admin-disputes' },
    { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/admin-analytics' },
  ];

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
    {
      icon: <Truck className="w-6 h-6" />,
      label: 'Active Deliveries',
      value: stats?.active_deliveries?.toString() || '0',
      subtext: `${stats?.delayed_deliveries || 0} delayed`,
      trend: 'down' as const,
      trendPercent: 5,
      color: 'orange' as const,
    },
  ];


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 bg-green-50';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'Failed':
        return 'text-red-600 bg-red-50';
      case 'In Transit':
        return 'text-[#5bc0e8] bg-blue-50';
      case 'Delivered':
        return 'text-green-600 bg-green-50';
      case 'Pickup':
        return 'text-purple-600 bg-purple-50';
      case 'Delayed':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'Failed':
        return <XCircle className="w-4 h-4" />;
      case 'Delayed':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

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

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {['overview', 'monitoring', 'transactions', 'deliveries'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold border-b-2 transition-all ${
              activeTab === tab
                ? 'border-sky-600 text-[#6cd4ff]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

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
            { label: 'Vouchers', icon: Tag, href: '/admin-vouchers', color: 'pink' },
            { label: 'Promotions', icon: Percent, href: '/admin-promotions', color: 'indigo' },
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900">Recent Orders</h2>
              <button className="text-[#6cd4ff] hover:text-sky-700 text-sm font-semibold">
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[#c0eeff] flex items-center justify-center text-[#6cd4ff] font-bold flex-shrink-0 text-xs">
                          #
                        </div>
                        <p className="font-semibold text-gray-900 truncate">Order #{order.id}</p>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(order.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">Ksh {(order.total || 0).toLocaleString()}</p>
                      <p className={`text-xs font-semibold mt-1 ${order.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {order.status || 'Processing'}
                      </p>
                    </div>
                  </div>
                ))
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
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-gray-900">All Transactions</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors">
                Filter
              </button>
              <button className="px-4 py-2 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition-colors">
                Export
              </button>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Transaction ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Seller</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#6cd4ff]">{txn.id}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{txn.customer}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{txn.seller}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{txn.product}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{txn.amount}</td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(txn.status)}`}>
                          {getStatusIcon(txn.status)}
                          {txn.status}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{txn.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No transactions available</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Deliveries Tab */}
      {activeTab === 'deliveries' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900">All Deliveries</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors">
                  Filter
                </button>
                <button className="px-4 py-2 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition-colors">
                  Real-time Map
                </button>
              </div>
            </div>

            {deliveries.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">Delivery #{delivery.id}</span>
                          {delivery.order && <span className="text-xs text-gray-500">Order {delivery.order}</span>}
                        </div>
                        {(delivery.from || delivery.to) && (
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {delivery.from} → {delivery.to}
                            </div>
                          </div>
                        )}
                        {delivery.rider && <div className="text-sm text-gray-600 mt-2">Rider: {delivery.rider}</div>}
                      </div>
                      {delivery.status && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                          {getStatusIcon(delivery.status)}
                          {delivery.status}
                        </div>
                      )}
                    </div>

                    {delivery.progress !== undefined && (
                      <div className="space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600">Progress</span>
                            <span className="text-xs font-bold text-gray-900">{delivery.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                delivery.status === 'Delivered'
                                  ? 'bg-green-500'
                                  : delivery.status === 'Delayed'
                                    ? 'bg-orange-500'
                                    : 'bg-[#e0f7ff]0'
                              }`}
                              style={{ width: `${delivery.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* ETA */}
                        {delivery.eta && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              ETA: {delivery.eta}
                            </div>
                            <button className="text-xs text-[#6cd4ff] hover:text-sky-700 font-semibold">
                              Track on Map →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No deliveries available</p>
              </div>
            )}
          </div>

          {/* Delivery Statistics - Only show if we have delivery data */}
          {(stats?.deliveries_in_transit || stats?.deliveries_delivered || stats?.deliveries_delayed || stats?.avg_delivery_time) && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {stats?.deliveries_in_transit !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">In Transit</p>
                      <p className="text-3xl font-black text-[#5bc0e8]">{stats.deliveries_in_transit}</p>
                    </div>
                    <Truck className="w-12 h-12 text-blue-100" />
                  </div>
                </motion.div>
              )}

              {stats?.deliveries_delivered !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Delivered</p>
                      <p className="text-3xl font-black text-green-600">{stats.deliveries_delivered.toLocaleString()}</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-100" />
                  </div>
                </motion.div>
              )}

              {stats?.deliveries_delayed !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Delayed</p>
                      <p className="text-3xl font-black text-orange-600">{stats.deliveries_delayed}</p>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-orange-100" />
                  </div>
                </motion.div>
              )}

              {stats?.avg_delivery_time && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Avg Time</p>
                      <p className="text-3xl font-black text-purple-600">{stats.avg_delivery_time}m</p>
                    </div>
                    <Clock className="w-12 h-12 text-purple-100" />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">System Monitoring</h2>
            <p className="text-gray-600">Monitor alerts, events, and system health in real-time</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin-dashboard/monitoring/alerts">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg rounded-lg p-6 border border-blue-200 cursor-pointer transition">
                <Bell className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Alert Rules</h3>
                <p className="text-sm text-gray-600">View & manage alert rules</p>
              </div>
            </Link>

            <Link href="/admin-dashboard/monitoring/live">
              <div className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg rounded-lg p-6 border border-green-200 cursor-pointer transition">
                <Radio className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Live Events</h3>
                <p className="text-sm text-gray-600">Real-time event stream</p>
              </div>
            </Link>

            <Link href="/admin-dashboard/monitoring/notifications">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg rounded-lg p-6 border border-purple-200 cursor-pointer transition">
                <AlertCircle className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Notifications</h3>
                <p className="text-sm text-gray-600">Alert delivery logs</p>
              </div>
            </Link>

            <Link href="/admin-dashboard/monitoring/kafka">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg rounded-lg p-6 border border-orange-200 cursor-pointer transition">
                <Network className="w-8 h-8 text-orange-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Kafka Streams</h3>
                <p className="text-sm text-gray-600">Message broker metrics</p>
              </div>
            </Link>

            <Link href="/admin-dashboard/monitoring/traces">
              <div className="bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg rounded-lg p-6 border border-red-200 cursor-pointer transition">
                <Zap className="w-8 h-8 text-red-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Distributed Traces</h3>
                <p className="text-sm text-gray-600">Jaeger request tracing</p>
              </div>
            </Link>

            <a href="http://165.22.13.173:16686" target="_blank" rel="noopener noreferrer">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-lg rounded-lg p-6 border border-indigo-200 cursor-pointer transition">
                <BarChart3 className="w-8 h-8 text-indigo-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Jaeger UI</h3>
                <p className="text-sm text-gray-600">Full distributed tracing</p>
              </div>
            </a>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Events/min</p>
                <p className="text-2xl font-bold text-blue-600">247</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Delivery Rate</p>
                <p className="text-2xl font-bold text-green-600">98%</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Avg Latency</p>
                <p className="text-2xl font-bold text-purple-600">127ms</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Active Alerts</p>
                <p className="text-2xl font-bold text-orange-600">3</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </DashboardLayout>
    </>
  );
};

export default AdminDashboard;
