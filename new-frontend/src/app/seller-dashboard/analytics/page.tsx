"use client";

import React from 'react';
import { TrendingUp, Users, Eye, ShoppingCart } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
        <p className="text-gray-600 dark:text-slate-400">Track your shop performance and customer behavior</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-slate-400 text-xs">Shop Views</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">3,245</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-slate-400 text-xs">Total Orders</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">248</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-slate-400 text-xs">Unique Visitors</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">1,823</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-slate-400 text-xs">Conversion Rate</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">6.8%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
