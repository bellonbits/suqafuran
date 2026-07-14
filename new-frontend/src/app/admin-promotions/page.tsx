"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader, ArrowLeft, Percent, TrendingUp, Calendar } from 'lucide-react';
import api from '@/services/api';

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 0,
    max_uses: 0,
    expiry_date: '',
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/marketing/codes`).catch(() => null);
      if (res?.data) setPromotions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = async () => {
    if (!formData.code.trim()) return;
    try {
      await api.post(`/marketing/codes`, formData).catch(() => null);
      setFormData({ code: '', discount_percentage: 0, max_uses: 0, expiry_date: '' });
      loadPromotions();
    } catch (error) {
      console.error('Error creating promotion:', error);
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!confirm('Delete this promotion?')) return;
    try {
      await api.delete(`/marketing/codes/${id}`).catch(() => null);
      loadPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const filteredPromotions = promotions.filter((p) =>
    p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  const activePromos = promotions.filter((p) => !p.is_expired).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Promotions & Vouchers</h1>
            <p className="text-gray-500 mt-1">Manage discount codes and promotional campaigns</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Percent className="w-10 h-10 text-[#6cd4ff] mb-4" />
            <p className="text-3xl font-black text-gray-900">{promotions.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total Vouchers</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <TrendingUp className="w-10 h-10 text-green-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{activePromos}</p>
            <p className="text-sm text-gray-500 mt-1">Active</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Calendar className="w-10 h-10 text-purple-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{promotions.reduce((sum, p) => sum + (p.used_count || 0), 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Total Used</p>
          </div>
        </div>

        {/* Create Promotion */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-4">Create New Voucher</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Voucher Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
            />
            <input
              type="number"
              placeholder="Discount %"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
              className="px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
            />
            <input
              type="number"
              placeholder="Max Uses"
              value={formData.max_uses}
              onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
              className="px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
            />
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
            />
          </div>
          <button
            onClick={handleCreatePromotion}
            className="mt-4 px-6 py-3 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg font-bold transition-colors w-full"
          >
            Create Voucher
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vouchers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
          />
        </div>

        {/* Vouchers Table */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Code</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Discount</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Used / Max</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No vouchers found
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-bold text-lg">{promo.code}</td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">{promo.discount_percentage}%</td>
                    <td className="px-6 py-4 text-gray-600">{promo.used_count || 0} / {promo.max_uses || '∞'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        promo.is_expired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {promo.is_expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeletePromotion(promo.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromotionsPage;
