"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Loader, Eye, Clock, CheckCircle, AlertCircle, LayoutDashboard, ShoppingBag, Package, BarChart3, DollarSign, MessageCircle, Settings } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  seller_amount: number;
  delivery_option: string;
  created_at: string;
  items?: any[];
}

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
  switch (status?.toLowerCase()) {
    case 'pending':          return 'badge badge-yellow';
    case 'confirmed':        return 'badge badge-blue';
    case 'preparing':        return 'badge badge-purple';
    case 'ready_for_pickup': return 'badge badge-orange';
    case 'delivered':        return 'badge badge-green';
    case 'cancelled':        return 'badge badge-red';
    default:                 return 'badge badge-gray';
  }
}

export default function SellerOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/sellers/me/orders?limit=50');
      if (res.data && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout title="My Orders" navItems={sellerNavItems} userRole="seller">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-gray-500 text-sm font-medium">Loading orders database...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Orders" navItems={sellerNavItems} userRole="seller">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Manage Shop Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">Filter, fulfill, and monitor customer orders</p>
        </div>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 cursor-pointer font-semibold"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready_for_pickup">Ready for Pickup</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-5 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Status</th>
                <th className="text-right">Total Amount</th>
                <th className="text-right">Your Earning</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-gray-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: Order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="font-mono text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-lg font-bold">
                        #{order.id.slice(0, 12)}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-500 text-xs font-medium">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-bold text-gray-900">
                        Ksh {order.total_amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="font-bold text-emerald-600">
                        Ksh {order.seller_amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-center">
                      <Link href={`/seller-orders/${order.id}`}>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-bold transition-all">
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
