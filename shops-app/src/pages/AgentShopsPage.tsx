"use client";

import React, { useState, useEffect } from 'react';
import { Search, Loader, Edit2, X, Check, AlertCircle, Image as ImageIcon, ExternalLink, LayoutDashboard, TrendingUp, Users, ShoppingBag, Store } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';

interface Shop {
  id: number;
  business_name: string;
  full_name: string;
  shop_description?: string;
  logo_url?: string;
  shop_page_banner?: string;
  shop_detail_banner?: string;
  is_active: boolean;
  email: string;
}

const agentNavItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/agent-dashboard' },
  { label: 'Shops', icon: <Store className="w-5 h-5" />, href: '/agent-shops' },
  { label: 'Listings', icon: <ShoppingBag className="w-5 h-5" />, href: '/agent-listings' },
  { label: 'Earnings', icon: <TrendingUp className="w-5 h-5" />, href: '/agent-earnings' },
  { label: 'Analytics', icon: <Users className="w-5 h-5" />, href: '/agent-analytics' },
];

export default function AgentShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal state
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [form, setForm] = useState({ business_name: '', shop_description: '', logo_url: '', shop_page_banner: '', shop_detail_banner: '' });
  const [uploading, setUploading] = useState<'logo' | 'page_banner' | 'detail_banner' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/shops', { params: { skip: 0, limit: 500 } });
      setShops(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = [...shops]
    .sort((a, b) => a.business_name.localeCompare(b.business_name))
    .filter((shop) => {
      const q = searchQuery.toLowerCase();
      return (
        shop.business_name?.toLowerCase().includes(q) ||
        shop.full_name?.toLowerCase().includes(q) ||
        shop.email?.toLowerCase().includes(q)
      );
    });

  const openEdit = (shop: Shop) => {
    setEditingShop(shop);
    setForm({
      business_name: shop.business_name || '',
      shop_description: shop.shop_description || '',
      logo_url: shop.logo_url || '',
      shop_page_banner: shop.shop_page_banner || '',
      shop_detail_banner: shop.shop_detail_banner || '',
    });
    setError('');
    setSuccess('');
  };

  const handleImageUpload = async (field: 'logo_url' | 'shop_page_banner' | 'shop_detail_banner', kind: 'logo' | 'page_banner' | 'detail_banner', file: File) => {
    setUploading(kind);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('high_quality', 'true');
      const res = await api.post('/listings/upload', formData);
      setForm((f) => ({ ...f, [field]: res.data.url }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Image upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!editingShop) return;
    if (!form.business_name.trim()) {
      setError('Shop name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/shops/${editingShop.id}`, {
        business_name: form.business_name.trim(),
        shop_description: form.shop_description.trim() || null,
        logo_url: form.logo_url || null,
        shop_page_banner: form.shop_page_banner || null,
        shop_detail_banner: form.shop_detail_banner || null,
      });

      setShops((prev) => prev.map((s) => (s.id === editingShop.id ? { ...s, ...form } : s)));
      setSuccess('Shop updated successfully');
      setTimeout(() => {
        setEditingShop(null);
        setSuccess('');
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update shop');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Shops" navItems={agentNavItems} userRole="agent">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Shops</h1>
        <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">
          Edit a shop's name, description, logo, and banners.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search shops by name, owner, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 dark:text-slate-400">Shop</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 dark:text-slate-400">Owner</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 dark:text-slate-400">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-gray-500 text-sm">
                      {searchQuery ? 'No shops match your search' : 'No shops found'}
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {shop.logo_url ? (
                            <img src={shop.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">{shop.business_name}</p>
                            <p className="text-xs text-gray-500 truncate">{shop.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-slate-300">{shop.full_name}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${shop.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(shop)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                            title="Edit shop details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <a href={`/shop/${shop.id}`} target="_blank" rel="noopener noreferrer">
                            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg" title="View shop">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {editingShop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-lg font-black text-gray-900 dark:text-slate-100">Edit Shop</h2>
              <button onClick={() => setEditingShop(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Shop Name</label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                  maxLength={100}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold outline-none focus:border-primary disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  value={form.shop_description}
                  onChange={(e) => setForm((f) => ({ ...f, shop_description: e.target.value }))}
                  rows={3}
                  disabled={saving}
                  placeholder="What does this shop sell?"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm outline-none focus:border-primary disabled:opacity-50 resize-none"
                />
              </div>

              {[
                { key: 'logo_url' as const, kind: 'logo' as const, label: 'Logo' },
                { key: 'shop_page_banner' as const, kind: 'page_banner' as const, label: 'Shop Card Banner' },
                { key: 'shop_detail_banner' as const, kind: 'detail_banner' as const, label: 'Shop Page Banner' },
              ].map(({ key, kind, label }) => (
                <div key={key}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{label}</label>
                  <div className="flex items-center gap-3">
                    {form[key] ? (
                      <img src={form[key]} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-slate-800" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors">
                        {uploading === kind ? 'Uploading...' : 'Upload image'}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading !== null || saving}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(key, kind, file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}

              {success && (
                <div className="flex gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}
              {error && (
                <div className="flex gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-slate-800">
              <button
                onClick={() => setEditingShop(null)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading !== null || !form.business_name.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
