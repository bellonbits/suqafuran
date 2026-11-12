"use client";

import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, Loader, ShoppingBag, Clock, CheckCircle2,
  Truck, AlertCircle, ChevronRight, User, Package, Calendar, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';

type OrderStatusFilter = 'All' | 'Pending' | 'Processing' | 'Delivered';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<OrderStatusFilter>('All');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    loadOrdersData();
  }, []);

  const loadOrdersData = async () => {
    try {
      const res = await api.get('/orders?limit=100').catch((err) => {
        console.error('Orders fetch failed:', err);
        return null;
      });

      if (res?.data) {
        const ordersArray = Array.isArray(res.data) ? res.data : res.data.orders || res.data.items || [];
        setOrders(ordersArray);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => (o.status || '').toLowerCase() === 'pending').length;
  const processingOrders = orders.filter((o) => (o.status || '').toLowerCase() === 'processing').length;
  const deliveredOrders = orders.filter((o) => ['delivered', 'completed'].includes((o.status || '').toLowerCase())).length;

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const orderIdStr = (o.id || o.order_number || '').toString().toLowerCase();
    const custName = (o.customer_name || o.customer?.full_name || o.buyer_name || '').toLowerCase();
    const itemsStr = Array.isArray(o.items) ? o.items.map((i: any) => i.title || '').join(' ').toLowerCase() : '';

    const matchesSearch = !q || orderIdStr.includes(q) || custName.includes(q) || itemsStr.includes(q);

    const st = (o.status || '').toLowerCase();
    if (!matchesSearch) return false;
    if (activeTab === 'Pending') return st === 'pending';
    if (activeTab === 'Processing') return st === 'processing';
    if (activeTab === 'Delivered') return st === 'delivered' || st === 'completed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return (
        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s === 'processing') {
      return (
        <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Truck className="w-3 h-3" />
          <span>Processing</span>
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
        {status || 'Order Placed'}
      </span>
    );
  };

  // Platform Controls Dismiss Dialog (Esc key)
  useEffect(() => {
    if (!selectedOrder) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOrder(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder]);

  if (loading) {
    return (
      <div className="space-y-5 pb-16 max-w-5xl mx-auto px-1 md:px-0 animate-pulse">
        {/* Top Header Skeleton */}
        <div className="pt-1 space-y-1">
          <div className="h-8 w-28 bg-slate-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-3 w-60 bg-slate-100 dark:bg-neutral-850 rounded-lg hidden sm:block" />
        </div>

        {/* Compact 4-Stat Strip Skeleton */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 bg-slate-50/80 dark:bg-neutral-900/60 p-2.5 md:p-3 rounded-2xl border border-slate-100 dark:border-neutral-800/80">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center p-2 rounded-xl space-y-1">
              <div className="h-3 w-10 bg-slate-200 dark:bg-neutral-800 rounded" />
              <div className="h-6 w-8 bg-slate-200 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>

        {/* Orders Card Skeletons */}
        <div className="space-y-3 pt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-900/90 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-slate-200 dark:bg-neutral-800 rounded" />
                <div className="h-5 w-20 bg-slate-200 dark:bg-neutral-800 rounded-full" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-3 w-28 bg-slate-100 dark:bg-neutral-850 rounded" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Orders
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block mt-0.5">
            Manage, fulfill, and track your customer orders
          </p>
        </div>
      </div>

      {/* ── Compact 4-Stat Strip ── */}
      <div className="grid grid-cols-4 gap-2 md:gap-4 bg-slate-50/80 dark:bg-neutral-900/60 p-2.5 md:p-3 rounded-2xl border border-slate-100 dark:border-neutral-800/80">
        <button
          onClick={() => setActiveTab('All')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'All' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
          <span className="text-base md:text-xl font-black text-slate-900 dark:text-white">{totalOrders}</span>
        </button>

        <button
          onClick={() => setActiveTab('Pending')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'Pending' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</span>
          <span className="text-base md:text-xl font-black text-amber-600 dark:text-amber-400">{pendingOrders}</span>
        </button>

        <button
          onClick={() => setActiveTab('Processing')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'Processing' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Processing</span>
          <span className="text-base md:text-xl font-black text-sky-600 dark:text-sky-400">{processingOrders}</span>
        </button>

        <button
          onClick={() => setActiveTab('Delivered')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'Delivered' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Delivered</span>
          <span className="text-base md:text-xl font-black text-emerald-600 dark:text-emerald-400">{deliveredOrders}</span>
        </button>
      </div>

      {/* ── Search Bar & Filter Tabs ── */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, customer, or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-100 dark:border-neutral-800 px-2 overflow-x-auto no-scrollbar">
          {(['All', 'Pending', 'Processing', 'Delivered'] as OrderStatusFilter[]).map((tab) => {
            const isTabActive = activeTab === tab;
            const count =
              tab === 'All' ? totalOrders :
              tab === 'Pending' ? pendingOrders :
              tab === 'Processing' ? processingOrders : deliveredOrders;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${
                  isTabActive
                    ? 'text-sky-600 dark:text-sky-400 font-extrabold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200'
                }`}
              >
                <span>{tab}</span>
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  isTabActive
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-black'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-400'
                }`}>
                  {count}
                </span>

                {isTabActive && (
                  <motion.div
                    layoutId="activeOrderTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Order List Cards (Clean Mobile & Desktop Layout) ── */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const orderIdStr = order.order_number || (order.id ? `ORD-${order.id.toString().padStart(6, '0')}` : 'ORD-000000');
            const custName = order.customer_name || order.customer?.full_name || order.buyer_name || 'Guest Customer';
            const amount = order.total_amount || order.amount || 0;
            const dateStr = order.created_at
              ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recently placed';
            
            const firstItem = order.items && Array.isArray(order.items) && order.items.length > 0 ? order.items[0] : null;
            const itemsSummary = firstItem
              ? `${firstItem.title || 'Item'}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}`
              : (order.items_count ? `${order.items_count} items` : '1 package');

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white dark:bg-neutral-900/90 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Header row: Order ID + Status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-neutral-800/60">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs md:text-sm text-slate-900 dark:text-white">
                      {orderIdStr}
                    </span>
                    <span className="text-[10px] text-slate-400">• {dateStr}</span>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Body row: Customer + Items + Amount */}
                <div className="flex items-center justify-between pt-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500/10 to-indigo-500/10 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      {custName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs md:text-sm text-slate-800 dark:text-white truncate">
                        {custName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {itemsSummary}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white">
                      KSh {Number(amount).toLocaleString()}
                    </p>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold flex items-center justify-end gap-0.5 mt-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900/60 rounded-3xl border border-slate-100 dark:border-neutral-800 p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
            {searchQuery ? 'No orders match your search' : 'No orders in this tab'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {searchQuery ? 'Try searching by a different term.' : 'Customer orders will appear here as soon as they are placed.'}
          </p>
        </div>
      )}

      {/* ── Order Details Modal ── */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain"
          onClick={() => setSelectedOrder(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-details-title"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-neutral-800 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Details</span>
                <h2 id="order-details-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedOrder.order_number || `ORD-${selectedOrder.id}`}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl">
                <span className="text-slate-400">Status</span>
                <span>{getStatusBadge(selectedOrder.status)}</span>
              </div>

              <div className="flex justify-between p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl">
                <span className="text-slate-400">Customer</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedOrder.customer_name || selectedOrder.customer?.full_name || 'Guest Customer'}
                </span>
              </div>

              <div className="flex justify-between p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl">
                <span className="text-slate-400">Total Amount</span>
                <span className="font-black text-slate-900 dark:text-white">
                  KSh {Number(selectedOrder.total_amount || selectedOrder.amount || 0).toLocaleString()}
                </span>
              </div>

              {selectedOrder.phone && (
                <div className="flex justify-between p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl">
                  <span className="text-slate-400">Contact</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedOrder.phone}</span>
                </div>
              )}

              {selectedOrder.delivery_address && (
                <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
                  <span className="text-slate-400">Delivery Address</span>
                  <p className="font-medium text-slate-800 dark:text-white">{selectedOrder.delivery_address}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
