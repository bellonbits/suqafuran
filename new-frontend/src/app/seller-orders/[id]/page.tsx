"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
} from 'lucide-react';
import api from '@/services/api';

interface OrderItem {
  id: string;
  product_id: number;
  title: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  seller_amount: number;
  platform_fee: number;
  delivery_option: string;
  delivery_address: string;
  phone_number: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  assigned_rider_id?: string;
  rider_location?: { lat: number; lng: number };
}

interface Rider {
  id: string;
  name: string;
  phone: string;
  rating: number;
  active_deliveries: number;
  location: { lat: number; lng: number };
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  confirmed: { bg: 'bg-[#e0f7ff]', text: 'text-blue-800', icon: CheckCircle },
  preparing: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Package },
  ready_for_pickup: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: Package },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: X },
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function SellerOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [availableRiders, setAvailableRiders] = useState<Rider[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [assigningRider, setAssigningRider] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (!order?.assigned_rider_id) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/sellers/me/orders/${id}/rider-location`);
        if (response.data?.location) {
          setOrder(prev => prev ? { ...prev, rider_location: response.data.location } : null);
        }
      } catch (err) {
        console.error('Failed to fetch rider location:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, order?.assigned_rider_id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/sellers/me/orders/${id}`);
      setOrder(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      await api.patch(`/sellers/me/orders/${id}`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const fetchAvailableRiders = async () => {
    try {
      setLoadingRiders(true);
      const response = await api.get('/riders/available');
      setAvailableRiders(response.data.riders || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load riders');
    } finally {
      setLoadingRiders(false);
    }
  };

  const assignRider = async () => {
    if (!order || !selectedRider) return;

    try {
      setAssigningRider(true);
      await api.post(`/sellers/me/orders/${id}/assign-rider`, {
        rider_id: selectedRider,
      });
      setOrder({ ...order, assigned_rider_id: selectedRider });
      setShowRiderModal(false);
      setSelectedRider(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign rider');
    } finally {
      setAssigningRider(false);
    }
  };

  const handleOpenRiderModal = () => {
    fetchAvailableRiders();
    setShowRiderModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This order does not exist.'}</p>
          <Link href="/seller-orders" className="inline-block bg-[#5bc0e8] hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-full">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = statusColors[order.status]?.icon || Clock;
  const paymentCompleted = order.payment_status === 'completed';
  const canUpdateStatus = ['confirmed', 'preparing'].includes(order.status);
  const isDeliveryOrder = order.delivery_option === 'delivery';
  const isPickupOrder = order.delivery_option === 'pickup';
  const canAssignRider = isDeliveryOrder && order.status === 'ready_for_pickup' && !order.assigned_rider_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/seller-orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-gray-900">Order Details</h1>
                <p className="text-gray-500 mt-0.5">Order ID: {id}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${statusColors[order.status]?.bg || 'bg-gray-100'} ${statusColors[order.status]?.text || 'text-gray-800'}`}>
              <StatusIcon className="w-5 h-5" />
              {order.status.toUpperCase().replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">Ksh {(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Ksh {item.price}/unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Delivery Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Delivery Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-semibold text-gray-900">{order.delivery_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Delivery Option</p>
                    <p className="font-semibold text-gray-900">{order.delivery_option.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-semibold text-gray-900">{order.phone_number}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Status Update - Pickup Mode */}
            {canUpdateStatus && isPickupOrder && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
              >
                <h3 className="font-bold text-blue-900 mb-4">Update Order Status</h3>
                <div className="space-y-2">
                  {order.status === 'confirmed' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateOrderStatus('preparing')}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Updating...' : 'Mark as Preparing'}
                    </motion.button>
                  )}
                  {order.status === 'preparing' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateOrderStatus('ready_for_pickup')}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Updating...' : 'Mark as Ready for Pickup'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Status Update - Delivery Mode */}
            {canUpdateStatus && isDeliveryOrder && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
              >
                <h3 className="font-bold text-blue-900 mb-4">Update Order Status</h3>
                <div className="space-y-2">
                  {order.status === 'confirmed' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateOrderStatus('preparing')}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Updating...' : 'Mark as Preparing'}
                    </motion.button>
                  )}
                  {order.status === 'preparing' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateOrderStatus('ready_for_pickup')}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Updating...' : 'Ready for Rider Pickup'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Assign Rider Section */}
            {canAssignRider && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-green-50 border border-green-200 rounded-2xl p-6"
              >
                <h3 className="font-bold text-green-900 mb-4">Assign Rider for Delivery</h3>
                <p className="text-sm text-green-700 mb-4">
                  Your order is ready. Select a rider to handle the delivery.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenRiderModal}
                  className="w-full px-4 py-2 bg-[#02CCFE] hover:bg-[#02CCFE] text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Truck className="w-5 h-5" />
                  {order.assigned_rider_id ? 'Change Rider' : 'Select Rider'}
                </motion.button>
              </motion.div>
            )}

            {/* Live Delivery Tracking */}
            {order.assigned_rider_id && isDeliveryOrder && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  Live Delivery Tracking
                </h2>

                {order.rider_location ? (
                  <div className="space-y-4">
                    {/* Map */}
                    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-indigo-200 flex items-center justify-center">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${order.rider_location.lat},${order.rider_location.lng}&zoom=16`}
                      />
                    </div>

                    {/* Location Details */}
                    <div className="space-y-2 p-4 bg-indigo-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Rider Location</p>
                          <p className="font-semibold text-gray-900">
                            {order.rider_location.lat.toFixed(4)}°, {order.rider_location.lng.toFixed(4)}°
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 mt-3">
                        <Truck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Rider ID</p>
                          <p className="font-semibold text-gray-900 font-mono">{order.assigned_rider_id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                    <p>Waiting for rider location...</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">Ksh {order.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Platform Fee</span>
                  <span className="font-semibold">Ksh {order.platform_fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Your Earning</span>
                  <span className="font-semibold">Ksh {order.seller_amount.toLocaleString()}</span>
                </div>
              </div>
              <div className={`px-3 py-2 rounded-lg text-sm font-bold text-center ${paymentStatusColors[order.payment_status] || 'bg-gray-100 text-gray-800'}`}>
                Payment: {order.payment_status.toUpperCase().replace(/_/g, ' ')}
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Rider Selection Modal */}
      {showRiderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Select a Rider</h2>
              <button
                onClick={() => {
                  setShowRiderModal(false);
                  setSelectedRider(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingRiders ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
              </div>
            ) : availableRiders.length === 0 ? (
              <div className="py-8 text-center text-gray-600">
                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No riders available at the moment</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {availableRiders.map((rider) => (
                  <motion.button
                    key={rider.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedRider(rider.id)}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                      selectedRider === rider.id
                        ? 'border-[#6cd4ff] bg-[#e0f7ff]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{rider.name}</p>
                        <p className="text-sm text-gray-600">{rider.phone}</p>
                      </div>
                      {selectedRider === rider.id && (
                        <CheckCircle className="w-6 h-6 text-[#6cd4ff] flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <span>★</span>
                        <span className="font-semibold">{rider.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-gray-600">
                        {rider.active_deliveries} active
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowRiderModal(false);
                  setSelectedRider(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={assignRider}
                disabled={!selectedRider || assigningRider || loadingRiders}
                className="flex-1 px-4 py-3 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {assigningRider ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    Assign Rider
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
