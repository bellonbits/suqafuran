"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader, Store, Star, Mail, Phone, Search, TrendingUp } from 'lucide-react';
import api from '@/services/api';

interface Seller {
  id: number;
  shop_name: string;
  owner_name: string;
  email: string;
  phone: string;
  rating: number;
  total_products: number;
  active_products: number;
  created_at: string;
  verified: boolean;
}

const SellersPage = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    setLoading(true);
    try {
      // Get verifications (approved sellers) - limit to 50 to avoid timeout
      const verResponse = await api.get('/verifications/?limit=50');

      let data = Array.isArray(verResponse.data) ? verResponse.data : [];
      console.log(`Loaded ${data.length} verifications`);

      // Transform data and fetch product counts with concurrency limit
      const results = [];
      for (const v of data) {
        let total_products = 0;
        let active_products = 0;

        try {
          const listingsRes = await api.get(`/listings/?limit=100&owner_id=${v.user_id}`);
          if (Array.isArray(listingsRes.data)) {
            total_products = listingsRes.data.length;
            active_products = listingsRes.data.filter((l: any) => l.status === 'active').length;
          }
        } catch (e) {
          // Silently fail for listings fetch
        }

        results.push({
          id: v.id,
          shop_name: v.user?.business_name || v.user?.full_name || 'Unknown',
          owner_name: v.user?.full_name || 'Unknown',
          email: v.user?.email || '',
          phone: v.user?.phone || '',
          rating: 0,
          total_products,
          active_products,
          created_at: v.created_at || new Date().toISOString(),
          verified: v.status === 'approved'
        });
      }

      console.log(`Transformed to ${results.length} sellers`);
      setSellers(results);
    } catch (error) {
      console.error('Error loading sellers:', error);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(s =>
    s.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Sellers Management</h1>
              <p className="text-gray-500 mt-1">Manage seller shops and verify sellers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Total Sellers</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{sellers.length}</p>
              </div>
              <Store className="w-10 h-10 text-[#6cd4ff]" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Verified</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{sellers.filter(s => s.verified).length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Total Products</p>
                <p className="text-3xl font-black text-gray-900 mt-2">
                  {sellers.reduce((sum, s) => sum + (s.total_products || 0), 0)}
                </p>
              </div>
              <Search className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by shop name, owner, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
            />
          </div>
        </div>

        {/* Sellers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSellers.length === 0 ? (
            <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
              No sellers found
            </div>
          ) : (
            filteredSellers.map((seller) => (
              <div key={seller.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{seller.shop_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Owner: {seller.owner_name}</p>
                  </div>
                  {seller.verified && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" /> {seller.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" /> {seller.phone}
                  </div>
                  {seller.rating > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" /> {seller.rating.toFixed(1)} rating
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-semibold">Total Products</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{seller.total_products}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-semibold">Active</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{seller.active_products}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                  Joined: {new Date(seller.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SellersPage;
