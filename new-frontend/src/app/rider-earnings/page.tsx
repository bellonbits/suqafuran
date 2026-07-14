"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader, ArrowLeft, DollarSign, TrendingUp } from 'lucide-react';
import api from '@/services/api';

const RiderEarningsPage = () => {
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const res = await api.get('/riders/me/earnings').catch(() => null);
      if (res?.data) setEarnings(res.data);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
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
        <div className="flex items-center gap-4">
          <Link href="/rider-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Earnings</h1>
            <p className="text-gray-500 mt-1">View your earnings breakdown</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Today', value: `Ksh ${Math.round(earnings?.today || 0).toLocaleString()}`, icon: DollarSign },
            { label: 'This Week', value: `Ksh ${Math.round(earnings?.week || 0).toLocaleString()}`, icon: TrendingUp },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6">
                <Icon className="w-10 h-10 text-gray-400 mb-4" />
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'This Month', value: `Ksh ${Math.round(earnings?.month || 0).toLocaleString()}` },
            { label: 'All Time Total', value: `Ksh ${Math.round(earnings?.total || 0).toLocaleString()}` },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-black text-gray-900 mb-4">Earnings Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Completed Deliveries', value: earnings?.completed_deliveries || 0 },
              { label: 'Average Per Delivery', value: `Ksh ${Math.round(earnings?.avg_per_delivery || 0).toLocaleString()}` },
              { label: 'Total Distance', value: `${earnings?.total_distance || 0} km` },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderEarningsPage;
