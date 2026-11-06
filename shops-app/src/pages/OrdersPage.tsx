"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  X, 
  MessageSquare, 
  Store, 
  ChevronRight, 
  Send, 
  Phone, 
  ExternalLink, 
  ShieldCheck, 
  TrendingUp, 
  BadgePercent, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import api from '@/services/api';
import { orderService, Order } from '@/services/orderService';
import { orderActivityService, OrderDealActivity } from '@/services/orderActivityService';

export default function OrdersPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<OrderDealActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'chat_active' | 'pending'>('all');
  const [selectedActivity, setSelectedActivity] = useState<OrderDealActivity | null>(null);

  // Issue reporting & Rating Modal states
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [issueType, setIssueType] = useState<'item_mismatch' | 'damaged' | 'missing_items' | 'other'>('item_mismatch');
  const [issueDescription, setIssueDescription] = useState('');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setRefreshing(true);
      const data = await orderActivityService.getFullActivityFeed();
      setActivities(data);
    } catch (err) {
      console.error('Failed to load order and deal activities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConfirmDeal = async (act: OrderDealActivity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await orderActivityService.confirmDealMade(act.id, act.items[0]?.id as number);
      await loadActivities();
      if (selectedActivity && selectedActivity.id === act.id) {
        setSelectedActivity(prev => prev ? { ...prev, isOrderMade: true, dealStatus: 'deal_confirmed' } : null);
      }
    } catch (err) {
      console.error('Failed to confirm deal:', err);
    }
  };

  // Compute live analytics
  const analytics = useMemo(() => {
    return orderActivityService.computeAnalytics(activities);
  }, [activities]);

  // Filter activities by tab
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (activeTab === 'confirmed') {
        return act.isOrderMade || act.dealStatus === 'deal_confirmed' || act.dealStatus === 'order_completed';
      }
      if (activeTab === 'chat_active') {
        return act.hasFollowedUpInChat;
      }
      if (activeTab === 'pending') {
        return !act.isOrderMade && (!act.hasFollowedUpInChat || act.dealStatus === 'inquired');
      }
      return true;
    });
  }, [activities, activeTab]);

  const handleOpenChat = (act: OrderDealActivity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    orderActivityService.markFollowedUp(act.id);
    router.push(act.chatUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Loading Order & Deal Activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">

        {/* Top Page Header */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                Buyer & Seller Hub
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Live Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Order & Deal Activity
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-xl">
              Track buyer orders, cart inquiries, seller shop origin, chat follow-ups, and confirmed deal completions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadActivities}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-700 font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Activity</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              Shop More
            </button>
          </div>
        </div>

        {/* Executive Analytics KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Inquiries & Orders */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inquiries & Orders</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics.totalCount}</p>
              <p className="text-[11px] text-sky-600 font-semibold">{analytics.inquiriesCount} tracked inquiries</p>
            </div>
          </div>

          {/* Total Pipeline Value */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Value</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                KSh {analytics.totalPipelineValue.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">Total gross demand</p>
            </div>
          </div>

          {/* Follow-up Rate */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chat Follow-up</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics.followUpRate}%</p>
              <p className="text-[11px] text-blue-600 font-semibold">{analytics.followedUpCount} seller chats active</p>
            </div>
          </div>

          {/* Deals Made & Conversion */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deals Completed</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics.ordersMadeCount}</p>
              <p className="text-[11px] text-purple-600 font-semibold">{analytics.conversionRate}% conversion rate</p>
            </div>
          </div>
        </div>

        {/* Tab Filter Row */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-2 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
            }`}
          >
            <span>All Activity</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{activities.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Orders Made / Deals Confirmed</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{analytics.ordersMadeCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('chat_active')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'chat_active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Inquiries with Chat Follow-up</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{analytics.followedUpCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Follow-up / Response</span>
          </button>
        </div>

        {/* Activity Items Feed */}
        {filteredActivities.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-12 text-center space-y-4">
            <Package className="w-16 h-16 text-slate-300 dark:text-neutral-700 mx-auto" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">No activity in this view</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              When you add items to cart, checkout, or inquire with sellers, your orders and follow-ups will appear here with complete tracking.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Explore Marketplace Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((act) => {
              const isConfirmed = act.isOrderMade || act.dealStatus === 'deal_confirmed' || act.dealStatus === 'order_completed';

              return (
                <motion.div
                  key={act.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedActivity(act)}
                  className={`bg-white dark:bg-neutral-900 border rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 ${
                    isConfirmed 
                      ? 'border-emerald-200 dark:border-emerald-950/60' 
                      : 'border-slate-200 dark:border-neutral-800'
                  }`}
                >
                  {/* Shop Provenance Header & Order ID */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-400">Shop:</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white hover:text-sky-600 transition-colors">
                            {act.shopName}
                          </span>
                          {act.isVerifiedShop && (
                            <ShieldCheck className="w-4 h-4 text-sky-500" title="Verified Store" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-semibold">
                          {act.orderNumber} • {new Date(act.createdAt).toLocaleDateString()} at {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Follow-up & Deal Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Follow-up Status Badge */}
                      {act.hasFollowedUpInChat ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                          <span>Followed Up in Chat</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Awaiting Chat Follow-up</span>
                        </span>
                      )}

                      {/* Order Made Status Badge */}
                      {isConfirmed ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Order Made & Deal Confirmed</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200/60 flex items-center gap-1.5">
                          <span>Inquired Only</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Section: Items breakdown & Total Price */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {act.items.length} Product{act.items.length !== 1 ? 's' : ''} Inquired / Ordered
                      </p>
                      <div className="space-y-1.5">
                        {act.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-neutral-200">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-[11px] font-bold text-slate-600 dark:text-neutral-300">
                              x{item.quantity || 1}
                            </span>
                            <span className="font-bold">{item.title}</span>
                            <span className="text-slate-400 font-normal ml-auto sm:ml-0">
                              (KSh {(item.price * (item.quantity || 1)).toLocaleString()})
                            </span>
                          </div>
                        ))}
                      </div>

                      {act.deliveryLocation && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Location: {act.deliveryLocation}</span>
                        </div>
                      )}
                    </div>

                    {/* Total Amount & Primary Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-neutral-800">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider sm:text-right">Total Amount</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          KSh {act.totalAmount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        {/* Direct Chat Button */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenChat(act, e)}
                          className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat with Shop</span>
                        </button>

                        {/* Deal Confirm Button (if not confirmed yet) */}
                        {!isConfirmed && (
                          <button
                            type="button"
                            onClick={(e) => handleConfirmDeal(act, e)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Purchase</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

        {/* Detailed Order / Activity Modal */}
        <AnimatePresence>
          {selectedActivity && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-neutral-800"
              >
                {/* Modal Top Bar */}
                <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800 p-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      Order Inquiry #{selectedActivity.orderNumber}
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold">
                      Shop: {selectedActivity.shopName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status Box */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    selectedActivity.isOrderMade 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 text-sky-800 dark:text-sky-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      {selectedActivity.isOrderMade ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-6 h-6 text-sky-600 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-black">
                          {selectedActivity.isOrderMade ? 'Order Completed & Deal Confirmed' : 'Inquiry Sent to Seller'}
                        </p>
                        <p className="text-xs opacity-75">
                          {selectedActivity.hasFollowedUpInChat ? 'Buyer followed up via Suqafuran chat' : 'Awaiting buyer follow-up message'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Ordered Products
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-neutral-800 border rounded-2xl border-slate-100 dark:border-neutral-800 overflow-hidden">
                      {selectedActivity.items.map((item, idx) => (
                        <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-neutral-850">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                            <p className="text-slate-400 font-semibold mt-0.5">Quantity: {item.quantity || 1}</p>
                          </div>
                          <p className="font-black text-slate-900 dark:text-white">
                            KSh {(item.price * (item.quantity || 1)).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="bg-slate-50 dark:bg-neutral-850 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Shop / Seller</span>
                      <span className="font-black text-slate-900 dark:text-white">{selectedActivity.shopName}</span>
                    </div>
                    {selectedActivity.deliveryLocation && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Delivery / Meetup</span>
                        <span className="font-bold text-slate-700 dark:text-neutral-300">{selectedActivity.deliveryLocation}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-neutral-700 text-sm font-black">
                      <span className="text-slate-900 dark:text-white">Total Amount</span>
                      <span className="text-sky-600 dark:text-sky-400">KSh {selectedActivity.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons in Modal */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleOpenChat(selectedActivity)}
                      className="flex-1 py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat with {selectedActivity.shopName}</span>
                    </button>

                    {!selectedActivity.isOrderMade && (
                      <button
                        onClick={() => handleConfirmDeal(selectedActivity)}
                        className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Purchase</span>
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
