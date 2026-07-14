"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, ArrowLeft, Loader } from 'lucide-react';
import api from '@/services/api';

export default function SellerAnalyticsPage() {
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const res = await api.get('/sellers/me/earnings');
      setEarnings(res.data);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { label: 'Total Revenue', value: `Ksh ${Math.round((earnings?.total_revenue || 0) / 1000)}k`, trend: 'up', percent: 22 },
    { label: 'Total Orders', value: earnings?.total_orders?.toString() || '0', trend: 'up', percent: 15 },
    { label: 'Avg Order Value', value: `Ksh ${Math.round((earnings?.average_order_value || 0) / 1000)}k`, trend: 'up', percent: 8 },
    { label: 'Conversion Rate', value: earnings?.conversion_rate ? `${earnings.conversion_rate}%` : '0%', trend: 'up', percent: 5 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex items-center gap-4">
          <Link href="/seller-dashboard" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <h1 className="text-3xl font-black text-white">Analytics</h1>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6"
            >
              <p className="text-slate-300 text-sm font-medium">{metric.label}</p>
              <h3 className="text-2xl font-black text-white mt-2">{metric.value}</h3>
              <div className="flex items-center gap-2 mt-4">
                <span className={`text-sm font-bold ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.trend === 'up' ? '+' : '-'}{metric.percent}%
                </span>
                <span className="text-slate-400 text-xs">vs last month</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
