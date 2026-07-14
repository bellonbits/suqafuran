"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader, Truck, MapPin, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { deliveryService } from '@/services';

interface Delivery {
  id: number;
  rider_name: string;
  customer_name: string;
  location: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await deliveryService.getDeliveries({ limit: 100 });
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(d =>
    d.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: deliveries.length,
    completed: deliveries.filter(d => d.status === 'completed').length,
    in_progress: deliveries.filter(d => d.status === 'in_progress' || d.status === 'pickup').length,
    pending: deliveries.filter(d => d.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Deliveries</h1>
              <p className="text-gray-500 mt-1">Track all delivery assignments & status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Total Deliveries</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.total}</p>
              </div>
              <Truck className="w-10 h-10 text-[#6cd4ff]" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Completed</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.completed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">In Progress</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.in_progress}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Pending</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.pending}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deliveries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Rider</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No deliveries found
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">#{delivery.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{delivery.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{delivery.rider_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {delivery.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          delivery.status === 'completed' ? 'bg-green-100 text-green-700' :
                          delivery.status === 'in_progress' || delivery.status === 'pickup' ? 'bg-[#e0f7ff] text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(delivery.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveriesPage;
