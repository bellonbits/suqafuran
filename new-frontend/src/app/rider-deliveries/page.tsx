"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader, ArrowLeft, MapPin, Truck } from 'lucide-react';
import api from '@/services/api';

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
            <h1 className="text-3xl font-black text-gray-900">Active Deliveries</h1>
            <p className="text-gray-500 mt-1">View your delivery schedule</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <Truck className="w-10 h-10 text-[#6cd4ff] mb-4" />
          <p className="text-3xl font-black text-gray-900">{deliveries.length}</p>
          <p className="text-sm text-gray-500 mt-1">Active Deliveries</p>
        </div>

        {deliveries.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
            <Truck className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No active deliveries</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">Delivery #{delivery.id}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <MapPin className="w-4 h-4" />
                      {delivery.destination || 'Pending location'}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    delivery.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {delivery.status || 'pending'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="font-bold text-gray-900">{delivery.distance || '0'} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delivery Fee</p>
                    <p className="font-bold text-green-600">Ksh {Math.round(delivery.fee || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ETA</p>
                    <p className="font-bold text-gray-900">{delivery.eta || 'TBD'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDeliveriesPage;
