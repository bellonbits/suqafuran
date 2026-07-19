"use client";

import React from 'react';
import { Search, Filter } from 'lucide-react';

export default function CustomersPage() {
  const customers = [
    { id: 1, name: 'Ahmed Mohamed', email: 'ahmed@gmail.com', orders: 5, spent: 'KSh 26,000' },
    { id: 2, name: 'Zainab Ali', email: 'zainab@gmail.com', orders: 2, spent: 'KSh 8,600' },
    { id: 3, name: 'Fatima Hassan', email: 'fatima@gmail.com', orders: 8, spent: 'KSh 58,200' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Customers</h1>
        <p className="text-gray-600 dark:text-slate-400">Manage and view customer information</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">342</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Repeat Customers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">89</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Avg Order Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">KSh 5,200</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search customers..." className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
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
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Name</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Email</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Orders</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{customer.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{customer.email}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{customer.orders}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{customer.spent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
