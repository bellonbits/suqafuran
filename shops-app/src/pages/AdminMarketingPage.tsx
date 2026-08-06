"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader, ArrowLeft, MailOpen, Send, Users, TrendingUp } from 'lucide-react';
import api from '@/services/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/admin-dashboard/navigation';
import { useAuthStore } from '@/store/useAuth';

const MarketingPage = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignBody, setCampaignBody] = useState('');

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
      const res = await api.get(`/admin/email/analytics`).catch(() => null);
      if (res?.data) setAnalytics(res.data);
      
      const campaignsRes = await api.get(`/admin/email/analytics?limit=50`).catch(() => null);
      if (campaignsRes?.data) setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignTitle.trim() || !campaignBody.trim()) return;
    try {
      await api.post(`/admin/email/broadcast`, {
        subject: campaignTitle,
        body: campaignBody,
      }).catch(() => null);
      setCampaignTitle('');
      setCampaignBody('');
      loadAnalytics();
    } catch (error) {
      console.error('Error sending campaign:', error);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <MailOpen className="w-10 h-10 text-[#6cd4ff] mb-4" />
            <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.total_sent || 0}</p>
            <p className="text-sm text-slate-400 mt-1">Emails Sent</p>
          </div>
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <TrendingUp className="w-10 h-10 text-green-500 mb-4" />
            <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.open_rate || 0}%</p>
            <p className="text-sm text-slate-400 mt-1">Open Rate</p>
          </div>
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <Users className="w-10 h-10 text-purple-500 mb-4" />
            <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.total_users || 0}</p>
            <p className="text-sm text-slate-400 mt-1">Total Users</p>
          </div>
          <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <Send className="w-10 h-10 text-orange-500 mb-4" />
            <p className="text-3xl font-black text-slate-900 dark:text-white">{campaigns.length}</p>
            <p className="text-sm text-slate-400 mt-1">Campaigns</p>
          </div>
        </div>

        {/* Send Campaign */}
        <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">New Campaign</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Campaign Subject"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6cd4ff]"
            />
            <textarea
              placeholder="Campaign Message"
              value={campaignBody}
              onChange={(e) => setCampaignBody(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6cd4ff]"
            />
            <button
              onClick={handleSendCampaign}
              className="px-6 py-3 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg font-bold transition-colors w-full"
            >
              Send Campaign
            </button>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Campaigns</h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-900 dark:text-white">Subject</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900 dark:text-white">Sent</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900 dark:text-white">Opens</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900 dark:text-white">Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No campaigns yet
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign, idx) => (
                  <tr key={idx} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/40">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{campaign.subject}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{campaign.sent_count || 0}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{campaign.open_count || 0}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                      {new Date(campaign.created_at).toLocaleDateString()}
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
