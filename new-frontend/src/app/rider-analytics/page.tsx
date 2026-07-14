"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, Loader, ArrowLeft, TrendingUp, Calendar, MapPin, Users } from 'lucide-react';
import api from '@/services/api';

const RiderAnalytics = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      const res = await api.get(`/riders/me/analytics?period=${timeframe}`).catch(() => null);
      if (res?.data) setStats(res.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  const analyticsCards = [
    {
      label: 'Total Distance',
      value: `${stats?.total_distance || 0} km`,
      change: stats?.distance_change || 0,
      icon: <MapPin className="w-6 h-6" />,
      color: 'blue',
    },
    {
      label: 'Delivery Completion',
      value: `${stats?.completion_rate || 0}%`,
      change: stats?.completion_change || 0,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'green',
    },
    {
      label: 'Avg Rating',
      value: `${stats?.avg_rating || 0}/5`,
      change: stats?.rating_change || 0,
      icon: <Users className="w-6 h-6" />,
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/rider-dashboard" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <h1 className="text-3xl font-black text-white">Analytics</h1>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                timeframe === period
                  ? 'bg-[#5bc0e8] text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analyticsCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-700 rounded-lg">
                  {React.cloneElement(card.icon, { className: 'w-6 h-6 text-white' })}
                </div>
                {card.change !== 0 && (
                  <span className={`text-xs font-bold ${card.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {card.change > 0 ? '↑' : '↓'} {Math.abs(card.change)}%
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm font-medium mb-2">{card.label}</p>
              <h3 className="text-2xl font-black text-white">{card.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Performance Summary */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6"
          >
            <h2 className="text-lg font-black text-white mb-6">Performance Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Total Deliveries</span>
                <span className="font-bold text-white">{stats?.total_deliveries || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">On-Time Delivery Rate</span>
                <span className="font-bold text-green-400">{stats?.on_time_rate || 0}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Customer Satisfaction</span>
                <span className="font-bold text-[#6cd4ff]">{stats?.satisfaction_score || 0}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Acceptance Rate</span>
                <span className="font-bold text-purple-400">{stats?.acceptance_rate || 0}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RiderAnalytics;
