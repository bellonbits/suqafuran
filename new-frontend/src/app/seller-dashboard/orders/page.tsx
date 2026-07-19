"use client";

import React, { useState } from 'react';
import { Search, Filter, Eye } from 'lucide-react';

export default function OrdersPage() {
  const [orders] = useState([
    { id: 'ORD-001', customer: 'Ahmed Mohamed', items: 2, amount: 'KSh 5,200', date: '2 hours ago', status: 'Delivered' },
    { id: 'ORD-002', customer: 'Zainab Ali', items: 1, amount: 'KSh 3,800', date: '4 hours ago', status: 'Processing' },
    { id: 'ORD-003', customer: 'Fatima Hassan', items: 3, amount: 'KSh 8,100', date: '6 hours ago', status: 'Pending' },
    { id: 'ORD-004', customer: 'Khalid Omar', items: 1, amount: 'KSh 4,500', date: '1 day ago', status: 'Delivered' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Orders</h1>
        <p className="text-gray-600 dark:text-slate-400">Manage customer orders</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">248</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Pending</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Processing</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">28</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Delivered</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">205</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search orders..." className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
        </div>
        <button className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Order ID</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Customer</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Items</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Amount</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Date</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{order.id}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{order.customer}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{order.items}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{order.amount}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{order.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                    }`}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4"><button className="text-blue-600 hover:text-blue-700"><Eye className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
