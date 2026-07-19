"use client";

import React from 'react';
import { Plus } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Marketing</h1>
          <p className="text-gray-600 dark:text-slate-400">Boost your sales with promotions</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Active Promotions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Clicks</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">1,245</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Conversion Rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">8.5%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Active Campaigns</h2>
        <div className="space-y-4">
          {['Summer Sale 2026', 'Flash Deal - Electronics', 'Bundle Offers'].map((campaign, i) => (
            <div key={i} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{campaign}</p>
                </div>
                <button className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
