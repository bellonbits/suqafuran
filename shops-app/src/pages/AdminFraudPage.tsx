"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader, AlertTriangle, Shield, TrendingDown, Search, CheckCircle2, XCircle, ShieldAlert, ExternalLink, RefreshCw, Eye } from 'lucide-react';
import api from '@/services/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/admin-dashboard/navigation';
import { useAuthStore } from '@/store/useAuth';

interface FraudAlert {
  id: number;
  target_type: string;
  target_id: string;
  user_name: string;
  rule_name: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  risk_score: number;
  confidence: number;
  status: 'open' | 'resolved' | 'false_alarm';
  raw_status: string;
  event_data?: any;
  created_at: string;
}

const FraudPage = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>(() => {
    try {
      const cached = localStorage.getItem('admin_fraud_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'false_alarm'>('all');
  const [actioningId, setActioningId] = useState<number | null>(null);

  const { user } = useAuthStore();
  const navItems = ADMIN_NAV_ITEMS.map(item => ({
    ...item,
    icon: <item.icon className="w-5 h-5" />
  }));

  useEffect(() => {
    loadFraudAlerts();
  }, []);

  const loadFraudAlerts = async () => {
    try {
      setRefreshing(true);
      let events: any[] = [];
      try {
        const res = await api.get('/trust-ops/fraud-events?limit=200');
        if (Array.isArray(res.data)) events = res.data;
      } catch {
        try {
          const res2 = await api.get('/trust_ops/fraud-events?limit=200');
          if (Array.isArray(res2.data)) events = res2.data;
        } catch {
          // ignore
        }
      }

      const formatted: FraudAlert[] = events.map((e: any) => {
        const risk = Number(e.risk_score || 0);
        const severity: 'high' | 'medium' | 'low' = risk >= 70 ? 'high' : risk >= 40 ? 'medium' : 'low';
        const rawStatus = (e.status || 'pending').toLowerCase();
        const status: 'open' | 'resolved' | 'false_alarm' = 
          rawStatus === 'dismissed' ? 'false_alarm' :
          (rawStatus === 'actioned' || rawStatus === 'investigated') ? 'resolved' : 'open';

        const readableTarget = `${(e.target_type || 'user').toUpperCase()} #${e.target_id}`;
        const readableRule = (e.rule_name || 'Suspicious Activity').replace(/_/g, ' ');

        return {
          id: e.id,
          target_type: e.target_type || 'user',
          target_id: String(e.target_id),
          user_name: readableTarget,
          rule_name: e.rule_name || 'fraud_detection',
          reason: readableRule,
          severity,
          risk_score: risk,
          confidence: Number(e.confidence || 0),
          status,
          raw_status: rawStatus,
          event_data: e.event_data,
          created_at: e.created_at || new Date().toISOString(),
        };
      });

      setAlerts(formatted);
      try { localStorage.setItem('admin_fraud_cache', JSON.stringify(formatted)); } catch {}
    } catch (error) {
      console.error('Error loading real fraud events:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAction = async (alertId: number, action: 'dismiss' | 'investigate' | 'suspend_target') => {
    setActioningId(alertId);
    try {
      try {
        await api.post(`/trust-ops/fraud-events/${alertId}/action`, null, { params: { action } });
      } catch {
        await api.post(`/trust_ops/fraud-events/${alertId}/action`, null, { params: { action } });
      }
      await loadFraudAlerts();
    } catch (err) {
      console.error('Failed to moderate fraud event:', err);
      alert('Could not update fraud event. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.user_name.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.target_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: alerts.length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  };

  return (
    <DashboardLayout title="Fraud Detection" navItems={navItems} userRole="admin">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-red-600" />
              Automated Fraud Detection & Security Audit
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live automated security alerts from the chat fraud guard, risk scoring algorithms, and anti-scam sensors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin-reports"
              className="bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Community Reports</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={loadFraudAlerts}
              disabled={refreshing}
              className="bg-[#0078E8] hover:bg-[#0066C7] text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Alerts</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">High Risk</p>
                <p className="text-3xl font-black text-red-600 mt-1">{stats.high}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Medium Risk</p>
                <p className="text-3xl font-black text-amber-500 mt-1">{stats.medium}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Low Risk / Informational</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{stats.low}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['all', 'open', 'resolved', 'false_alarm'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  statusFilter === tab
                    ? 'bg-[#0078E8] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by target or rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0078E8]"
            />
          </div>
        </div>

        {/* Table / List */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          {filteredAlerts.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Shield className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">No Automated Fraud Events</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No security triggers or fraud incidents match this view. All buyer and seller actions are currently within safe operational thresholds.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-neutral-900/60 border-b border-slate-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Target</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Trigger Rule</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Risk Score</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Timestamp</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/40 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                          {alert.user_name}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                            {alert.reason}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {alert.rule_name}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            alert.severity === 'high' ? 'bg-rose-50 dark:bg-rose-950/40 text-red-700' :
                            alert.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700' :
                            'bg-emerald-50 dark:bg-emerald-950/40 text-green-700'
                          }`}>
                            {alert.risk_score}/100
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          alert.status === 'open' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                          alert.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}>
                          {alert.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-neutral-400">
                        {new Date(alert.created_at).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {alert.status === 'open' && (
                            <>
                              <button
                                onClick={() => handleAction(alert.id, 'dismiss')}
                                disabled={actioningId === alert.id}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleAction(alert.id, 'suspend_target')}
                                disabled={actioningId === alert.id}
                                className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              >
                                Suspend Target
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FraudPage;
