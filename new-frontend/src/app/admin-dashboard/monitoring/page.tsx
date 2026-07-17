// Wrapper for admin monitoring dashboard
import { ReactNode } from 'react';

export default function MonitoringPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Monitoring</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor alerts, events, and system health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a
          href="/admin-dashboard/monitoring/alerts"
          className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition"
        >
          <div className="text-2xl mb-2">🔔</div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Alert Rules</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">View and manage alert rules</p>
        </a>

        <a
          href="/admin-dashboard/monitoring/live"
          className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition"
        >
          <div className="text-2xl mb-2">📡</div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Live Events</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Real-time event streaming</p>
        </a>

        <a
          href="/admin-dashboard/monitoring/notifications"
          className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition"
        >
          <div className="text-2xl mb-2">📢</div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Alert notification logs</p>
        </a>

        <a
          href="/admin-dashboard/monitoring/kafka"
          className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition"
        >
          <div className="text-2xl mb-2">⚡</div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Kafka Streams</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Message broker monitoring</p>
        </a>

        <a
          href="/admin-dashboard/monitoring/traces"
          className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition"
        >
          <div className="text-2xl mb-2">🔗</div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Distributed Traces</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Jaeger request tracing</p>
        </a>
      </div>
    </div>
  );
}
