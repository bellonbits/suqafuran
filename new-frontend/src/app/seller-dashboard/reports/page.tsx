"use client";

import React from 'react';
import { Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports</h1>
        <p className="text-gray-600 dark:text-slate-400">Generate and download business reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Reports Generated</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Last Generated</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">3 days ago</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Report Size</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">12.4 MB</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Available Reports</h2>
        <div className="space-y-4">
          {['Sales Report', 'Customer Report', 'Inventory Report', 'Revenue Report'].map((report, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
              <p className="font-semibold text-gray-900 dark:text-white">{report}</p>
              <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
