"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Loader, TrendingUp, Users, ShoppingBag, 
  MessageSquare, Clock, Phone, Search, RefreshCw, 
  Check, XCircle, Eye, Mail, PhoneCall, MapPin, AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  promotionService,
  adminService,
  supportService,
  auditService,
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
      // Note: These endpoints may not be exposed as service methods yet
      // They'll be added to promotionService when the backend exposes them
      loadDashboardData();
    } catch (error) {
      console.error('Error approving listing:', error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      // Note: These endpoints may not be exposed as service methods yet
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Agent Dashboard</h1>
              <p className="text-gray-500 mt-1">Marketing insights, signups and full listing database</p>
            </div>
          </div>
          <button 
            onClick={() => loadDashboardData()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200">
          {[
            { id: 'marketing', label: 'Marketing', icon: TrendingUp },
            { id: 'signups', label: 'Signups', icon: Users },
            { id: 'listings', label: 'All Listings', icon: ShoppingBag },
            { id: 'verifications', label: 'Verifications', icon: CheckCircle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id as Tab); setSearchQuery(''); setStatusFilter(''); }}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-sky-600 text-[#6cd4ff]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* MARKETING TAB */}
        {activeTab === 'marketing' && stats && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold">Total Users</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{stats.total_users}</p>
                  </div>
                  <Users className="w-10 h-10 text-[#6cd4ff]" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold">Users with Ads</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{stats.users_with_ads}</p>
                  </div>
                  <ShoppingBag className="w-10 h-10 text-orange-500" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold">Conversion Rate</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{(stats.conversion_rate * 100).toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-500" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold">Active Listings</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{stats.active_listings}</p>
                  </div>
                  <Eye className="w-10 h-10 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-black text-gray-900 mb-6">Conversion Funnel</h2>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 font-semibold">Total Signups</p>
                  <p className="text-4xl font-black text-gray-900 mt-2">{stats.total_users}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold">Posted Ads</p>
                  <p className="text-4xl font-black text-gray-900 mt-2">{stats.users_with_ads}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold">Conversion</p>
                  <p className="text-4xl font-black text-gray-900 mt-2">{(stats.conversion_rate * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#5bc0e8] h-full rounded-full transition-all"
                  style={{ width: `${Math.min(stats.conversion_rate * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0%</span>
                <span>Target: 50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-black text-gray-900 mb-4">Signups Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-semibold">Today</span>
                    <span className="text-2xl font-black text-gray-900">{stats.signups_today}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-semibold">This Week</span>
                    <span className="text-2xl font-black text-gray-900">{stats.signups_week}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-black text-gray-900 mb-4">Ads Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-semibold">Posted Today</span>
                    <span className="text-2xl font-black text-gray-900">{stats.ads_today}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-semibold">This Week</span>
                    <span className="text-2xl font-black text-gray-900">{stats.ads_week}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIGNUPS TAB */}
        {activeTab === 'signups' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">Signed Up Users</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {signups.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No users found</div>
              ) : (
                signups.map((user) => (
                  <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#5bc0e8] flex items-center justify-center font-bold">
                          {user.full_name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.full_name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <PhoneCall className="w-3 h-3" /> {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString()}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                          user.has_posted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {user.ad_count} ad{user.ad_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">Listing Database</h2>
                <p className="text-sm text-gray-500">{listings.length} listings</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title or owner..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
                  />
                </div>

                <div className="flex gap-2">
                  {['', 'active', 'pending', 'rejected', 'sold'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                        statusFilter === status
                          ? 'bg-[#5bc0e8] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status || 'All'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {listings.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No listings found</div>
              ) : (
                listings.map((listing) => (
                  <div key={listing.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-black text-gray-900">{listing.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            listing.status === 'active' ? 'bg-green-100 text-green-700' :
                            listing.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            listing.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            Owner: <span className="font-semibold">{listing.owner_name}</span>
                          </p>
                          <div className="flex items-center gap-4 text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {listing.owner_email}
                            </span>
                            {listing.owner_phone && (
                              <span className="flex items-center gap-1">
                                <PhoneCall className="w-3 h-3" /> {listing.owner_phone}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-6 text-gray-500 pt-2">
                            <span className="font-bold text-gray-900">Ksh {listing.price?.toLocaleString()}</span>
                            {listing.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {listing.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {listing.views} views
                            </span>
                            <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {listing.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(listing.id)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors"
                            >
                              <Check className="w-4 h-4 inline mr-1" /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(listing.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors"
                            >
                              <XCircle className="w-4 h-4 inline mr-1" /> Reject
                            </button>
                          </>
                        )}
                        {listing.status === 'active' && (
                          <button
                            onClick={() => handleReject(listing.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors"
                          >
                            <XCircle className="w-4 h-4 inline mr-1" /> Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VERIFICATIONS TAB */}
        {activeTab === 'verifications' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-black text-gray-900">Seller Verifications</h2>
              <p className="text-sm text-gray-500 mt-1">Review and approve new seller applications</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-600 font-semibold">Pending</p>
                  <p className="text-2xl font-black text-yellow-700">{verifications.filter(v => v.status === 'pending').length}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-semibold">Approved</p>
                  <p className="text-2xl font-black text-green-700">{verifications.filter(v => v.status === 'approved').length}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-600 font-semibold">Rejected</p>
                  <p className="text-2xl font-black text-red-700">{verifications.filter(v => v.status === 'rejected').length}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {verifications.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No verification requests</div>
              ) : (
                [...verifications]
                  .sort((a, b) => {
                    // Sort pending first, then approved, then rejected
                    const statusOrder = { pending: 0, approved: 1, rejected: 2 };
                    const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 3;
                    const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 3;
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    // Within same status, sort by created_at (newest first)
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .map((verification) => (
                    <div key={verification.id} className={`p-6 hover:bg-gray-50 transition-colors ${verification.status === 'pending' ? 'bg-yellow-50/30' : ''}`}>
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-black text-gray-900">
                              {verification.user?.full_name || verification.user_name || `User #${verification.user_id}`}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              verification.status === 'approved' ? 'bg-green-100 text-green-700' :
                              verification.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {verification.status === 'pending' ? '🔄 Pending' : verification.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                            </span>
                            {verification.tier && (
                              <span className="px-2 py-1 bg-[#e0f7ff] text-blue-700 rounded text-xs font-bold">
                                {verification.tier.toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-4 text-gray-500 flex-wrap">
                              {verification.user?.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {verification.user.email}
                                </span>
                              )}
                              {verification.user?.phone && (
                                <span className="flex items-center gap-1">
                                  <PhoneCall className="w-3 h-3" /> {verification.user.phone}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-gray-600">
                              <p>
                                <span className="font-semibold">Document:</span> {verification.document_type?.replace(/_/g, ' ')}
                              </p>
                              {verification.id_number && (
                                <p>
                                  <span className="font-semibold">ID:</span> {verification.id_number}
                                </p>
                              )}
                            </div>
                            {verification.facial_match_score && (
                              <p className="text-gray-600">
                                <span className="font-semibold">Face Match:</span> {(verification.facial_match_score * 100).toFixed(1)}%
                              </p>
                            )}
                            {verification.auto_verification_status && (
                              <p className="text-gray-600">
                                <span className="font-semibold">Auto Verification:</span> {verification.auto_verification_status}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">Applied: {new Date(verification.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {verification.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleVerificationApprove(verification.id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors"
                              >
                                <Check className="w-4 h-4 inline mr-1" /> Approve
                              </button>
                              <button
                                onClick={() => handleVerificationReject(verification.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors"
                              >
                                <XCircle className="w-4 h-4 inline mr-1" /> Reject
                              </button>
                            </>
                          )}
                          {verification.status === 'approved' && (
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm flex items-center gap-1">
                              <Check className="w-4 h-4" /> Seller Verified
                            </span>
                          )}
                          {verification.status === 'rejected' && (
                            <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold text-sm flex items-center gap-1">
                              <XCircle className="w-4 h-4" /> Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;
