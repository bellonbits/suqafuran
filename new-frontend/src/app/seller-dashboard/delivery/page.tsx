"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Loader } from 'lucide-react';
import api from '@/services/api';

export default function DeliveryPage() {
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveryData();
  }, []);

  const loadDeliveryData = async () => {
    try {
      const zonesRes = await api.get('/delivery-zones?limit=50').catch(() => null);

      if (zonesRes?.data) {
        const zones = Array.isArray(zonesRes.data) ? zonesRes.data : [];
        setDeliveryZones(zones);

        const activeCount = zones.filter((z: any) => z.status === 'active').length;
        const totalDeliveries = zones.reduce((sum: number, z: any) => sum + (z.orders_count || 0), 0);
        const avgRevenue = zones.length > 0
          ? zones.reduce((sum: number, z: any) => sum + (z.fee || 0), 0) / zones.length
          : 0;

        setStats({
          active_zones: activeCount,
          total_deliveries: totalDeliveries,
          avg_revenue: Math.round(avgRevenue),
        });
      }
    } catch (error) {
      console.error('Error loading delivery zones:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-500 text-sm">Loading delivery zones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Delivery Zones</h1>
          <p className="text-gray-600 dark:text-slate-400">Manage delivery zones and pricing</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Add Zone
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Active Zones</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.active_zones || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Deliveries</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_deliveries || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Avg Revenue</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">KSh {(stats?.avg_revenue || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Zone Name</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Delivery Fee</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Orders</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveryZones.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">No delivery zones configured</td>
                </tr>
              ) : (
                deliveryZones.map((zone) => (
                  <tr key={zone.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{zone.name}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">KSh {(zone.fee || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{zone.orders_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        zone.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {zone.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
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
}
