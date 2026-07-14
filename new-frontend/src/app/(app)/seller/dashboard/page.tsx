"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuth';
import { 
  Package, Clock, CheckCircle, Truck, TrendingUp, 
  X, Store, ShoppingCart, Eye, Plus, RefreshCw,
  AlertTriangle, ArrowLeft, ChevronRight, Star,
  BarChart2, Layers, Bell, Settings
} from 'lucide-react';

interface DashboardStats {
  shop_name: string;
  owner_name: string;
  stats: {
    pending: number;
    preparing: number;
    ready_for_pickup: number;
    in_delivery: number;
    delivered: number;
    total_revenue: number;
  };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  seller_amount: number;
  delivery_address: string;
  items: any[];
  created_at?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:          { label: 'Pending',     color: 'text-amber-700',  bg: 'bg-amber-100',  icon: Clock },
  confirmed:        { label: 'Confirmed',   color: 'text-blue-700',   bg: 'bg-[#e0f7ff]',   icon: CheckCircle },
  preparing:        { label: 'Preparing',   color: 'text-violet-700', bg: 'bg-violet-100', icon: Package },
  ready_for_pickup: { label: 'Ready',       color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  in_delivery:      { label: 'Delivering',  color: 'text-sky-700',    bg: 'bg-[#c0eeff]',    icon: Truck },
  delivered:        { label: 'Delivered',   color: 'text-emerald-700',bg: 'bg-emerald-100',icon: TrendingUp },
  cancelled:        { label: 'Cancelled',   color: 'text-red-700',    bg: 'bg-red-100',    icon: X },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-700', bg: 'bg-gray-100', icon: Package };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

export default function SellerDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'listings'>('overview');
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      const [dashRes, ordersRes] = await Promise.all([
        api.get('/sellers/me/dashboard'),
        api.get('/sellers/me/orders'),
      ]);
      setDashboard(dashRes.data);
      const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchListings = async () => {
    if (listings.length > 0) return;
    try {
      setListingsLoading(true);
      const res = await api.get('/listings/me', { params: { limit: 50 } });
      setListings(res.data?.items || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setListingsLoading(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'listings') fetchListings();
  };

  const updateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      setUpdating(true);
      await api.patch(`/sellers/me/orders/${selectedOrder.id}`, { status: newStatus });
      await fetchData(true);
      setSelectedOrder(null);
      setNewStatus('');
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.detail || 'Failed to update'}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const totalActive = (stats?.pending ?? 0) + (stats?.preparing ?? 0) + (stats?.ready_for_pickup ?? 0) + (stats?.in_delivery ?? 0);

  const STAT_CARDS = [
    { label: 'Pending',    value: stats?.pending ?? 0,          icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/30',  border: 'border-amber-200 dark:border-amber-800' },
    { label: 'Preparing',  value: stats?.preparing ?? 0,        icon: Package,      color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800' },
    { label: 'Ready',      value: stats?.ready_for_pickup ?? 0, icon: CheckCircle,  color: 'text-green-600',   bg: 'bg-green-50 dark:bg-green-950/30',   border: 'border-green-200 dark:border-green-800' },
    { label: 'Delivering', value: stats?.in_delivery ?? 0,      icon: Truck,        color: 'text-[#6cd4ff]',     bg: 'bg-[#e0f7ff] dark:bg-sky-950/30',       border: 'border-sky-200 dark:border-sky-800' },
    { label: 'Delivered',  value: stats?.delivered ?? 0,        icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">

      {/* ─── Top Hero Banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black text-white border-2 border-white/30">
                {(dashboard?.shop_name || user?.full_name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{dashboard?.shop_name || 'My Shop'}</h1>
                <p className="text-orange-100 text-sm mt-0.5">
                  {dashboard?.owner_name || user?.full_name} • Seller Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Revenue chip */}
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
                <p className="text-orange-100 text-xs font-semibold">Total Revenue</p>
                <p className="text-white text-lg font-black">KSh {(stats?.total_revenue ?? 0).toLocaleString()}</p>
              </div>
              {/* Active orders chip */}
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
                <p className="text-orange-100 text-xs font-semibold">Active Orders</p>
                <p className="text-white text-lg font-black">{totalActive}</p>
              </div>
              {/* Refresh */}
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors border border-white/20"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6">
            {(['overview', 'orders', 'listings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/sell"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-orange-600 text-sm font-bold hover:bg-orange-50 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Listing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content Area ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {STAT_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className={`rounded-2xl border p-5 ${card.bg} ${card.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{card.label}</p>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Orders Quick View */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Recent Orders</h2>
                <button onClick={() => handleTabChange('orders')} className="text-orange-600 text-sm font-semibold flex items-center gap-1 hover:opacity-80">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No orders yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Orders will appear here when customers buy from your shop</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {orders.slice(0, 5).map((order) => (
                    <button
                      key={order.id}
                      onClick={() => { setSelectedOrder(order); setNewStatus(''); }}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                          <Package className="w-4.5 h-4.5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900 dark:text-white">KSh {order.total_amount.toLocaleString()}</p>
                          <p className="text-xs text-green-600 font-semibold">Earn KSh {order.seller_amount.toLocaleString()}</p>
                        </div>
                        <StatusBadge status={order.status} />
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">All Orders ({orders.length})</h2>
              <button onClick={() => fetchData(true)} disabled={refreshing} className="text-sm text-orange-600 font-semibold flex items-center gap-1.5 hover:opacity-80">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            {orders.length === 0 ? (
              <div className="py-20 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => { setSelectedOrder(order); setNewStatus(''); }}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''} • {order.delivery_address || 'No address'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-gray-900 dark:text-white">KSh {order.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-green-600 font-semibold">Earn KSh {order.seller_amount.toLocaleString()}</p>
                      </div>
                      <StatusBadge status={order.status} />
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LISTINGS TAB ── */}
        {activeTab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">My Listings</h2>
              <Link href="/sell" className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-colors">
                <Plus className="w-4 h-4" />
                Add Listing
              </Link>
            </div>
            {listingsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse h-48" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 py-20 text-center">
                <Layers className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No listings yet</p>
                <Link href="/sell" className="inline-flex items-center gap-1.5 mt-4 px-5 py-2 rounded-full bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="relative h-36 bg-gray-100 dark:bg-slate-800">
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt={listing.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-300 dark:text-slate-600" />
                        </div>
                      )}
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {listing.status || 'active'}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{listing.title_en}</p>
                      <p className="text-sm font-black text-orange-600 mt-0.5">KSh {listing.price?.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Eye className="w-3 h-3" />{listing.views ?? 0}</span>
                        <Link href={`/listings/${listing.id}/edit`} className="ml-auto text-xs text-orange-600 font-semibold hover:opacity-80">Edit</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Order Detail Modal ────────────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedOrder(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide">Order Details</p>
                <h3 className="text-white font-black text-xl">#{selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Financials */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Order Total</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">KSh {selectedOrder.total_amount.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4">
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide mb-1">Your Earnings</p>
                  <p className="text-2xl font-black text-green-700 dark:text-green-400">KSh {selectedOrder.seller_amount.toLocaleString()}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Status</p>
                <StatusBadge status={selectedOrder.status} />
              </div>

              {/* Delivery address */}
              {selectedOrder.delivery_address && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Delivery Address</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{selectedOrder.delivery_address}</p>
                </div>
              )}

              {/* Items */}
              {selectedOrder.items?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">Items ({selectedOrder.items.length})</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={item.id ?? idx} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-slate-800 last:border-0">
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{item.title || item.title_en}</span>
                        <span className="text-gray-500 dark:text-gray-400 font-semibold">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              {['confirmed', 'preparing'].includes(selectedOrder.status) && (
                <div className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Update Order Status</p>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-orange-300 dark:border-orange-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select new status…</option>
                    {selectedOrder.status === 'confirmed' && <option value="preparing">Start Preparing</option>}
                    {selectedOrder.status === 'preparing' && <option value="ready_for_pickup">Mark as Ready for Pickup</option>}
                  </select>
                  <button
                    onClick={updateStatus}
                    disabled={!newStatus || updating}
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-slate-700 text-white font-bold transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {updating ? 'Updating…' : 'Confirm Update'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
