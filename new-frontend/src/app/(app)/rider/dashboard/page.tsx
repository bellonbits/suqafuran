"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Navigation2, CheckCircle, Clock, MapPin, Phone, X } from 'lucide-react';

interface Delivery {
  assignment_id: string;
  order_id: string;
  status: string;
  delivery_address: string;
  phone_number: string;
  total_amount: number;
  payment_method?: string;
  items: any[];
}

export default function RiderDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [collectingPayment, setCollectingPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, deliveriesRes] = await Promise.all([
        api.get('/riders/me/profile'),
        api.get('/riders/me/deliveries')
      ]);
      setProfile(profileRes.data);
      setDeliveries(deliveriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!selectedDelivery || !newStatus) return;
    try {
      setUpdating(true);
      await api.patch(`/riders/me/deliveries/${selectedDelivery.assignment_id}`, {
        status: newStatus
      });
      alert('✓ Delivery updated');
      fetchData();
      setSelectedDelivery(null);
      setNewStatus('');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.detail}`);
    } finally {
      setUpdating(false);
    }
  };

  const notifyPayment = async () => {
    if (!selectedDelivery) return;
    try {
      setCollectingPayment(true);
      const response = await api.post(`/riders/me/deliveries/${selectedDelivery.assignment_id}/payment-prompt`);
      alert('✓ Customer has been notified to pay via M-Pesa');
      fetchData();
      setSelectedDelivery(null);
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.detail || 'Failed to notify customer'}`);
    } finally {
      setCollectingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: 'bg-[#e0f7ff] text-blue-700',
      picked_up: 'bg-yellow-100 text-yellow-700',
      in_transit: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-sky-600"></div>
      </div>
    );
  }

  const pendingCount = deliveries.filter(d => d.status !== 'delivered').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Rider Dashboard</h1>
        {profile && <p className="text-gray-600 dark:text-gray-400 mb-8">{profile.vehicle_type} • {profile.vehicle_plate}</p>}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Deliveries</p>
            <p className="text-3xl font-black">{pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Transit</p>
            <p className="text-3xl font-black">{deliveries.filter(d => d.status === 'in_transit').length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
            <p className="text-3xl font-black">{deliveries.filter(d => d.status === 'delivered').length}</p>
          </div>
        </div>

        {/* Deliveries */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-black mb-6">My Deliveries</h2>
          {deliveries.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No deliveries assigned</p>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <motion.div
                  key={delivery.assignment_id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedDelivery(delivery)}
                  className="border border-gray-200 dark:border-slate-800 rounded-lg p-4 cursor-pointer hover:shadow-md"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-sm text-gray-600">#{delivery.order_id.slice(0, 8)}</p>
                      <p className="font-bold">KSh {delivery.total_amount.toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {delivery.delivery_address}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedDelivery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Delivery #{selectedDelivery.order_id.slice(0, 8)}</h2>
                <button onClick={() => setSelectedDelivery(null)} className="text-gray-600 hover:text-gray-900">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Delivery Address</p>
                  <p className="font-bold text-lg">{selectedDelivery.delivery_address}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedDelivery.phone_number}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Items ({selectedDelivery.items.length})</p>
                  {selectedDelivery.items.map((item) => (
                    <p key={item.id} className="text-sm">{item.title} x {item.quantity}</p>
                  ))}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(selectedDelivery.status)}`}>
                    {selectedDelivery.status.replace('_', ' ')}
                  </span>
                </div>

                {['assigned', 'picked_up', 'in_transit'].includes(selectedDelivery.status) && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Update Status</p>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    >
                      <option value="">Select next status</option>
                      {selectedDelivery.status === 'assigned' && <option value="picked_up">Picked Up</option>}
                      {selectedDelivery.status === 'picked_up' && <option value="in_transit">In Transit</option>}
                      {selectedDelivery.status === 'in_transit' && <option value="delivered">Delivered</option>}
                    </select>
                    <button
                      onClick={updateStatus}
                      disabled={!newStatus || updating}
                      className="w-full mt-3 bg-[#5bc0e8] hover:bg-sky-700 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg"
                    >
                      {updating ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                )}

                {selectedDelivery.payment_method === 'cash_on_delivery' && selectedDelivery.status === 'in_transit' && (
                  <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
                    <p className="text-sm text-gray-600 mb-3 font-semibold">Payment on Delivery via M-Pesa</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Customer will pay:</strong> KSh {selectedDelivery.total_amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        Customer will receive M-Pesa prompt on their phone. Verify their identity and delivery address.
                      </p>
                    </div>
                    <button
                      onClick={notifyPayment}
                      disabled={collectingPayment}
                      className="w-full bg-[#5bc0e8] hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg"
                    >
                      {collectingPayment ? 'Notifying...' : '📲 Notify Customer to Pay'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
