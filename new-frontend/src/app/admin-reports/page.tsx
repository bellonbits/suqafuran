"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader, ArrowLeft, Download, BarChart3, Users, ShoppingCart, DollarSign } from 'lucide-react';
import api from '@/services/api';

const ReportsPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('orders');

  useEffect(() => {
    loadReports();
  }, [reportType]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get(`/admin/stats`).catch(() => null);
      if (statsRes?.data) setStats(statsRes.data);

      const ordersRes = await api.get(`/admin/orders?limit=1000`).catch(() => null);
      if (ordersRes?.data) setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Status', 'Amount', 'Date'];
    const rows = orders.map((o) => [
      o.id,
      o.status,
      o.total_amount,
      new Date(o.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500 mt-1">Export data and view system reports</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <ShoppingCart className="w-10 h-10 text-[#6cd4ff] mb-4" />
            <p className="text-3xl font-black text-gray-900">{stats?.total_orders || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total Orders</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Users className="w-10 h-10 text-green-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{stats?.total_users || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total Users</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <DollarSign className="w-10 h-10 text-purple-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">Ksh {(stats?.total_revenue || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <BarChart3 className="w-10 h-10 text-orange-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{stats?.avg_order_value || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Avg Order Value</p>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">Export Data</h2>
              <p className="text-gray-500 text-sm mt-1">Download order data as CSV</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-3 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg font-bold transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Orders Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-black text-gray-900">Recent Orders</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Order ID</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Amount</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 20).map((order, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">{order.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      order.status === 'delivered'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-[#e0f7ff] text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">Ksh {order.total_amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
