"use client";

import React from 'react';
import { Radio, Activity } from 'lucide-react';

export default function LiveEventsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Radio className="w-8 h-8 text-green-600 animate-pulse" />
          Live Events
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Real-time event streaming from Kafka and WebSocket</p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-green-900 dark:text-green-300">Live Stream Active</span>
        </div>
        <p className="text-green-800 dark:text-green-400 text-sm">
          WebSocket connection established • Listening for events on kafka:9092
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Event Stream
        </h2>
        <div className="bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-700 p-6 font-mono text-sm text-green-400 overflow-auto max-h-96">
          <div className="space-y-1 text-xs">
            <div>[2026-07-17 09:15:24] → user_created: user_id=1001</div>
            <div>[2026-07-17 09:15:25] → order_placed: order_id=5023, amount=45000</div>
            <div>[2026-07-17 09:15:26] → payment_confirmed: txn_id=TXN123456</div>
            <div>[2026-07-17 09:15:27] → delivery_assigned: delivery_id=2045, rider=15</div>
            <div>[2026-07-17 09:15:28] → alert_triggered: rule=high_error_rate, severity=warning</div>
            <div className="text-gray-500">[waiting for events...]</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">247</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Events/min</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">98%</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Delivery Rate</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">1.2s</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg Latency</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">5</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Topics</p>
        </div>
      </div>
    </div>
  );
}
