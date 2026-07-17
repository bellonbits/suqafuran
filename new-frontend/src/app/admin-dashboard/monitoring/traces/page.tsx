"use client";

import React from 'react';
import { Zap, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export default function TracesPage() {
  const traces = [
    { service: 'backend', operation: 'POST /api/v1/orders', duration: '145ms', status: 'success', timestamp: '09:15:24' },
    { service: 'database', operation: 'SELECT orders', duration: '23ms', status: 'success', timestamp: '09:15:25' },
    { service: 'kafka', operation: 'PUBLISH order.created', duration: '12ms', status: 'success', timestamp: '09:15:26' },
    { service: 'backend', operation: 'POST /api/v1/payments', duration: '432ms', status: 'slow', timestamp: '09:15:27' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Distributed Traces</h1>
        <p className="text-gray-600 dark:text-gray-400">Request tracing via Jaeger and OpenTelemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Traces</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">2,847</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">In 24 hours</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Duration</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">127ms</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Per request</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Success Rate</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">99.8%</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Last hour</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Slow Traces</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">23</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">&gt; 500ms</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Traces</h2>
        <div className="space-y-2">
          {traces.map((trace, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{trace.timestamp}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{trace.service}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{trace.operation}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-gray-900 dark:text-white">{trace.duration}</div>
                  {parseInt(trace.duration) > 300 && (
                    <div className="text-xs text-orange-600 dark:text-orange-400">Slow</div>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  trace.status === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                }`}>
                  {trace.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Jaeger UI:</strong> Access detailed traces at{' '}
          <a href="http://165.22.13.173:16686" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
            http://165.22.13.173:16686
          </a>
        </p>
      </div>
    </div>
  );
}
