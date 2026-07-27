"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Search, Filter, MoreVertical, Loader,
  LayoutDashboard, Users, UserCheck, DollarSign, Truck,
  Store, Grid3x3, Tag, Percent, MessageSquare, Shield,
  AlertTriangle, TrendingUp, FileText, AlertCircle, BarChart3,
  Zap, Package, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';

const adminNavItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/admin-dashboard' },
  { label: 'Agent Dashboard', icon: <TrendingUp className="w-5 h-5" />, href: '/agent-dashboard' },
  { label: 'Users', icon: <Users className="w-5 h-5" />, href: '/admin-users' },
  { label: 'Shops', icon: <Store className="w-5 h-5" />, href: '/admin-shops' },
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

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':   return 'badge badge-green';
    case 'confirmed':   return 'badge badge-blue';
    case 'pending':     return 'badge badge-yellow';
    case 'payment_pending': return 'badge badge-orange';
    case 'cancelled':   return 'badge badge-red';
    case 'processing':  return 'badge badge-purple';
    default:            return 'badge badge-gray';
  }
}

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':  return <CheckCircle className="w-3.5 h-3.5" />;
    case 'cancelled':  return <XCircle className="w-3.5 h-3.5" />;
    default:           return <Clock className="w-3.5 h-3.5" />;
  }
}

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.id?.toString().includes(searchQuery) ||
      (o.customer?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statuses = ['all', ...Array.from(new Set(orders.map(o => o.status).filter(Boolean)))];

  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const pendingCount = orders.filter(o => o.status?.includes('pending')).length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  if (loading) {
    return (
      <DashboardLayout title="Orders Management" navItems={adminNavItems} userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-gray-500 text-sm">Loading orders…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Orders Management" navItems={adminNavItems} userRole="admin">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">All Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">Monitor and manage customer orders</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-7">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{orders.length}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Orders</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{completedCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Completed</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{pendingCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Pending</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">Ksh {Math.round(totalRevenue / 1000)}k</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID or customer…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 cursor-pointer"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>
            ))}
          </select>
          <button className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl flex items-center gap-2 transition-colors shadow-sm text-sm font-medium">
            <Filter className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="data-table-wrapper">
          <div className="py-20 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td>
                      <span className="font-bold text-sky-600 font-mono text-xs bg-sky-50 px-2 py-1 rounded-lg">
                        #{order.id?.toString().slice(0, 12)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(order.customer?.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{order.customer?.full_name || 'Unknown'}</p>
                          {order.customer?.phone && <p className="text-xs text-gray-400">{order.customer.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-gray-600 font-medium">
                        {order.items?.length || order.item_count || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-gray-900">
                        Ksh {Math.round(order.total_amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadge(order.status)}>
                        {getStatusIcon(order.status)}
                        {(order.status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-500 text-xs">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{orders.length}</span> orders
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
