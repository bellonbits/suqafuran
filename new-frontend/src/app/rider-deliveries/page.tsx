"use client";

import React, { useState, useEffect } from 'react';
import { Loader, MapPin, Truck, LayoutDashboard, DollarSign, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';

const riderNavItems = [
  { label: 'Dashboard',   icon: <LayoutDashboard className="w-5 h-5" />, href: '/rider-dashboard' },
  { label: 'Deliveries',  icon: <Truck className="w-5 h-5" />,           href: '/rider-deliveries' },
  { label: 'Earnings',    icon: <DollarSign className="w-5 h-5" />,      href: '/rider-earnings' },
  { label: 'Messages',    icon: <MessageSquare className="w-5 h-5" />,   href: '/rider-messages' },
];

const RiderDeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const res = await api.get('/riders/me/deliveries').catch(() => null);
      if (res?.data) setDeliveries(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Active Deliveries" navItems={riderNavItems} userRole="rider">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-gray-500 text-sm font-medium">Loading deliveries database...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Active Deliveries" navItems={riderNavItems} userRole="rider">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Delivery Schedule</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track and coordinate active customer shipments</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{deliveries.length}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Active Deliveries Scheduled</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Destination Location</th>
                <th>Distance</th>
                <th>Compensation</th>
                <th>Estimated Time</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-gray-500">No active deliveries scheduled</p>
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td>
                      <span className="font-bold text-sky-600 font-mono text-xs bg-sky-50 px-2 py-1 rounded-lg">
                        #{delivery.id}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-700 text-sm font-semibold flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {delivery.destination || 'Pending details'}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-600 text-sm font-medium">
                        {delivery.distance || '0'} km
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-emerald-600">
                        Ksh {Math.round(delivery.fee || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-600 text-sm font-medium">
                        {delivery.eta || 'TBD'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`badge ${delivery.status === 'in_progress' ? 'badge-yellow' : 'badge-gray'}`}>
                        {delivery.status || 'pending'}
                      </span>
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

export default RiderDeliveriesPage;
