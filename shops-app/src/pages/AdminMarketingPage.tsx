"use client";

import React, { useState, useEffect } from 'react';
import { Loader, MailOpen, Send, Users, TrendingUp, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/admin-dashboard/navigation';
import { useAuthStore } from '@/store/useAuth';

interface RecentSend {
  id: number;
  subject: string;
  event_type: string;
  status: string;
  sent_at: string;
  opened_at?: string | null;
}

const MarketingPage = () => {
  const [stats, setStats] = useState<{ total_sent: number; open_rate: number } | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentSends, setRecentSends] = useState<RecentSend[]>([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [preview, setPreview] = useState<{ recipient_count: number; opted_out_count: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ campaign_id: string; recipient_count: number } | null>(null);
  const [sendError, setSendError] = useState('');

  const { user } = useAuthStore();
  const navItems = ADMIN_NAV_ITEMS.map(item => ({
    ...item,
    icon: <item.icon className="w-5 h-5" />
  }));

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [statsRes, platformRes, sendsRes] = await Promise.all([
        api.get('/admin/email-analytics/stats', { params: { period: 'all' } }).catch(() => null),
        api.get('/admin/stats').catch(() => null),
        api.get('/admin/email-analytics/campaigns', { params: { period: 'all', limit: 10 } }).catch(() => null),
      ]);
      if (statsRes?.data) setStats(statsRes.data);
      if (platformRes?.data) setTotalUsers(platformRes.data.total_users || 0);
      if (sendsRes?.data) setRecentSends(sendsRes.data.campaigns || []);
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear any stale preview/result whenever the draft changes -- a preview
  // count for an edited message would be misleading otherwise.
  const updateSubject = (v: string) => { setSubject(v); setPreview(null); setSendResult(null); setSendError(''); };
  const updateHtml = (v: string) => { setHtmlContent(v); setPreview(null); setSendResult(null); setSendError(''); };

  const handlePreview = async () => {
    if (!subject.trim() || !htmlContent.trim()) return;
    setIsChecking(true);
    setSendError('');
    try {
      const res = await api.post('/admin/marketing/broadcast', {
        subject,
        html_content: htmlContent,
        dry_run: true,
      });
      setPreview(res.data);
    } catch (error: any) {
      setSendError(error?.response?.data?.detail || 'Failed to check recipients');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSend = async () => {
    if (!preview) return;
    const confirmed = window.confirm(
      `Send "${subject}" to ${preview.recipient_count} user${preview.recipient_count === 1 ? '' : 's'}? This can't be undone.`
    );
    if (!confirmed) return;

    setIsSending(true);
    setSendError('');
    try {
      const res = await api.post('/admin/marketing/broadcast', {
        subject,
        html_content: htmlContent,
        dry_run: false,
      });
      setSendResult(res.data);
      setSubject('');
      setHtmlContent('');
      setPreview(null);
    } catch (error: any) {
      setSendError(error?.response?.data?.detail || 'Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Marketing & Analytics" navItems={navItems} userRole="admin">
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Marketing & Analytics" navItems={navItems} userRole="admin">
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 dark:border-neutral-800 rounded-2xl p-6">
            <MailOpen className="w-10 h-10 text-[#6cd4ff] mb-4" />
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats?.total_sent || 0}</p>
            <p className="text-sm text-slate-400 mt-1">Emails Sent (all time)</p>
          </div>
          <div className="bg-white border border-slate-200 dark:border-neutral-800 rounded-2xl p-6">
            <TrendingUp className="w-10 h-10 text-green-500 mb-4" />
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats?.open_rate || 0}%</p>
            <p className="text-sm text-slate-400 mt-1">Open Rate</p>
          </div>
          <div className="bg-white border border-slate-200 dark:border-neutral-800 rounded-2xl p-6">
            <Users className="w-10 h-10 text-purple-500 mb-4" />
            <p className="text-3xl font-black text-slate-900 dark:text-white">{totalUsers}</p>
            <p className="text-sm text-slate-400 mt-1">Total Users</p>
          </div>
        </div>

        {/* Send Campaign */}
        <div className="bg-white border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">New Broadcast</h2>
          <p className="text-sm text-slate-400 mb-4">Sends to every user, except anyone who's turned off promotional emails.</p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Subject line"
              value={subject}
              onChange={(e) => updateSubject(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6cd4ff] bg-transparent"
            />
            <textarea
              placeholder="Paste the full email HTML here"
              value={htmlContent}
              onChange={(e) => updateHtml(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6cd4ff] font-mono text-xs bg-transparent"
            />

            {sendError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{sendError}</span>
              </div>
            )}

            {sendResult && (
              <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Queued to {sendResult.recipient_count} recipients (campaign: {sendResult.campaign_id}). Sends trickle out in the background.</span>
              </div>
            )}

            {preview && !sendResult && (
              <div className="text-sm text-slate-600 dark:text-neutral-200 bg-slate-50 dark:bg-neutral-900/40 rounded-lg p-3">
                Will reach <strong>{preview.recipient_count}</strong> user{preview.recipient_count === 1 ? '' : 's'}
                {preview.opted_out_count > 0 && <> ({preview.opted_out_count} opted out of promotional emails)</>}.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={!subject.trim() || !htmlContent.trim() || isChecking}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-white rounded-lg font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-neutral-900"
              >
                {isChecking ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Preview Recipients
              </button>
              <button
                onClick={handleSend}
                disabled={!preview || isSending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send to All Users
              </button>
            </div>
          </div>
        </div>

        {/* Recent Sends */}
        <div className="bg-white border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-neutral-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Emails</h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-neutral-900/40 border-b border-slate-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-900 dark:text-white">Subject</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900 dark:text-white">Opened</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900 dark:text-white">Sent</th>
              </tr>
            </thead>
            <tbody>
              {recentSends.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No emails yet
                  </td>
                </tr>
              ) : (
                recentSends.map((send) => (
                  <tr key={send.id} className="border-b border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:bg-neutral-900/40">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{send.subject}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-neutral-200 capitalize">{send.status}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-neutral-200">{send.opened_at ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-neutral-200 text-sm">
                      {new Date(send.sent_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarketingPage;
