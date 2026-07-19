"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Loader } from 'lucide-react';
import api from '@/services/api';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      const res = await api.get('/campaigns?limit=50').catch(() => null);

      if (res?.data) {
        const campaignsList = Array.isArray(res.data) ? res.data : [];
        setCampaigns(campaignsList);

        const activeCampaigns = campaignsList.filter((c: any) => c.status === 'active').length;
        const totalClicks = campaignsList.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0);
        const conversions = campaignsList.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0);
        const conversionRate = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(1) : 0;

        setStats({
          active_promotions: activeCampaigns,
          total_clicks: totalClicks,
          conversion_rate: conversionRate,
        });
      }
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-500 text-sm">Loading marketing campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Marketing</h1>
          <p className="text-gray-600 dark:text-slate-400">Boost your sales with promotions</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Active Promotions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.active_promotions || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Clicks</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats?.total_clicks || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Conversion Rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.conversion_rate || 0}%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Active Campaigns</h2>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <p className="text-gray-500 text-sm">No campaigns yet. Create one to get started!</p>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{campaign.name}</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">Clicks: {campaign.clicks || 0} | Conversions: {campaign.conversions || 0}</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">Edit</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
