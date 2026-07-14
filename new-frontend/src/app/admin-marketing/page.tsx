"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader, ArrowLeft, MailOpen, Send, Users, TrendingUp } from 'lucide-react';
import api from '@/services/api';

const MarketingPage = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignBody, setCampaignBody] = useState('');

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Marketing & Analytics</h1>
            <p className="text-gray-500 mt-1">Manage email campaigns and view analytics</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <MailOpen className="w-10 h-10 text-[#6cd4ff] mb-4" />
            <p className="text-3xl font-black text-gray-900">{analytics?.total_sent || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Emails Sent</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <TrendingUp className="w-10 h-10 text-green-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{analytics?.open_rate || 0}%</p>
            <p className="text-sm text-gray-500 mt-1">Open Rate</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Users className="w-10 h-10 text-purple-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{analytics?.total_users || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total Users</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Send className="w-10 h-10 text-orange-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{campaigns.length}</p>
            <p className="text-sm text-gray-500 mt-1">Campaigns</p>
          </div>
        </div>

        {/* Send Campaign */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-4">New Campaign</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Campaign Subject"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
            />
            <textarea
              placeholder="Campaign Message"
              value={campaignBody}
              onChange={(e) => setCampaignBody(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
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
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-black text-gray-900">Recent Campaigns</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Subject</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Sent</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Opens</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No campaigns yet
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{campaign.subject}</td>
                    <td className="px-6 py-4 text-gray-600">{campaign.sent_count || 0}</td>
                    <td className="px-6 py-4 text-gray-600">{campaign.open_count || 0}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketingPage;
