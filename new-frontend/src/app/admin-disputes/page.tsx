"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader, AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';
import api from '@/services/api';

interface Dispute {
  id: number;
  buyer_name: string;
  seller_name: string;
  reason: string;
  status: 'open' | 'resolved' | 'rejected';
  created_at: string;
}

const DisputesPage = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      // Note: /disputes endpoint may not be implemented yet
      // This is a placeholder until the endpoint is available
      const response = await api.get('/disputes').catch(() => ({ data: [] }));
      setDisputes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading disputes:', error);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDisputes = disputes.filter(d =>
    d.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.seller_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    rejected: disputes.filter(d => d.status === 'rejected').length,
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
        <div className="flex items-center gap-4">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Disputes Management</h1>
            <p className="text-gray-500 mt-1">Manage buyer-seller disputes</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Total Disputes</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.total}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-gray-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Open</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.open}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Resolved</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Rejected</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats.rejected}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
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
                placeholder="Search disputes..."
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Buyer</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Seller</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No disputes found
                    </td>
                  </tr>
                ) : (
                  filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">#{dispute.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{dispute.buyer_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{dispute.seller_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{dispute.reason}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          dispute.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                          dispute.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(dispute.created_at).toLocaleDateString()}
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

export default DisputesPage;
