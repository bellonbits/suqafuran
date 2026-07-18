"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, TrendingUp, Search, Clock, Eye, ShoppingCart, LogIn, Download } from 'lucide-react';
import api from '@/services/api';
import { HeatmapViewer } from '@/components/analytics/HeatmapViewer';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'funnel' | 'audit' | 'heatmap'>('overview');
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [heatmapPageUrl, setHeatmapPageUrl] = useState('/shops');
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  // Fetch active sessions
  const fetchActiveSessions = async () => {
    try {
      const res = await api.get('/analytics/sessions/active', { params: { limit: 50 } });
      setActiveSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  // Fetch activity feed
  const fetchActivityFeed = async () => {
    try {
      const res = await api.get('/analytics/activities/feed', { params: { limit: 100, hours: 24 } });
      setActivityFeed(res.data.activities || []);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    }
  };

  // Fetch conversion funnel
  const fetchFunnel = async () => {
    try {
      const res = await api.get('/analytics/funnel/stats', { params: { days: 30 } });
      setFunnelData(res.data.funnel);
    } catch (err) {
      console.error('Failed to fetch funnel:', err);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const params: any = { limit: 200 };
      if (actionTypeFilter) params.action_type = actionTypeFilter;
      const res = await api.get('/analytics/audit/logs', { params });
      setAuditLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  // Fetch heatmap data
  const fetchHeatmapData = async (pageUrl: string) => {
    setHeatmapLoading(true);
    try {
      const res = await api.get('/analytics/heatmap/data', { params: { page_url: pageUrl, hours: 24 } });
      setHeatmapData(res.data);
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    } finally {
      setHeatmapLoading(false);
    }
  };

  // Export analytics to CSV
  const exportToCSV = async () => {
    try {
      const csv = [
        ['Activity Type', 'Action', 'User ID', 'Timestamp', 'Page'],
        ...auditLogs.map((log) => [
          log.action_category,
          log.action_type,
          log.user_id || 'anonymous',
          new Date(log.timestamp).toISOString(),
          log.page_url,
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchActiveSessions(), fetchActivityFeed(), fetchFunnel(), fetchAuditLogs()]).finally(
      () => setLoading(false)
    );
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [actionTypeFilter]);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-6 rounded-lg ${color} text-white`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-50" />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">Real-time user activity and conversion metrics</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {['overview', 'activity', 'funnel', 'audit', 'heatmap'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Users}
                label="Active Sessions"
                value={activeSessions.length}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                icon={Activity}
                label="Actions (24h)"
                value={activityFeed.length}
                color="bg-gradient-to-br from-green-500 to-green-600"
              />
              <StatCard
                icon={TrendingUp}
                label="Conversion Rate"
                value={funnelData?.first_purchase?.percentage?.toFixed(1) + '%' || 'N/A'}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <StatCard
                icon={Clock}
                label="Avg Session"
                value={
                  activeSessions.length > 0
                    ? (activeSessions.reduce((sum: number, s: any) => sum + s.duration_minutes, 0) /
                        activeSessions.length).toFixed(0) + 'm'
                    : 'N/A'
                }
                color="bg-gradient-to-br from-amber-500 to-amber-600"
              />
            </div>

            {/* Active Sessions List */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" /> Active Users Now
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4">User ID</th>
                      <th className="text-left py-3 px-4">Page</th>
                      <th className="text-left py-3 px-4">Duration</th>
                      <th className="text-left py-3 px-4">Device</th>
                      <th className="text-left py-3 px-4">Interactions</th>
                      <th className="text-left py-3 px-4">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSessions.slice(0, 10).map((session, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4">{session.user_id}</td>
                        <td className="py-3 px-4 truncate text-xs">{session.current_page}</td>
                        <td className="py-3 px-4">{session.duration_minutes}m</td>
                        <td className="py-3 px-4 capitalize text-xs">{session.device_type || 'unknown'}</td>
                        <td className="py-3 px-4">{session.total_interactions}</td>
                        <td className="py-3 px-4 text-xs">
                          {new Date(session.last_activity_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Activity Feed Tab */}
        {activeTab === 'activity' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Recent Activity
              </h2>
              <div className="space-y-3">
                {activityFeed.slice(0, 50).map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-slate-700/30 rounded border border-slate-600/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{activity.action_type}</span>
                        <span className="text-xs bg-slate-600 px-2 py-1 rounded">{activity.action_category}</span>
                      </div>
                      <p className="text-xs text-slate-400">{activity.page_url}</p>
                      {activity.search_query && (
                        <p className="text-xs text-slate-300 mt-1">Search: {activity.search_query}</p>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Conversion Funnel Tab */}
        {activeTab === 'funnel' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Conversion Funnel (30 days)
              </h2>
              {funnelData && (
                <div className="space-y-4">
                  {[
                    { stage: 'signup', icon: LogIn, label: 'Signup' },
                    { stage: 'first_search', icon: Search, label: 'First Search' },
                    { stage: 'first_view', icon: Eye, label: 'First View' },
                    { stage: 'first_purchase', icon: ShoppingCart, label: 'First Purchase' },
                  ].map((item) => {
                    const data = funnelData[item.stage];
                    const width = Math.max(5, data.percentage || 0);
                    return (
                      <div key={item.stage}>
                        <div className="flex items-center gap-3 mb-2">
                          <item.icon className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-semibold text-white">{item.label}</span>
                          <span className="text-xs text-slate-400">
                            {data.count} users ({data.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded h-8 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-end pr-3"
                          >
                            {width > 10 && <span className="text-xs font-bold text-white">{data.percentage.toFixed(1)}%</span>}
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Audit Logs</h2>

              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Filter by action..."
                  value={actionTypeFilter}
                  onChange={(e) => setActionTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Action</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">Resource</th>
                      <th className="text-left py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4">{log.user_id}</td>
                        <td className="py-3 px-4 text-orange-400">{log.action_type}</td>
                        <td className="py-3 px-4">{log.action_category}</td>
                        <td className="py-3 px-4 text-xs">{log.resource_id}</td>
                        <td className="py-3 px-4 text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Click Heatmap</h2>

              {/* Page URL Input */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="/shops, /search, /listings/123, etc."
                  value={heatmapPageUrl}
                  onChange={(e) => setHeatmapPageUrl(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400"
                />
                <button
                  onClick={() => fetchHeatmapData(heatmapPageUrl)}
                  disabled={heatmapLoading}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 text-white font-semibold rounded transition"
                >
                  {heatmapLoading ? 'Loading...' : 'View Heatmap'}
                </button>
              </div>

              {/* Heatmap Display */}
              {heatmapData ? (
                <div>
                  <p className="text-sm text-slate-400 mb-4">
                    {heatmapData.total_clicks} clicks on this page in the last 24 hours
                  </p>
                  {heatmapData.clicks.length > 0 ? (
                    <HeatmapViewer
                      clicks={heatmapData.clicks}
                      pageWidth={1440}
                      pageHeight={900}
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      No click data available for this page yet
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Enter a page URL and click "View Heatmap" to see click data
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Export Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export as CSV
          </button>
        </div>
      </div>
    </div>
  );
}
