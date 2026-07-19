"use client";

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Financial Dashboard</h1>
        <p className="text-gray-600 dark:text-slate-400">Monitor your earnings and payouts</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 dark:text-slate-400 text-sm">Gross Revenue</p>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">KSh 245,000</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 dark:text-slate-400 text-sm">Marketplace Fees</p>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">KSh 8,000</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 dark:text-slate-400 text-sm">Refunds</p>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">KSh 2,000</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 dark:text-slate-400 text-sm">Net Earnings</p>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">KSh 235,000</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Pending Payouts</p>
          <p className="text-3xl font-bold text-orange-600">KSh 45,000</p>
          <p className="text-xs text-gray-500 mt-2">Next payout: Jan 5</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Completed Payouts</p>
          <p className="text-3xl font-bold text-green-600">KSh 950,000</p>
          <p className="text-xs text-gray-500 mt-2">Last payout: Jan 1</p>
        </div>
      </div>
    </div>
  );
}
