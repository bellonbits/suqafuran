"use client";

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Truck, DollarSign, Clock, Star, Loader, LayoutDashboard, MessageSquare, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';

const riderNavItems = [
  { label: 'Dashboard',   icon: <LayoutDashboard className="w-5 h-5" />, href: '/rider-dashboard' },
  { label: 'Deliveries',  icon: <Truck className="w-5 h-5" />,           href: '/rider-deliveries' },
  { label: 'Earnings',    icon: <DollarSign className="w-5 h-5" />,      href: '/rider-earnings' },
  { label: 'Messages',    icon: <MessageSquare className="w-5 h-5" />,   href: '/rider-messages' },
];

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
      <DashboardLayout title="Rider Dashboard" navItems={riderNavItems} userRole="rider">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-gray-500 text-sm font-medium">Loading Rider Profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Rider Dashboard" navItems={riderNavItems} userRole="rider">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Rider Portal</h2>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {stats?.full_name || 'Rider'}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Deliveries Completed Today', value: stats?.today_deliveries || 0, icon: Truck, color: 'bg-sky-100 text-sky-600' },
          { label: "Today's Earnings", value: `Ksh ${Math.round(stats?.today_earnings || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Avg Delivery Duration', value: `${stats?.avg_delivery_time || 0} mins`, icon: Clock, color: 'bg-purple-100 text-purple-600' },
          { label: 'Customer Rating', value: `${stats?.rating || 0} / 5`, icon: Star, color: 'bg-amber-100 text-amber-600' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="stat-card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active deliveries listing */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-sky-500" /> Active Delivery Schedule
        </h3>

        {deliveries.length === 0 ? (
          <div className="stat-card py-16 text-center text-gray-400">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-gray-500">No active deliveries scheduled</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Delivery ID</th>
                    <th>Destination Location</th>
                    <th>Compensation</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery: any) => (
                    <tr key={delivery.id}>
                      <td>
                        <span className="font-bold text-sky-600 font-mono text-xs bg-sky-50 px-2 py-1 rounded-lg">
                          #{delivery.id}
                        </span>
                      </td>
                      <td>
                        <span className="text-gray-700 text-sm font-semibold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {delivery.destination || 'Pending details'}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-emerald-600">
                          Ksh {Math.round(delivery.fee || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className={`badge ${delivery.status === 'in_progress' ? 'badge-yellow' : 'badge-gray'}`}>
                          {delivery.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RiderDashboard;
