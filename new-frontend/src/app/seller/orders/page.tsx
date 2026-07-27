"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, Loader, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-[#e0f7ff] text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready_for_pickup: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6 justify-between">
          <div className="flex items-center gap-4">
            <Link href="/seller-dashboard" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <h1 className="text-3xl font-black text-white">My Orders ({orders.length})</h1>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#6cd4ff]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-[#6cd4ff]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready_for_pickup">Ready for Pickup</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-6 bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300"
        >
          {error}
        </motion.div>
      )}

      {/* Orders Table */}
      <div className="p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No orders found</p>
            <p className="text-slate-400 text-sm">
              {orders.length === 0 ? 'You have no orders yet' : 'No orders match your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 font-bold text-slate-300">Order ID</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-300">Date</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-300">Status</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-300">Amount</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-300">Your Earning</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-sky-400">{order.id}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || 'bg-gray-700 text-gray-300'}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-green-400">
                      Ksh {order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-[#6cd4ff]">
                      Ksh {order.seller_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link href={`/seller/orders/${order.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg transition-colors font-bold text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </motion.button>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
