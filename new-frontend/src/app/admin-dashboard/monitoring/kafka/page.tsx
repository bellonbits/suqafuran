"use client";

import React from 'react';
import { Network, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';

export default function KafkaPage() {
  const topics = [
    { name: 'suqafuran-orders', partitions: 3, replicas: 1, lag: 0, messages: 15234 },
    { name: 'suqafuran-payments', partitions: 3, replicas: 1, lag: 12, messages: 8923 },
    { name: 'suqafuran-deliveries', partitions: 2, replicas: 1, lag: 0, messages: 4532 },
    { name: 'suqafuran-alerts', partitions: 1, replicas: 1, lag: 0, messages: 542 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Kafka Streams</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor message brokers and event streams</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Broker Status</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">Healthy</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-900 dark:text-green-300">Throughput</span>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">12.4K msg/s</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">Topics</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">{topics.length}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-semibold text-orange-900 dark:text-orange-300">Consumer Lag</span>
          </div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">12 msgs</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Topics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Topic</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Partitions</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Messages</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Consumer Lag</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{topic.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{topic.partitions}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{topic.messages.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    {topic.lag === 0 ? (
                      <span className="text-green-600 dark:text-green-400">0</span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400">{topic.lag}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
