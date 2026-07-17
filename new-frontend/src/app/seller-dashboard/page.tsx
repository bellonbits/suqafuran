"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3, ShoppingBag, DollarSign, Loader, ArrowRight, TrendingUp, Home,
  Package, Clock, CheckCircle, XCircle, Plus, Settings,
  Zap, LineChart, MessageCircle, LayoutDashboard, Star
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';

const sellerNavItems = [
  { label: 'Dashboard',  icon: <LayoutDashboard className="w-5 h-5" />, href: '/seller-dashboard' },
  { label: 'Products',   icon: <ShoppingBag className="w-5 h-5" />,    href: '/seller-products' },
  { label: 'Orders',     icon: <Package className="w-5 h-5" />,         href: '/seller-orders' },
  { label: 'Analytics',  icon: <BarChart3 className="w-5 h-5" />,       href: '/seller-analytics' },
  { label: 'Earnings',   icon: <DollarSign className="w-5 h-5" />,      href: '/seller-earnings' },
  { label: 'Messages',   icon: <MessageCircle className="w-5 h-5" />,   href: '/seller-messages' },
  { label: 'Profile',    icon: <Settings className="w-5 h-5" />,        href: '/seller-profile' },
];

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'pending':          return 'badge badge-yellow';
    case 'confirmed':        return 'badge badge-blue';
    case 'preparing':        return 'badge badge-purple';
    case 'ready_for_pickup': return 'badge badge-orange';
    case 'delivered':        return 'badge badge-green';
    case 'cancelled':        return 'badge badge-red';
    default:                 return 'badge badge-gray';
  }
}

const SellerDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/sellers/me/dashboard').catch((err) => {
          if (err.response?.status === 403) {
            setVerificationStatus(err.response?.data?.detail || 'Seller account verification required');
          }
          return null;
        }),
        api.get('/sellers/me/orders?limit=10').catch(() => null),
      ]);
      if (statsRes?.data) setStats(statsRes.data);
      if (ordersRes?.data) setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Seller Dashboard" navItems={sellerNavItems} userRole="seller">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-gray-500 text-sm">Loading your dashboard…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (verificationStatus) {
    return (
      <DashboardLayout title="Seller Dashboard" navItems={sellerNavItems} userRole="seller">
        <div className="flex items-center justify-center h-64">
          <div className="bg-white rounded-2xl border border-orange-200 p-10 max-w-md w-full text-center shadow-sm">
            <XCircle className="w-14 h-14 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-black text-gray-900 mb-2">Verification Required</h2>
            <p className="text-gray-500 mb-6">{verificationStatus}</p>
            <Link href="/" className="btn-back inline-flex">
              <Home className="w-4 h-4" /> Return to Shops
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Seller Dashboard" navItems={sellerNavItems} userRole="seller">
        <div className="flex items-center justify-center h-64">
          <div className="bg-white rounded-2xl border border-red-200 p-10 max-w-md w-full text-center shadow-sm">
            <XCircle className="w-14 h-14 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-black text-gray-900 mb-2">Error</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-back inline-flex">
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Seller Dashboard" navItems={sellerNavItems} userRole="seller">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">My Seller Hub</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your shop, products & orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sell" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors font-bold text-sm shadow-sm">
            <Plus className="w-4 h-4" /> New Product
          </Link>
          <Link href="/seller-products" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-sm">
            <ShoppingBag className="w-4 h-4" /> Products
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: "Today's Sales",    value: `Ksh ${(stats?.today_sales || 0).toLocaleString()}`, sub: `${stats?.today_orders_count || 0} orders today`, icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Pending Orders',   value: stats?.pending_orders || 0,  sub: 'Awaiting action',          icon: Clock,         color: 'bg-amber-100 text-amber-600' },
          { label: 'Completed Orders', value: stats?.completed_orders || 0, sub: 'Orders delivered',         icon: CheckCircle,   color: 'bg-sky-100 text-sky-600' },
          { label: 'Avg Rating',       value: `${stats?.average_rating || 0}/5`, sub: `${stats?.response_time || 0}h avg response`, icon: Star, color: 'bg-purple-100 text-purple-600' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="stat-card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{c.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue */}
        <div className="stat-card">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Revenue</p>
          <p className="text-4xl font-black text-emerald-600">Ksh {(stats?.total_revenue || 0).toLocaleString()}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/seller-earnings" className="text-sm text-sky-600 font-bold hover:underline flex items-center gap-1">View detailed earnings <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
        {/* Products */}
        <div className="stat-card">
          <p className="text-sm text-gray-500 font-medium mb-1">Active Products</p>
          <p className="text-4xl font-black text-sky-600">{stats?.product_count || 0}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/seller-products" className="text-sm text-sky-600 font-bold hover:underline flex items-center gap-1">Manage products <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
        {/* Store status */}
        <div className="stat-card">
          <p className="text-sm text-gray-500 font-medium mb-1">Store Status</p>
          <div className="flex items-center gap-3 mt-2">
            <div className={`w-3.5 h-3.5 rounded-full ${stats?.store_status === 'open' ? 'bg-emerald-500 shadow-emerald-300 shadow-lg animate-pulse' : 'bg-red-500'}`} />
            <p className="text-2xl font-black text-gray-900 capitalize">{stats?.store_status || 'closed'}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/seller-profile" className="text-sm text-sky-600 font-bold hover:underline flex items-center gap-1">Update hours <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      </div>

      {/* Top selling products */}
      {stats?.top_products?.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" /> Top Selling Products
          </h3>
          <div className="data-table-wrapper">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_products.map((product: any) => (
                    <tr key={product.product_id}>
                      <td>
                        <p className="font-semibold text-gray-900 max-w-xs truncate">{product.title}</p>
                      </td>
                      <td>
                        <span className="font-medium text-gray-700">{product.quantity_sold} units</span>
                      </td>
                      <td>
                        <span className="font-bold text-emerald-600">Ksh {product.revenue.toLocaleString()}</span>
                      </td>
                      <td className="text-right">
                        <Link href={`/seller-products/${product.product_id}/edit`} className="text-sky-500 hover:text-sky-700 font-bold text-sm flex items-center gap-1 justify-end">
                          Edit <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" /> Recent Orders
          </h3>
          <Link href="/seller-orders" className="text-sm text-sky-600 font-bold hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">No orders yet</td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id}>
                      <td>
                        <span className="font-mono text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-lg font-bold">
                          #{order.id?.substring(0, 8)}
                        </span>
                      </td>
                      <td><span className="text-gray-600">{order.items?.length || 0} item(s)</span></td>
                      <td><span className="font-bold text-emerald-600">Ksh {Math.round(order.total_amount || 0).toLocaleString()}</span></td>
                      <td>
                        <span className={getStatusBadgeClass(order.status)}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link href={`/seller-orders/${order.id}`} className="text-sky-500 hover:text-sky-700 font-bold text-sm flex items-center gap-1 justify-end">View <ArrowRight className="w-3.5 h-3.5" /></Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/sell', icon: Plus, label: 'Add Product', sub: 'List new items for sale', color: 'text-sky-500' },
            { href: '/seller-orders', icon: ShoppingBag, label: 'View Orders', sub: 'Manage order statuses', color: 'text-purple-500' },
            { href: '/seller-earnings', icon: LineChart, label: 'Earnings', sub: 'View payments & withdrawals', color: 'text-emerald-500' },
            { href: '/seller-profile', icon: Settings, label: 'Settings', sub: 'Update shop details', color: 'text-orange-500' },
          ].map((a, i) => {
            const Icon = a.icon;
            return (
              <Link key={i} href={a.href} className="stat-card hover:border-sky-300 flex flex-col items-center text-center cursor-pointer transition-all hover:-translate-y-0.5">
                <Icon className={`w-8 h-8 ${a.color} mb-3`} />
                <p className="font-bold text-gray-900">{a.label}</p>
                <p className="text-xs text-gray-400 mt-1">{a.sub}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SellerDashboard;
