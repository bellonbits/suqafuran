"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, ShoppingBag, DollarSign, Loader, ArrowLeft, TrendingUp,
  Package, Clock, CheckCircle, XCircle, Eye, Edit2, Plus, Settings,
  Activity, Zap, LineChart, MessageCircle, TrendingUpIcon
} from 'lucide-react';
import api from '@/services/api';

const SellerDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/sellers/me/dashboard').catch((err) => {
          if (err.response?.status === 403) {
            const detail = err.response?.data?.detail || 'Seller account verification required';
            setVerificationStatus(detail);
          }
          return null;
        }),
        api.get('/sellers/me/orders?limit=10').catch(() => null)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  if (verificationStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Required</h1>
          <p className="text-gray-600 mb-6">{verificationStatus}</p>
          <Link href="/" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="inline-block bg-blue-500 hover:bg-[#5bc0e8] text-white font-bold py-2 px-6 rounded-full">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      confirmed: { bg: 'bg-[#e0f7ff]', text: 'text-blue-700' },
      preparing: { bg: 'bg-purple-100', text: 'text-purple-700' },
      ready_for_pickup: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      delivered: { bg: 'bg-green-100', text: 'text-green-700' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700' }
    };
    const badge = badges[status] || badges.pending;
    return badge;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-gray-900">Seller Dashboard</h1>
                <p className="text-gray-500 mt-0.5">Manage your shop, products & orders</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sell" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c0eeff] text-sky-700 hover:bg-sky-200 transition-colors font-bold">
                <Plus className="w-4 h-4" />
                New Product
              </Link>
              <Link href="/seller-products" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-bold">
                <ShoppingBag className="w-4 h-4" />
                View Products
              </Link>
              <Link href="/seller-profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
          <Link href="/seller-dashboard" className="px-4 py-2 font-bold text-[#6cd4ff] border-b-2 border-sky-600 text-sm whitespace-nowrap">
            Dashboard
          </Link>
          <Link href="/seller-products" className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900 text-sm whitespace-nowrap">
            Products
          </Link>
          <Link href="/seller-orders" className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900 text-sm whitespace-nowrap">
            Orders
          </Link>
          <Link href="/seller-analytics" className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900 text-sm whitespace-nowrap">
            Analytics
          </Link>
          <Link href="/seller-earnings" className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900 text-sm whitespace-nowrap">
            Earnings
          </Link>
          <Link href="/seller-messages" className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900 text-sm whitespace-nowrap">
            Messages
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Today's Overview */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#6cd4ff]" />
            <h2 className="text-lg font-black text-gray-900">Today's Overview</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-sky-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Today's Sales</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">
                    Ksh {(stats?.today_sales || 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
              </div>
              <p className="text-xs text-gray-400 mt-3">{stats?.today_orders_count || 0} orders today</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-sky-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Pending Orders</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">{stats?.pending_orders || 0}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500 opacity-20" />
              </div>
              <Link href="/seller-orders" className="text-xs text-[#6cd4ff] mt-3 inline-block hover:underline">
                View pending →
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-sky-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">{stats?.completed_orders || 0}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
              </div>
              <p className="text-xs text-gray-400 mt-3">Orders delivered</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-sky-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Avg Rating</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">{stats?.average_rating || 0}/5</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-500 opacity-20" />
              </div>
              <p className="text-xs text-gray-400 mt-3">Response: {stats?.response_time || 0}h avg</p>
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-black text-gray-900">Key Metrics</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <p className="text-4xl font-black text-green-600 mt-2">
                Ksh {(stats?.total_revenue || 0).toLocaleString()}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/seller/earnings" className="text-sm text-[#6cd4ff] font-bold hover:underline">
                  View detailed earnings →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-gray-500 text-sm font-medium">Active Products</p>
              <p className="text-4xl font-black text-[#5bc0e8] mt-2">{stats?.product_count || 0}</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/seller-products" className="text-sm text-[#6cd4ff] font-bold hover:underline">
                  Manage products →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-gray-500 text-sm font-medium">Store Status</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-3 h-3 rounded-full ${stats?.store_status === 'open' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className="text-2xl font-black text-gray-900 capitalize">{stats?.store_status || 'closed'}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/seller-profile" className="text-sm text-[#6cd4ff] font-bold hover:underline">
                  Update hours →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Top Selling Products */}
        {stats?.top_products && stats.top_products.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-black text-gray-900">Top Selling Products</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Product</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Quantity Sold</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Revenue</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_products.map((product: any) => (
                      <tr key={product.product_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold line-clamp-2">{product.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{product.quantity_sold} units</td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">Ksh {product.revenue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm">
                          <Link href={`/seller-products/${product.product_id}/edit`} className="text-[#6cd4ff] hover:text-sky-700 font-bold">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Recent Orders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-black text-gray-900">Recent Orders</h2>
            </div>
              <Link href="/seller/orders" className="text-sm text-[#6cd4ff] font-bold hover:underline">
                View all →
              </Link>
            </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Items</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">#{order.id.substring(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{order.items?.length || 0} item(s)</td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                          Ksh {Math.round(order.total_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(order.status).bg} ${getStatusBadge(order.status).text}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link href={`/seller/orders/${order.id}`} className="text-[#6cd4ff] hover:text-sky-700 font-bold">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-black text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/seller/register" className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all text-center">
              <Plus className="w-8 h-8 text-[#6cd4ff] mx-auto mb-3" />
              <p className="font-bold text-gray-900">Add Product</p>
              <p className="text-xs text-gray-500 mt-1">List new items for sale</p>
            </Link>

            <Link href="/seller/orders" className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all text-center">
              <ShoppingBag className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <p className="font-bold text-gray-900">View Orders</p>
              <p className="text-xs text-gray-500 mt-1">Manage order statuses</p>
            </Link>

            <Link href="/seller/earnings" className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all text-center">
              <LineChart className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <p className="font-bold text-gray-900">Earnings</p>
              <p className="text-xs text-gray-500 mt-1">View payments & withdrawals</p>
            </Link>

            <Link href="/seller-profile" className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all text-center">
              <Settings className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <p className="font-bold text-gray-900">Settings</p>
              <p className="text-xs text-gray-500 mt-1">Update shop details</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SellerDashboard;
