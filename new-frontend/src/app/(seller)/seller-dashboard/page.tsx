"use client";

import React, { useState } from 'react';
import {
  DollarSign, ShoppingCart, Package, TrendingUp,
  AlertCircle, Eye, MessageSquare, Star, Clock, CheckCircle, XCircle
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, change, color = 'blue' }: any) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

export default function SellerDashboard() {
  const [timeRange, setTimeRange] = useState('month');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-slate-400">Welcome back! Here's your shop performance.</p>
        </div>
        <div className="flex gap-2">
          {['today', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                timeRange === range
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Stats */}
      <div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Revenue</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value="KSh 125,000"
            change={12}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Revenue Today"
            value="KSh 8,500"
            change={-3}
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            label="This Month"
            value="KSh 245,000"
            change={28}
            color="green"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Payouts"
            value="KSh 45,000"
            color="orange"
          />
        </div>
      </div>

      {/* Orders Stats */}
      <div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Orders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ShoppingCart}
            label="Total Orders"
            value="248"
            change={15}
            color="blue"
          />
          <StatCard
            icon={Clock}
            label="Pending Orders"
            value="12"
            change={5}
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            label="Processing"
            value="28"
            color="purple"
          />
          <StatCard
            icon={CheckCircle}
            label="Delivered"
            value="205"
            change={22}
            color="green"
          />
        </div>
      </div>

      {/* Products Stats */}
      <div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Products & Engagement</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Package}
            label="Active Products"
            value="156"
            change={8}
            color="blue"
          />
          <StatCard
            icon={AlertCircle}
            label="Out of Stock"
            value="3"
            change={-1}
            color="red"
          />
          <StatCard
            icon={Eye}
            label="Shop Views"
            value="3,245"
            change={42}
            color="purple"
          />
          <StatCard
            icon={MessageSquare}
            label="New Messages"
            value="18"
            color="orange"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Recent Orders</h3>
            <a href="/seller-dashboard/orders" className="text-orange-600 hover:text-orange-700 font-semibold text-sm">
              View All →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'ORD-001', customer: 'Ahmed Mohamed', amount: 'KSh 5,200', status: 'Delivered' },
                  { id: 'ORD-002', customer: 'Zainab Ali', amount: 'KSh 3,800', status: 'Processing' },
                  { id: 'ORD-003', customer: 'Fatima Hassan', amount: 'KSh 8,100', status: 'Pending' },
                  { id: 'ORD-004', customer: 'Khalid Omar', amount: 'KSh 4,500', status: 'Delivered' },
                ].map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-slate-800">
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{order.id}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-slate-400">{order.customer}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">{order.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'Delivered'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : order.status === 'Processing'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Top Products</h3>
            <a href="/seller-dashboard/products" className="text-orange-600 hover:text-orange-700 font-semibold text-sm">
              View All →
            </a>
          </div>
          <div className="space-y-4">
            {[
              { name: 'iPhone 15 Pro', sales: 24, revenue: 'KSh 144,000' },
              { name: 'Samsung Galaxy', sales: 18, revenue: 'KSh 90,000' },
              { name: 'AirPods Pro', sales: 32, revenue: 'KSh 38,400' },
              { name: 'iPad Air', sales: 12, revenue: 'KSh 84,000' },
            ].map((product, i) => (
              <div key={i} className="pb-4 border-b border-gray-100 dark:border-slate-800 last:border-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{product.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-slate-400">{product.sales} sales</span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{product.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
