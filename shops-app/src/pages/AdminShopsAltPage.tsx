"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Loader, ChevronLeft, ChevronRight, X, AlertCircle, Check, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';

interface Shop {
  id: number;
  business_name: string;
  full_name: string;
  shop_description?: string;
  logo_url?: string;
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

  // Edit-name modal state
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Full edit modal state (name, description, logo, banners, toggles)
  const [detailShop, setDetailShop] = useState<Shop | null>(null);
  const [detailForm, setDetailForm] = useState({
    business_name: '',
    shop_description: '',
    logo_url: '',
    shop_page_banner: '',
    shop_detail_banner: '',
    is_featured: false,
    is_verified: false,
    free_delivery: false,
    is_active: true,
  });
  const [detailUploading, setDetailUploading] = useState<'logo' | 'page_banner' | 'detail_banner' | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailSuccess, setDetailSuccess] = useState('');

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

  const handleEditNameClick = (shop: Shop) => {
    setEditingShop(shop);
    setEditName(shop.business_name);
    setEditError('');
    setEditSuccess('');
  };

  const handleSaveShopName = async () => {
    if (!editingShop) return;

    if (!editName.trim()) {
      setEditError('Shop name cannot be empty');
      return;
    }

    if (editName === editingShop.business_name) {
      setEditError('No changes made');
      return;
    }

    if (editName.length > 100) {
      setEditError('Shop name must be 100 characters or less');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      const response = await api.patch(`/admin/shops/${editingShop.id}/name`, {
        business_name: editName.trim()
      });

      // Update the shops list
      setShops(shops.map(shop =>
        shop.id === editingShop.id
          ? { ...shop, business_name: response.data.new_name }
          : shop
      ));

      setEditSuccess('Shop name updated successfully');

      setTimeout(() => {
        setEditingShop(null);
        setEditError('');
        setEditSuccess('');
      }, 1500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to update shop name';
      setEditError(errorMsg);
    } finally {
      setEditSaving(false);
    }
  };

  const openDetailEdit = async (shop: Shop) => {
    // The list view truncates banner data (some are multi-MB base64 blobs),
    // so fetch this one shop's full record before showing the edit form.
    setDetailShop(shop);
    setDetailForm({
      business_name: shop.business_name || '',
      shop_description: shop.shop_description || '',
      logo_url: shop.logo_url || '',
      shop_page_banner: '',
      shop_detail_banner: '',
      is_featured: shop.is_featured,
      is_verified: shop.is_verified,
      free_delivery: shop.free_delivery,
      is_active: shop.is_active,
    });
    setDetailError('');
    setDetailSuccess('');
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/shops/${shop.id}`);
      const full = res.data;
      setDetailForm((f) => ({
        ...f,
        business_name: full.business_name || f.business_name,
        shop_description: full.shop_description || '',
        logo_url: full.logo_url || '',
        shop_page_banner: full.shop_page_banner || '',
        shop_detail_banner: full.shop_detail_banner || '',
        is_featured: full.is_featured,
        is_verified: full.is_verified,
        free_delivery: full.free_delivery,
        is_active: full.is_active,
      }));
    } catch (err) {
      console.error('Failed to load full shop details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDetailImageUpload = async (
    field: 'logo_url' | 'shop_page_banner' | 'shop_detail_banner',
    kind: 'logo' | 'page_banner' | 'detail_banner',
    file: File
  ) => {
    setDetailUploading(kind);
    setDetailError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('high_quality', 'true');
      const res = await api.post('/listings/upload', formData);
      setDetailForm((f) => ({ ...f, [field]: res.data.url }));
    } catch (err: any) {
      setDetailError(err.response?.data?.detail || 'Image upload failed');
    } finally {
      setDetailUploading(null);
    }
  };

  const handleSaveDetail = async () => {
    if (!detailShop) return;
    if (!detailForm.business_name.trim()) {
      setDetailError('Shop name cannot be empty');
      return;
    }

    setDetailSaving(true);
    setDetailError('');
    try {
      await api.put(`/admin/shops/${detailShop.id}`, {
        business_name: detailForm.business_name.trim(),
        shop_description: detailForm.shop_description.trim() || null,
        logo_url: detailForm.logo_url || null,
        shop_page_banner: detailForm.shop_page_banner || null,
        shop_detail_banner: detailForm.shop_detail_banner || null,
        is_featured: detailForm.is_featured,
        is_verified: detailForm.is_verified,
        free_delivery: detailForm.free_delivery,
        is_active: detailForm.is_active,
      });

      setShops((prev) => prev.map((s) => (s.id === detailShop.id ? { ...s, ...detailForm } : s)));
      setDetailSuccess('Shop updated successfully');
      setTimeout(() => {
        setDetailShop(null);
        setDetailSuccess('');
      }, 1200);
    } catch (err: any) {
      setDetailError(err.response?.data?.detail || 'Failed to update shop');
    } finally {
      setDetailSaving(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/40 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Shop Management</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">Manage shop details, banners, and settings</p>
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
              <thead className="bg-slate-100 dark:bg-slate-800 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Shop Name (A-Z)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Owner</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Banner</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Featured</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      {searchQuery ? '❌ No shops match your search' : '❌ No shops found'}
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-slate-50 dark:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{shop.business_name}</p>
                          <p className="text-sm text-slate-400">{shop.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{shop.full_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {shop.shop_page_banner && (
                            <span className="px-2 py-1 bg-[#e0f7ff] text-blue-800 rounded text-xs">
                              Card
                            </span>
                          )}
                          {shop.shop_detail_banner && (
                            <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-green-800 rounded text-xs">
                              Detail
                            </span>
                          )}
                          {!shop.shop_page_banner && !shop.shop_detail_banner && (
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-xs">
                              None
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          shop.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-green-800'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-red-800'
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
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditNameClick(shop)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                            title="Edit shop name"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => openDetailEdit(shop)}
                            className="p-2 text-[#5bc0e8] hover:bg-blue-50 rounded"
                            title="Edit shop details"
                          >
                            <Edit2 size={18} />
                          </button>
                          <a href={`/shop/${shop.id}`} target="_blank">
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
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-block bg-[#e0f7ff] text-blue-800 px-2 py-1 rounded mr-2 text-xs font-semibold">
              WITH ADS ONLY
            </span>
            Showing: <span className="font-semibold">{filteredShops.length}</span> shops
            {searchQuery && <span className="text-slate-400 ml-2">(filtered by "{searchQuery}")</span>}
          </p>
        </div>
      </div>

      {/* Edit Shop Name Modal */}
      {editingShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Shop Name</h2>
              <button
                onClick={() => setEditingShop(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Shop Info */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Shop Owner</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{editingShop.full_name}</p>
                <p className="text-xs text-slate-400 mt-1">{editingShop.email}</p>
              </div>

              {/* Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setEditError('');
                  }}
                  placeholder="Enter new shop name"
                  maxLength={100}
                  disabled={editSaving}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {editName.length}/100 characters
                </p>
              </div>

              {/* Success Message */}
              {editSuccess && (
                <div className="flex gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                  <Check size={20} className="text-green-600 shrink-0" />
                  <p className="text-sm text-green-800">{editSuccess}</p>
                </div>
              )}

              {/* Error Message */}
              {editError && (
                <div className="flex gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{editError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setEditingShop(null)}
                disabled={editSaving}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShopName}
                disabled={editSaving || !editName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-[#5bc0e8] hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium disabled:opacity-50"
              >
                {editSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Shop Modal */}
      {detailShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Shop</h2>
              <button onClick={() => setDetailShop(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Shop Owner</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{detailShop.full_name}</p>
                <p className="text-xs text-slate-400 mt-1">{detailShop.email}</p>
              </div>

              {detailLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader size={16} className="animate-spin" />
                  Loading full shop details...
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Shop Name</label>
                <input
                  type="text"
                  value={detailForm.business_name}
                  onChange={(e) => setDetailForm((f) => ({ ...f, business_name: e.target.value }))}
                  maxLength={100}
                  disabled={detailSaving}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  value={detailForm.shop_description}
                  onChange={(e) => setDetailForm((f) => ({ ...f, shop_description: e.target.value }))}
                  rows={3}
                  disabled={detailSaving}
                  placeholder="What does this shop sell?"
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                />
              </div>

              {([
                { key: 'logo_url', kind: 'logo', label: 'Logo' },
                { key: 'shop_page_banner', kind: 'page_banner', label: 'Shop Card Banner' },
                { key: 'shop_detail_banner', kind: 'detail_banner', label: 'Shop Page Banner' },
              ] as const).map(({ key, kind, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
                  <div className="flex items-center gap-3">
                    {detailForm[key] ? (
                      <img src={detailForm[key]} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="px-4 py-2 rounded-xl border border-dashed border-gray-300 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors">
                        {detailUploading === kind ? 'Uploading...' : 'Upload image'}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={detailUploading !== null || detailSaving}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDetailImageUpload(key, kind, file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'is_featured', label: 'Featured' },
                  { key: 'is_verified', label: 'Verified' },
                  { key: 'free_delivery', label: 'Free Delivery' },
                  { key: 'is_active', label: 'Active' },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detailForm[key]}
                      disabled={detailSaving}
                      onChange={(e) => setDetailForm((f) => ({ ...f, [key]: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                  </label>
                ))}
              </div>

              {detailSuccess && (
                <div className="flex gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                  <Check size={20} className="text-green-600 shrink-0" />
                  <p className="text-sm text-green-800">{detailSuccess}</p>
                </div>
              )}
              {detailError && (
                <div className="flex gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{detailError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setDetailShop(null)}
                disabled={detailSaving}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDetail}
                disabled={detailSaving || detailLoading || detailUploading !== null || !detailForm.business_name.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-[#5bc0e8] hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium disabled:opacity-50"
              >
                {detailSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
