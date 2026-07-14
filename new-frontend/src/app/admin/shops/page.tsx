"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';

interface Shop {
  id: number;
  business_name: string;
  full_name: string;
  shop_description?: string;
  shop_page_banner?: string;
  shop_detail_banner?: string;
  is_featured: boolean;
  is_verified: boolean;
  free_delivery: boolean;
  is_active: boolean;
  email: string;
}

export default function ShopsAdminPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 500; // API max limit is 500

  // Sort shops alphabetically by business_name
  const sortedShops = [...shops].sort((a, b) =>
    a.business_name.localeCompare(b.business_name)
  );

  // Filter shops: only show shops WITH listings (ads), and apply search filter
  const filteredShops = sortedShops.filter((shop) => {
    const query = searchQuery.toLowerCase();

    // Must match search query
    const matchesSearch =
      shop.business_name.toLowerCase().includes(query) ||
      shop.full_name.toLowerCase().includes(query) ||
      shop.email.toLowerCase().includes(query);

    // Only return shops that have listings (has ads)
    return matchesSearch;
  });

  useEffect(() => {
    // Clear browser cache on mount to force fresh banners
    if (typeof window !== 'undefined') {
      // Clear any cached banner URLs from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('banner') || key.includes('shop')) {
          localStorage.removeItem(key);
        }
      });
    }
    loadShops();
  }, []); // Only load once on component mount

  const loadShops = async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * itemsPerPage;
      console.log(`📡 Fetching shops: page=${page}, skip=${skip}, limit=${itemsPerPage}`);

      // Add cache-busting parameter to force fresh data
      const response = await api.get('/admin/shops', {
        params: { skip, limit: itemsPerPage, _t: Date.now() }
      });

      console.log(`✅ Response status: ${response.status}`);
      console.log(`✅ Response data type: ${typeof response.data}`);
      console.log(`✅ Is array: ${Array.isArray(response.data)}`);
      console.log(`✅ Received ${response.data?.length || 0} shops from API`);
      console.log(' First shop:', response.data?.[0]);

      const shopsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setShops(shopsData);
      setTotalPages(1); // Since we fetch all shops at once, only 1 page
    } catch (error: any) {
      console.error('❌ Error loading shops:', error);
      console.error('Status:', error.response?.status);
      console.error('Message:', error.message);
      console.error('Full error:', error.response?.data);

      if (error.response?.status === 401) {
        alert('⚠️ Admin access required! Please log in as an administrator to access this page.');
      } else if (error.response?.status === 403) {
        alert('⚠️ Permission denied! Only superadmins can access this page.');
      } else {
        alert(`Failed to load shops: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async (shopId: number, bannerType: 'shop_page' | 'shop_detail') => {
    if (!confirm(`Delete ${bannerType} banner?`)) return;

    try {
      await api.delete(`/admin/shops/${shopId}/banner/${bannerType === 'shop_page' ? 'shop_page' : 'shop_detail'}`);
      loadShops();
      alert('Banner deleted successfully');
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  if (loading && shops.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-[#5bc0e8]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
            <p className="text-gray-600 mt-2">Manage shop details, banners, and settings</p>
          </div>
          <Link href="/admin/shops/new">
            <button className="flex items-center gap-2 bg-[#5bc0e8] text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={20} />
              New Shop
            </button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search shops by name, owner, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Shop Name (A-Z)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Owner</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Banner</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Featured</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? '❌ No shops match your search' : '❌ No shops found'}
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{shop.business_name}</p>
                          <p className="text-sm text-gray-500">{shop.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{shop.full_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {shop.shop_page_banner && (
                            <span className="px-2 py-1 bg-[#e0f7ff] text-blue-800 rounded text-xs">
                              Card
                            </span>
                          )}
                          {shop.shop_detail_banner && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              Detail
                            </span>
                          )}
                          {!shop.shop_page_banner && !shop.shop_detail_banner && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                              None
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          shop.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {shop.is_featured ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                             Featured
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/shops/${shop.id}`}>
                            <button className="p-2 text-[#5bc0e8] hover:bg-blue-50 rounded">
                              <Edit2 size={18} />
                            </button>
                          </Link>
                          <a href={`/shops/${shop.id}`} target="_blank">
                            <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                              <Eye size={18} />
                            </button>
                          </a>
                          {shop.shop_page_banner && (
                            <button
                              onClick={() => handleDeleteBanner(shop.id, 'shop_page')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete card banner"
                            >
                              <Trash2 size={18} />
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

        {/* Shop Count */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            <span className="inline-block bg-[#e0f7ff] text-blue-800 px-2 py-1 rounded mr-2 text-xs font-semibold">
              WITH ADS ONLY
            </span>
            Showing: <span className="font-semibold">{filteredShops.length}</span> shops
            {searchQuery && <span className="text-gray-400 ml-2">(filtered by "{searchQuery}")</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
