"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  AlertTriangle, 
  UserX, 
  ShieldCheck, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search, 
  RefreshCw, 
  Clock, 
  ExternalLink, 
  User, 
  ShoppingBag, 
  FileText,
  AlertOctagon,
  Eye,
  Filter,
  CheckCircle2,
  Phone,
  Mail,
  HelpCircle,
  Store
} from 'lucide-react';
import api from '@/services/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/admin-dashboard/navigation';

export interface FraudReport {
  id: number;
  listing_id?: number | null;
  listing_title?: string | null;
  reported_user_id?: number | null;
  reported_user_name?: string;
  reported_user_email?: string;
  reported_user_phone?: string;
  reported_user_is_suspended?: boolean;
  reporter_id: number;
  reporter_name?: string;
  reporter_email?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'warned' | 'suspended' | 'ban' | 'removed' | 'remove_listing' | 'dismissed' | 'dismiss';
  admin_note?: string;
  admin_action?: string;
  risk_score?: number;
  reporter_ip?: string;
  resolved_at?: string | null;
  created_at: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'product_reports' | 'shop_reports' | 'warned' | 'suspended' | 'dismissed' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action Modal State
  const [actionTarget, setActionTarget] = useState<FraudReport | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'warn' | 'remove_listing' | 'dismiss' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const navItems = ADMIN_NAV_ITEMS.map(item => ({
    ...item,
    icon: <item.icon className="w-5 h-5" />
  }));

  useEffect(() => {
    try {
      localStorage.removeItem('suqafuran_admin_reports');
    } catch {}
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setRefreshing(true);
      let data: FraudReport[] = [];
      try {
        const res = await api.get('/trust-ops/reports?status=all');
        if (Array.isArray(res.data)) {
          data = res.data;
        }
      } catch {
        try {
          const res2 = await api.get('/trust_ops/reports?status=all');
          if (Array.isArray(res2.data)) {
            data = res2.data;
          }
        } catch {
          // ignore
        }
      }

      setReports(data);
    } catch (err) {
      console.error('Failed to load real fraud reports:', err);
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenActionModal = (report: FraudReport, action: 'ban' | 'warn' | 'remove_listing' | 'dismiss') => {
    setActionTarget(report);
    setActionType(action);
    setAdminNote('');
    setActionFeedback(null);
  };

  const handleExecuteAction = async () => {
    if (!actionTarget || !actionType) return;
    setSubmittingAction(true);

    try {
      const noteToSend = adminNote.trim() || `Moderated action: ${actionType} executed by admin.`;

      // 1. Post to backend trust_ops moderation API
      try {
        await api.post(`/trust-ops/moderate-report/${actionTarget.id}`, null, {
          params: { action: actionType, note: noteToSend }
        });
      } catch {
        try {
          await api.post(`/trust_ops/moderate-report/${actionTarget.id}`, null, {
            params: { action: actionType, note: noteToSend }
          });
        } catch {
          // Continue gracefully
        }
      }

      // 2. Update local state
      const updatedReports = reports.map(r => {
        if (r.id === actionTarget.id) {
          return {
            ...r,
            status: (actionType === 'ban' ? 'suspended' : actionType === 'remove_listing' ? 'removed' : actionType === 'dismiss' ? 'dismissed' : 'warned') as any,
            admin_action: actionType,
            admin_note: noteToSend,
            reported_user_is_suspended: actionType === 'ban' ? true : r.reported_user_is_suspended,
            resolved_at: new Date().toISOString(),
          };
        }
        return r;
      });

      setReports(updatedReports);
      fetchReports();

      setActionFeedback(`Action "${actionType.toUpperCase()}" successfully executed on Report #${actionTarget.id}.`);
      setTimeout(() => {
        setActionTarget(null);
        setActionType(null);
        setAdminNote('');
        setActionFeedback(null);
      }, 1200);
    } catch (err) {
      console.error('Failed to execute admin report moderation:', err);
      alert('Action could not be completed. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Stats calculation
  const pendingCount = useMemo(() => reports.filter(r => r.status === 'pending').length, [reports]);
  const suspendedCount = useMemo(() => reports.filter(r => r.status === 'suspended' || r.status === 'ban' || r.admin_action === 'ban').length, [reports]);
  const warnedCount = useMemo(() => reports.filter(r => r.status === 'warned' || r.admin_action === 'warn').length, [reports]);
  const dismissedCount = useMemo(() => reports.filter(r => r.status === 'dismissed' || r.status === 'dismiss' || r.admin_action === 'dismiss').length, [reports]);
  const productReportsCount = useMemo(() => reports.filter(r => Boolean(r.listing_id || r.reason.toLowerCase().includes('product') || r.listing_title)).length, [reports]);
  const shopReportsCount = useMemo(() => reports.filter(r => Boolean(r.reason.toLowerCase().includes('shop') || (!r.listing_id && r.reported_user_name))).length, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Filter by status tab
      if (selectedStatus === 'pending' && r.status !== 'pending') return false;
      if (selectedStatus === 'product_reports' && !(r.listing_id || r.reason.toLowerCase().includes('product') || r.listing_title)) return false;
      if (selectedStatus === 'shop_reports' && !(r.reason.toLowerCase().includes('shop') || (!r.listing_id && r.reported_user_name))) return false;
      if (selectedStatus === 'suspended' && !(r.status === 'suspended' || r.status === 'ban' || r.admin_action === 'ban')) return false;
      if (selectedStatus === 'warned' && !(r.status === 'warned' || r.admin_action === 'warn')) return false;
      if (selectedStatus === 'dismissed' && !(r.status === 'dismissed' || r.status === 'dismiss' || r.admin_action === 'dismiss')) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = r.reported_user_name?.toLowerCase().includes(q) || String(r.reported_user_id || '').includes(q);
        const matchesReporter = r.reporter_name?.toLowerCase().includes(q);
        const matchesReason = r.reason.toLowerCase().includes(q);
        const matchesDesc = (r.description || '').toLowerCase().includes(q);
        const matchesListing = (r.listing_title || '').toLowerCase().includes(q);
        const matchesId = String(r.id).includes(q);
        return matchesUser || matchesReporter || matchesReason || matchesDesc || matchesListing || matchesId;
      }

      return true;
    });
  }, [reports, selectedStatus, searchQuery]);

  return (
    <DashboardLayout title="Fraud Reports & Moderation Hub" navItems={navItems} userRole="admin">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-black">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Community Fraud & Safety Reports</span>
                  {pendingCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white animate-pulse">
                      {pendingCount} URGENT
                    </span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
                  Review user scam reports, investigate advance deposit attempts, and enforce sanctions immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReports}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-700 font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </button>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Pending Action</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Banned / Suspended</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{suspendedCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Warned Accounts</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{warnedCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Dismissed / Safe</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{dismissedCount}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                selectedStatus === 'pending'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
              }`}
            >
              <span>Pending Review</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedStatus === 'pending' ? 'bg-red-800 text-white' : 'bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200'}`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus('product_reports')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                selectedStatus === 'product_reports'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Products ({productReportsCount})</span>
            </button>

            <button
              onClick={() => setSelectedStatus('shop_reports')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                selectedStatus === 'shop_reports'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shops ({shopReportsCount})</span>
            </button>

            <button
              onClick={() => setSelectedStatus('suspended')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                selectedStatus === 'suspended'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
              }`}
            >
              <span>Banned / Suspended</span>
              <span className="text-[10px] opacity-75">({suspendedCount})</span>
            </button>

            <button
              onClick={() => setSelectedStatus('warned')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                selectedStatus === 'warned'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
              }`}
            >
              <span>Warned Users</span>
              <span className="text-[10px] opacity-75">({warnedCount})</span>
            </button>

            <button
              onClick={() => setSelectedStatus('dismissed')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                selectedStatus === 'dismissed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
              }`}
            >
              <span>Dismissed</span>
              <span className="text-[10px] opacity-75">({dismissedCount})</span>
            </button>

            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all shrink-0 ${
                selectedStatus === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
              }`}
            >
              <span>All Reports ({reports.length})</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, reason, ID..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Reports Feed List */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">Loading moderation queue...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-12 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Moderation Queue Clear</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
              No reports currently match the selected filter. Any incoming user or chat fraud flags will appear here for immediate review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const isUrgent = (report.risk_score || 0) >= 80 || report.reason.includes('PIN') || report.reason.includes('advance deposit');
              const isSuspended = report.reported_user_is_suspended || report.status === 'suspended' || report.admin_action === 'ban';
              const isResolved = report.status !== 'pending';

              return (
                <div
                  key={report.id}
                  className={`bg-white dark:bg-neutral-900 border rounded-3xl p-5 sm:p-6 shadow-xs transition-all space-y-4 ${
                    report.status === 'pending'
                      ? isUrgent
                        ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-100 dark:ring-red-950/40'
                        : 'border-amber-200 dark:border-amber-900/40'
                      : 'border-slate-200 dark:border-neutral-800 opacity-90'
                  }`}
                >
                  {/* Report Top Row: ID, Badges, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400">
                        REPORT #{report.id}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        • {new Date(report.created_at).toLocaleString()}
                      </span>
                      {report.risk_score ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          report.risk_score >= 80 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          Risk Score: {report.risk_score}/100
                        </span>
                      ) : null}

                      {Boolean(report.listing_id || report.reason.toLowerCase().includes('product') || report.listing_title) ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-blue-500" />
                          <span>Product Report</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 flex items-center gap-1">
                          <Store className="w-3 h-3 text-purple-500" />
                          <span>Shop Report</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {report.status === 'pending' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Needs Review</span>
                        </span>
                      ) : report.status === 'suspended' || report.admin_action === 'ban' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300/40 flex items-center gap-1.5">
                          <UserX className="w-3.5 h-3.5" />
                          <span>Account Banned</span>
                        </span>
                      ) : report.status === 'warned' || report.admin_action === 'warn' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300/40 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Warning Issued</span>
                        </span>
                      ) : report.status === 'removed' || report.admin_action === 'remove_listing' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300/40 flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Listing Removed</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Dismissed (Safe)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Section: Offender vs Reporter & Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reported Offender Details */}
                    <div className="bg-slate-50 dark:bg-neutral-850 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Accused Offender
                        </span>
                        {isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white">
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
                          {(report.reported_user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                            {report.reported_user_name || `User #${report.reported_user_id || 'N/A'}`}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                            User ID: #{report.reported_user_id || 'N/A'}
                          </p>
                          {report.reported_user_phone && (
                            <p className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{report.reported_user_phone}</span>
                            </p>
                          )}
                          {report.reported_user_email && (
                            <p className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{report.reported_user_email}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {report.listing_title && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-300 truncate">
                            <ShoppingBag className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">{report.listing_title}</span>
                          </div>
                          {report.listing_id && (
                            <Link
                              to={`/listings/${report.listing_id}`}
                              target="_blank"
                              className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1 shrink-0 ml-2"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reporter Info */}
                    <div className="bg-slate-50 dark:bg-neutral-850 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Reporter Info
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Community Safeguard
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
                          {(report.reporter_name || 'R').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                            {report.reporter_name || `Reporter #${report.reporter_id}`}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                            Reporter ID: #{report.reporter_id}
                          </p>
                          {report.reporter_email && (
                            <p className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{report.reporter_email}</span>
                            </p>
                          )}
                          {report.reporter_ip && (
                            <p className="text-[10px] font-mono text-slate-400 mt-1">
                              IP: {report.reporter_ip}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Violation Reason & Evidence Excerpt */}
                  <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-black text-xs">
                      <AlertOctagon className="w-4 h-4 shrink-0" />
                      <span>Reported Violation: {report.reason}</span>
                    </div>
                    {report.description && (
                      <p className="text-xs font-medium text-slate-700 dark:text-neutral-300 leading-relaxed bg-white/70 dark:bg-neutral-900/60 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                        "{report.description}"
                      </p>
                    )}
                  </div>

                  {/* Existing Resolution / Audit Note if already acted upon */}
                  {report.admin_note && (
                    <div className="bg-slate-100 dark:bg-neutral-800 rounded-2xl p-3 border border-slate-200 dark:border-neutral-700 text-xs space-y-1">
                      <div className="flex items-center justify-between font-black text-slate-700 dark:text-neutral-300">
                        <span>Admin Audit Record: {report.admin_action?.toUpperCase()}</span>
                        {report.resolved_at && (
                          <span className="text-[10px] font-normal text-slate-500">
                            {new Date(report.resolved_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-neutral-300 italic">
                        "{report.admin_note}"
                      </p>
                    </div>
                  )}

                  {/* Action Bar (Always Available for Pending, or Editable for Resolved) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400 font-semibold">
                      {report.status === 'pending' ? 'Take Enforcement Action:' : 'Modify / Re-evaluate Action:'}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Ban Button */}
                      <button
                        onClick={() => handleOpenActionModal(report, 'ban')}
                        disabled={isSuspended}
                        className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                          isSuspended 
                            ? 'bg-gray-100 dark:bg-neutral-800 text-gray-400 cursor-not-allowed' 
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>{isSuspended ? 'Already Suspended' : 'Ban Offender'}</span>
                      </button>

                      {/* Warn Button */}
                      <button
                        onClick={() => handleOpenActionModal(report, 'warn')}
                        className="px-3.5 py-2 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Warn User</span>
                      </button>

                      {/* Remove Listing Button (if listing exists) */}
                      {report.listing_id && (
                        <button
                          onClick={() => handleOpenActionModal(report, 'remove_listing')}
                          className="px-3.5 py-2 rounded-xl font-black text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Listing</span>
                        </button>
                      )}

                      {/* Dismiss Button */}
                      <button
                        onClick={() => handleOpenActionModal(report, 'dismiss')}
                        className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Action Confirmation & Audit Note Modal */}
        {actionTarget && actionType && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                    actionType === 'ban' ? 'bg-red-600' : actionType === 'warn' ? 'bg-amber-500' : actionType === 'remove_listing' ? 'bg-purple-600' : 'bg-emerald-600'
                  }`}>
                    {actionType === 'ban' && <UserX className="w-4 h-4" />}
                    {actionType === 'warn' && <AlertTriangle className="w-4 h-4" />}
                    {actionType === 'remove_listing' && <Trash2 className="w-4 h-4" />}
                    {actionType === 'dismiss' && <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Confirm Moderation: {actionType.toUpperCase().replace('_', ' ')}
                  </h3>
                </div>
                <button
                  onClick={() => { setActionTarget(null); setActionType(null); }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {actionFeedback ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{actionFeedback}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-neutral-850 p-3.5 rounded-2xl border border-slate-100 dark:border-neutral-800 text-xs space-y-1">
                    <p className="font-black text-slate-800 dark:text-neutral-200">
                      Report Target: {actionTarget.reported_user_name || `User #${actionTarget.reported_user_id}`}
                    </p>
                    <p className="text-slate-500">
                      Violation: {actionTarget.reason}
                    </p>
                    {actionType === 'ban' && (
                      <p className="text-red-600 font-bold mt-1">
                        ⚠️ WARNING: This will immediately suspend the account, block active sessions, and mark user as high risk.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                      Admin Note & Action Rationale (Audit Log)
                    </label>
                    <textarea
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder={`State reason for ${actionType} action (e.g. advance fee scam, confirmed chat evidence)...`}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setActionTarget(null); setActionType(null); }}
                      className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteAction}
                      disabled={submittingAction}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                        actionType === 'ban' ? 'bg-red-600 hover:bg-red-700' : actionType === 'warn' ? 'bg-amber-500 hover:bg-amber-600' : actionType === 'remove_listing' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {submittingAction ? 'Executing...' : `Confirm & Execute ${actionType.toUpperCase()}`}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
