'use client';

import React, { useEffect, useCallback, useState } from 'react';
import {
  Activity,
  Send,
  Zap,
  Clock,
  AlertCircle,
  AlertTriangle,
  Bell,
  Link as LinkIcon,
} from 'lucide-react';
import { MonitoringLayout } from '../../../components/monitoring/MonitoringLayout';
import { StatCard } from '../../../components/monitoring/StatCard';
import { TopicStatusBadge } from '../../../components/monitoring/TopicStatusBadge';
import { useMonitoringStore } from '../../../store/monitoring/useMonitoringStore';
import { usePolling } from '../../../hooks/monitoring/usePolling';
import { monitoringService } from '../../../services/monitoringService';
import { alertsService } from '../../../services/alertsService';
import type { AlertStats } from '../../../store/monitoring/useAlertsStore';

export default function MonitoringOverviewPage() {
  const store = useMonitoringStore();
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null);

  // Fetch overview data
  const fetchOverview = useCallback(async () => {
    store.setLoading(true);
    try {
      const data = await monitoringService.getOverview();
      store.setOverview(data);
    } catch (error) {
      console.error('Failed to fetch monitoring overview:', error);
      store.setError(
        error instanceof Error ? error.message : 'Failed to fetch monitoring data'
      );
    }
  }, [store]);

  // Fetch alert stats
  const fetchAlertStats = useCallback(async () => {
    try {
      const stats = await alertsService.getAlertStats(24);
      setAlertStats(stats);
    } catch (error) {
      console.error('Failed to fetch alert stats:', error);
    }
  }, []);

  // Set up polling
  usePolling(fetchOverview, store.refreshInterval, store.autoRefresh);
  usePolling(fetchAlertStats, 30000, store.autoRefresh);

  if (!store.overview) {
    return (
      <MonitoringLayout
        onRefresh={fetchOverview}
        isLoading={store.loading}
        autoRefresh={store.autoRefresh}
        onAutoRefreshChange={store.setAutoRefresh}
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Activity className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {store.loading ? 'Loading monitoring data...' : store.error || 'No data available'}
            </p>
          </div>
        </div>
      </MonitoringLayout>
    );
  }

  const { stats, topic_health, summary } = store.overview;

  return (
    <MonitoringLayout
      onRefresh={fetchOverview}
      isLoading={store.loading}
      autoRefresh={store.autoRefresh}
      onAutoRefreshChange={store.setAutoRefresh}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Events/sec"
          value={stats.events_per_sec.toFixed(1)}
          unit="evt/s"
          icon={<Activity />}
          status={stats.events_per_sec > 100 ? 'success' : 'neutral'}
        />
        <StatCard
          label="Notification Success Rate"
          value={stats.notification_success_rate.toFixed(1)}
          unit="%"
          icon={<Send />}
          status={stats.notification_success_rate > 95 ? 'success' : 'warning'}
        />
        <StatCard
          label="Active Workers"
          value={stats.active_workers}
          icon={<Zap />}
          status={stats.active_workers > 8 ? 'success' : 'warning'}
        />
        <StatCard
          label="Queue Depth"
          value={stats.queue_depth}
          icon={<Clock />}
          status={stats.queue_depth < 100 ? 'success' : stats.queue_depth < 500 ? 'warning' : 'critical'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <StatCard
          label="P95 Latency"
          value={stats.p95_latency_ms}
          unit="ms"
          status={stats.p95_latency_ms < 1000 ? 'success' : 'warning'}
        />
        <StatCard
          label="Failed Payments (1h)"
          value={stats.failed_payments_1h}
          status={stats.failed_payments_1h === 0 ? 'success' : 'critical'}
          icon={stats.failed_payments_1h > 0 ? <AlertCircle /> : undefined}
        />
      </div>

      {/* Alert Stats */}
      {alertStats && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Status
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {alertStats.active_rules} active rules • {alertStats.firing_alerts} firing
              </p>
            </div>
            <a
              href="/admin/monitoring/alerts"
              className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium text-sm"
            >
              View All
              <LinkIcon className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Active Rules</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{alertStats.active_rules}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Firing</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{alertStats.firing_alerts}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Resolved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{alertStats.resolved_alerts}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total (24h)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{alertStats.total_alerts}</p>
            </div>
          </div>
        </div>
      )}

      {/* Topic Health Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Kafka Topic Health
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {summary.total_topics} topics • {summary.lagging_topics} lagging •{' '}
              {summary.stalled_topics} stalled
            </p>
          </div>
          {(summary.lagging_topics > 0 || summary.stalled_topics > 0) && (
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                    Topic
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                    Messages/sec
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                    Consumer Lag
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                    Partitions
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {topic_health.map((topic) => (
                  <tr
                    key={topic.name}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {topic.name}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                      {topic.messages_per_sec.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                      {topic.consumer_lag.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                      {topic.partition_count}
                    </td>
                    <td className="px-4 py-3">
                      <TopicStatusBadge
                        status={topic.status as any}
                        consumerLag={topic.consumer_lag}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
        Last updated: {store.lastUpdated?.toLocaleTimeString()}
      </div>
    </MonitoringLayout>
  );
}
