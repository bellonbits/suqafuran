"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Loader, TrendingUp, Users, ShoppingBag, 
  Clock, Phone, Search, RefreshCw, 
  Check, XCircle, Eye, Mail, PhoneCall, MapPin,
  CheckCircle, LayoutDashboard, MessageSquare, DollarSign,
  Truck, Shield, AlertTriangle
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  promotionService,
  adminService,
  type ConversionStats,
  type SignupUser,
  type AgentListing
} from '@/services';

interface VerificationRequest {
  id: number;
  user_id: number;
  document_type: string;
  id_number?: string;
  status: 'pending' | 'approved' | 'rejected';
  tier: string;
  notes?: string;
  document_urls: string[];
  selfie_url?: string;
  proof_of_address_url?: string;
  video_selfie_url?: string;
  facial_match_score?: number;
  auto_verification_status?: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
    phone: string;
    is_verified?: boolean;
    avatar_url?: string;
  };
  user_name?: string;
}

type Tab = 'marketing' | 'signups' | 'listings' | 'verifications';

const agentNavItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/agent-dashboard' },
  { label: 'Marketing Info', icon: <TrendingUp className="w-5 h-5" />, href: '/agent-dashboard' },
  { label: 'Active Signups', icon: <Users className="w-5 h-5" />, href: '/agent-dashboard' },
  { label: 'Product Database', icon: <ShoppingBag className="w-5 h-5" />, href: '/agent-dashboard' },
];

const AgentDashboard = () => {
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [signups, setSignups] = useState<SignupUser[]>([]);
  const [listings, setListings] = useState<AgentListing[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('marketing');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, searchQuery, statusFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'marketing') {
        const data = await promotionService.getConversions();
        setStats(data);
      } else if (activeTab === 'signups') {
        const data = await promotionService.getSignups({ search: searchQuery, limit: 80 });
        setSignups(Array.isArray(data) ? data : []);
      } else if (activeTab === 'listings') {
        const data = await promotionService.getAllListings({ search: searchQuery, status_filter: statusFilter, limit: 100 });
        setListings(Array.isArray(data) ? data : []);
      } else if (activeTab === 'verifications') {
        const data = await adminService.getVerificationRequests();
        setVerifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      // Endpoint logic if exposed in future
      loadDashboardData();
    } catch (error) {
      console.error('Error approving listing:', error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      // Endpoint logic if exposed in future
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting listing:', error);
    }
  };

  const handleVerificationApprove = async (id: number) => {
    try {
      await adminService.moderateVerification(id, 'approved');
      loadDashboardData();
    } catch (error) {
      console.error('Error approving verification:', error);
    }
  };

  const handleVerificationReject = async (id: number) => {
    try {
      await adminService.moderateVerification(id, 'rejected');
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting verification:', error);
    }
  };

  if (loading && stats === null && signups.length === 0 && listings.length === 0 && verifications.length === 0) {
    return (
      <DashboardLayout title="Agent Dashboard" navItems={agentNavItems} userRole="agent">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-gray-500 text-sm font-medium">Loading Agent Data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agent Dashboard" navItems={agentNavItems} userRole="agent">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Agent Performance Portal</h2>
          <p className="text-sm text-gray-500 mt-0.5">Marketing insights, signups, and listing databases</p>
        </div>
        <button 
          onClick={() => loadDashboardData()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all shadow-sm text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Internal Tabs inside agent view */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 border-b border-gray-200">
        {[
          { id: 'marketing', label: 'Marketing Insights', icon: TrendingUp },
          { id: 'signups', label: 'Registered Signups', icon: Users },
          { id: 'listings', label: 'Product Database', icon: ShoppingBag },
          { id: 'verifications', label: 'Sellers Verifications', icon: CheckCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id as Tab); setSearchQuery(''); setStatusFilter(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === id
                ? 'border-sky-600 text-sky-600 bg-sky-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* MARKETING TAB */}
        {activeTab === 'marketing' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Total Registered Users', value: stats.total_users, icon: Users, color: 'bg-sky-100 text-sky-600' },
                { label: 'Users with Ads Posted', value: stats.users_with_ads, icon: ShoppingBag, color: 'bg-orange-100 text-orange-600' },
                { label: 'Conversion Funnel Rate', value: `${(stats.conversion_rate * 100).toFixed(1)}%`, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600' },
                { label: 'Active System Listings', value: stats.active_listings, icon: Eye, color: 'bg-purple-100 text-purple-600' }
              ].map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className="stat-card flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">{m.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">{m.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Funnel Progress */}
            <div className="stat-card">
              <h3 className="text-base font-bold text-gray-900 mb-4">Signup to Listing Funnel Conversion</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Total Signups</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{stats.total_users}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Posted at Least 1 Ad</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{stats.users_with_ads}</p>
                </div>
                <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl">
                  <p className="text-xs text-sky-700 font-bold uppercase">Overall Rate</p>
                  <p className="text-3xl font-black text-sky-600 mt-1">{(stats.conversion_rate * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.conversion_rate * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="stat-card">
                <h3 className="text-base font-bold text-gray-900 mb-4">Signups Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-2xl font-black text-gray-900">{stats.signups_today}</p>
                    <p className="text-xs text-gray-500 font-semibold mt-1">Signed Up Today</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-2xl font-black text-gray-900">{stats.signups_week}</p>
                    <p className="text-xs text-gray-500 font-semibold mt-1">This Week</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3 className="text-base font-bold text-gray-900 mb-4">Ads Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-2xl font-black text-gray-900">{stats.ads_today}</p>
                    <p className="text-xs text-gray-500 font-semibold mt-1">Ads Posted Today</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-2xl font-black text-gray-900">{stats.ads_week}</p>
                    <p className="text-xs text-gray-500 font-semibold mt-1">This Week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIGNUPS TAB */}
        {activeTab === 'signups' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user registry by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 shadow-sm"
                />
              </div>
            </div>

            <div className="data-table-wrapper">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User Details</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Registered</th>
                      <th className="text-right">Ad Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-gray-400">No registered users found matching query</td>
                      </tr>
                    ) : (
                      signups.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                {user.full_name[0]?.toUpperCase() || 'U'}
                              </div>
                              <span className="font-semibold text-gray-900">{user.full_name}</span>
                            </div>
                          </td>
                          <td><span className="text-gray-600 text-sm font-medium">{user.email}</span></td>
                          <td><span className="text-gray-600 text-sm font-mono">{user.phone || '—'}</span></td>
                          <td><span className="text-gray-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</span></td>
                          <td className="text-right">
                            <span className={`badge ${user.has_posted ? 'badge-green' : 'badge-gray'}`}>
                              {user.ad_count} ad{user.ad_count !== 1 ? 's' : ''}
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
        )}

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search listings by title or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 shadow-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['', 'active', 'pending', 'rejected', 'sold'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      statusFilter === status
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All Status'}
                  </button>
                ))}
              </div>
            </div>

            <div className="data-table-wrapper">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Owner / Shop</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Metrics</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-gray-400">No listings found matching criteria</td>
                      </tr>
                    ) : (
                      listings.map((listing) => (
                        <tr key={listing.id}>
                          <td>
                            <p className="font-semibold text-gray-900 max-w-xs truncate">{listing.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(listing.created_at).toLocaleDateString()}</p>
                          </td>
                          <td>
                            <p className="font-medium text-gray-800 leading-tight">{listing.owner_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{listing.owner_email}</p>
                          </td>
                          <td><span className="font-bold text-gray-900">Ksh {listing.price?.toLocaleString()}</span></td>
                          <td>
                            <span className={`badge ${
                              listing.status === 'active' ? 'badge-green' :
                              listing.status === 'pending' ? 'badge-yellow' :
                              listing.status === 'rejected' ? 'badge-red' :
                              'badge-gray'
                            }`}>
                              {listing.status}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                              <Eye className="w-3.5 h-3.5 text-gray-400" /> {listing.views} views
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {listing.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(listing.id)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(listing.id)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {listing.status === 'active' && (
                                <button
                                  onClick={() => handleReject(listing.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VERIFICATIONS TAB */}
        {activeTab === 'verifications' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700 font-bold uppercase">Awaiting Decision</p>
                <p className="text-3xl font-black text-amber-600 mt-1">{verifications.filter(v => v.status === 'pending').length}</p>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-700 font-bold uppercase">Approved Sellers</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{verifications.filter(v => v.status === 'approved').length}</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs text-red-700 font-bold uppercase">Rejected Requests</p>
                <p className="text-3xl font-black text-red-600 mt-1">{verifications.filter(v => v.status === 'rejected').length}</p>
              </div>
            </div>

            <div className="data-table-wrapper">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Seller Name</th>
                      <th>Contact Info</th>
                      <th>Tier Level</th>
                      <th>Document</th>
                      <th>Facial Match</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-gray-400">No seller verifications pending</td>
                      </tr>
                    ) : (
                      [...verifications]
                        .sort((a, b) => {
                          const statusOrder = { pending: 0, approved: 1, rejected: 2 };
                          const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 3;
                          const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 3;
                          if (aOrder !== bOrder) return aOrder - bOrder;
                          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        })
                        .map((v) => {
                          const name = v.user?.full_name || v.user_name || `User #${v.user_id}`;
                          const email = v.user?.email || '—';
                          const phone = v.user?.phone || '—';
                          const score = v.facial_match_score ? (v.facial_match_score * 100).toFixed(0) : '—';
                          return (
                            <tr key={v.id}>
                              <td>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                    {name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-gray-900">{name}</span>
                                </div>
                              </td>
                              <td>
                                <p className="text-xs text-gray-500 leading-none">{email}</p>
                                <p className="text-[10px] text-gray-400 mt-1 font-mono">{phone}</p>
                              </td>
                              <td><span className="badge badge-purple">{v.tier?.toUpperCase()}</span></td>
                              <td><span className="text-gray-600 text-xs font-semibold">{v.document_type?.replace(/_/g, ' ')}</span></td>
                              <td>
                                {score !== '—' ? (
                                  <span className={`font-bold ${Number(score) >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {score}% Match
                                  </span>
                                ) : '—'}
                              </td>
                              <td>
                                <span className={`badge ${
                                  v.status === 'approved' ? 'badge-green' :
                                  v.status === 'rejected' ? 'badge-red' :
                                  'badge-yellow'
                                }`}>
                                  {v.status === 'approved' ? (
                                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Verified</span>
                                  ) : v.status === 'rejected' ? (
                                    <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
                                  ) : (
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pending</span>
                                  )}
                                </span>
                              </td>
                              <td className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {v.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleVerificationApprove(v.id)}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleVerificationReject(v.id)}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {v.status === 'approved' && (
                                    <span className="text-xs text-gray-400 font-semibold px-2">Completed</span>
                                  )}
                                  {v.status === 'rejected' && (
                                    <span className="text-xs text-gray-400 font-semibold px-2">Rejected</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;
