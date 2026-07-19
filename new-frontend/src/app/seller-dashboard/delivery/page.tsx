"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Loader, Edit2, Trash2, X } from 'lucide-react';
import api from '@/services/api';

export default function DeliveryPage() {
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fee: '',
    status: 'active',
  });

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

  const handleOpenModal = (zone?: any) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        fee: zone.fee.toString(),
        status: zone.status,
      });
    } else {
      setEditingZone(null);
      setFormData({ name: '', fee: '', status: 'active' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingZone(null);
    setFormData({ name: '', fee: '', status: 'active' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        fee: parseInt(formData.fee),
        status: formData.status,
      };

      if (editingZone) {
        await api.put(`/delivery-zones/${editingZone.id}`, payload);
      } else {
        await api.post('/delivery-zones', payload);
      }

      handleCloseModal();
      loadDeliveryData();
    } catch (error) {
      console.error('Error saving zone:', error);
      alert('Failed to save delivery zone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery zone?')) return;

    try {
      await api.delete(`/delivery-zones/${id}`);
      loadDeliveryData();
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('Failed to delete delivery zone');
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
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
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
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryZones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">No delivery zones configured</td>
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
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(zone)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Zone Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Delivery Fee (KSh)
                </label>
                <input
                  type="number"
                  value={formData.fee}
                  onChange={(e) => setFormData({...formData, fee: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold"
                >
                  {submitting ? 'Saving...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
