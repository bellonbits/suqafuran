"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader, ArrowLeft, AlertTriangle, Eye, Lock } from 'lucide-react';
import api from '@/services/api';

const UnusualAccountsPage = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    loadAccounts();
  }, [riskFilter]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?limit=200`).catch(() => null);
      if (res?.data) {
        let data = Array.isArray(res.data) ? res.data : [];
        if (riskFilter === 'high') data = data.filter((u: any) => u.is_suspicious);
        if (riskFilter === 'new') data = data.filter((u: any) => {
          const daysOld = (Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return daysOld < 7;
        });
        setAccounts(data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendAccount = async (userId: number) => {
    if (!confirm('Suspend this account?')) return;
    try {
      await api.patch(`/users/${userId}/status`, { is_active: false }).catch(() => null);
      loadAccounts();
    } catch (error) {
      console.error('Error suspending account:', error);
    }
  };

  const handleReviewAccount = async (userId: number) => {
    try {
      await api.patch(`/users/${userId}`, { is_suspicious: false }).catch(() => null);
      loadAccounts();
    } catch (error) {
      console.error('Error reviewing account:', error);
    }
  };

  const filteredAccounts = accounts.filter((a) =>
    a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  const suspiciousCount = accounts.filter((a) => a.is_suspicious).length;
  const newCount = accounts.filter((a) => {
    const daysOld = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld < 7;
  }).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Unusual Accounts</h1>
            <p className="text-gray-500 mt-1">Monitor suspicious and high-risk accounts</p>
          </div>
        </div>

        <div className="relative">
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

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{suspiciousCount}</p>
            <p className="text-sm text-gray-500 mt-1">Suspicious Accounts</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Eye className="w-10 h-10 text-yellow-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{newCount}</p>
            <p className="text-sm text-gray-500 mt-1">New Accounts (7 days)</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Lock className="w-10 h-10 text-[#6cd4ff] mb-4" />
            <p className="text-3xl font-black text-gray-900">{accounts.filter((a) => !a.is_active).length}</p>
            <p className="text-sm text-gray-500 mt-1">Suspended</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'high', 'new'].map((f) => (
            <button
              key={f}
              onClick={() => setRiskFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                riskFilter === f
                  ? 'bg-[#5bc0e8] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All Accounts' : f === 'high' ? 'High Risk' : 'New Accounts'}
            </button>
          ))}
        </div>

        {/* Accounts Table */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Name</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Joined</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Risk Level</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No accounts found
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account, idx) => {
                  const daysOld = (Date.now() - new Date(account.created_at).getTime()) / (1000 * 60 * 60 * 24);
                  const risk = account.is_suspicious ? 'high' : daysOld < 7 ? 'medium' : 'low';
                  return (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900 font-medium">{account.full_name}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{account.email}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {account.created_at ? new Date(account.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          risk === 'high'
                            ? 'bg-red-100 text-red-700'
                            : risk === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {risk.charAt(0).toUpperCase() + risk.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {account.is_suspicious && (
                          <>
                            <button
                              onClick={() => handleReviewAccount(account.id)}
                              className="px-3 py-1 bg-[#5bc0e8] hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleSuspendAccount(account.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                              Suspend
                            </button>
                          </>
                        )}
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
  );
};

export default UnusualAccountsPage;
