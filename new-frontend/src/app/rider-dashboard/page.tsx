"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Truck, DollarSign, Clock, Star, Loader, ArrowLeft } from 'lucide-react';
import api from '@/services/api';

const RiderDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsRes = await api.get('/riders/me/profile').catch(() => null);
      if (statsRes?.data) setStats(statsRes.data);

      const deliveriesRes = await api.get('/riders/me/deliveries?limit=5').catch(() => null);
      if (deliveriesRes?.data) setDeliveries(Array.isArray(deliveriesRes.data) ? deliveriesRes.data : []);
    } catch (error) {
      console.error('Error loading stats:', error);
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
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Rider Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {stats?.full_name || 'Rider'}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Deliveries Today', value: stats?.today_deliveries || 0, icon: Truck, color: 'blue' },
            { label: 'Today Earnings', value: `Ksh ${Math.round(stats?.today_earnings || 0).toLocaleString()}`, icon: DollarSign, color: 'green' },
            { label: 'Avg Delivery Time', value: `${stats?.avg_delivery_time || 0} min`, icon: Clock, color: 'purple' },
            { label: 'Rating', value: `${stats?.rating || 0}/5`, icon: Star, color: 'orange' },
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

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-black text-gray-900">Active Deliveries</h2>
          </div>
          {deliveries.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No active deliveries</div>
          ) : (
            <div className="space-y-3 p-6">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-[#6cd4ff]" />
                    <div>
                      <p className="font-semibold text-gray-900">Delivery #{delivery.id}</p>
                      <p className="text-xs text-gray-500">{delivery.destination || 'Pending location'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">Ksh {Math.round(delivery.fee || 0).toLocaleString()}</p>
                    <p className={`text-xs font-semibold mt-1 ${
                      delivery.status === 'in_progress' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {delivery.status || 'pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
