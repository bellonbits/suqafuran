"use client";

import React, { useState, useEffect } from 'react';
import {
  Search, Loader2, Edit2, X, Check, AlertCircle, Store,
  ShoppingBag, TrendingUp, Users, Activity, ShieldCheck,
  ExternalLink, RefreshCw, ImageIcon, CheckCircle2, XCircle
} from 'lucide-react';
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
  { label: 'Agent Dashboard', icon: <Activity className="w-5 h-5" />, href: '/agent-dashboard' },
  { label: 'Agent Shops', icon: <Store className="w-5 h-5" />, href: '/agent-shops' },
  { label: 'Agent Listings', icon: <ShoppingBag className="w-5 h-5" />, href: '/agent-listings' },
  { label: 'Agent Earnings', icon: <TrendingUp className="w-5 h-5" />, href: '/agent-earnings' },
  { label: 'Agent Analytics', icon: <Users className="w-5 h-5" />, href: '/agent-analytics' },
];

export default function AgentShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [form, setForm] = useState({ business_name: '', shop_description: '', logo_url: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadShops(); }, []);

  const loadShops = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get('/admin/shops', { params: { skip: 0, limit: 500 } });
      setShops(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load shops:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredShops = [...shops]
    .sort((a, b) => a.business_name.localeCompare(b.business_name))
    .filter(s => {
      const q = searchQuery.toLowerCase();
      return s.business_name?.toLowerCase().includes(q) ||
             s.full_name?.toLowerCase().includes(q) ||
             s.email?.toLowerCase().includes(q);
    });

  const openEdit = (shop: Shop) => {
    setEditingShop(shop);
    setForm({ business_name: shop.business_name || '', shop_description: shop.shop_description || '', logo_url: shop.logo_url || '' });
    setError(''); setSuccess('');
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('high_quality', 'true');
      const res = await api.post('/listings/upload', fd);
      setForm(f => ({ ...f, logo_url: res.data.url }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Image upload failed');
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!editingShop) return;
    if (!form.business_name.trim()) { setError('Shop name cannot be empty'); return; }
    setSaving(true); setError('');
    try {
      await api.patch(`/admin/shops/${editingShop.id}`, form);
      setSuccess('Shop updated successfully!');
      loadShops(true);
      setTimeout(() => { setEditingShop(null); setSuccess(''); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save changes');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <DashboardLayout title="Agent Shops" navItems={agentNavItems} userRole="agent">
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          <p className="text-sm font-semibold text-slate-400">Loading Shops Directory…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agent Shops" navItems={agentNavItems} userRole="agent">
      <div className="space-y-6 pb-12">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Shops Directory</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Browse and manage all registered seller shops</p>
          </div>
          <button
            onClick={() => loadShops(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#151D2A] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Shops', value: shops.length, color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600' },
            { label: 'Active Shops', value: shops.filter(s => s.is_active).length, color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' },
            { label: 'Inactive Shops', value: shops.filter(s => !s.is_active).length, color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-[#151D2A] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">{s.value}</h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${s.color}`}>Live Count</span>
            </div>
          ))}
        </div>

        {/* Search + Table */}
        <div className="bg-white dark:bg-[#151D2A] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by shop name, owner, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <span className="text-xs font-bold text-slate-400">{filteredShops.length} shops found</span>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Shop</th>
                  <th className="py-3.5 px-5">Owner</th>
                  <th className="py-3.5 px-5">Email</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {filteredShops.length > 0 ? filteredShops.map(shop => (
                  <tr key={shop.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {shop.logo_url ? (
                          <img src={shop.logo_url} alt={shop.business_name} className="w-9 h-9 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                            {shop.business_name?.charAt(0) || 'S'}
                          </div>
                        )}
                        <span className="font-bold text-slate-900 dark:text-white">{shop.business_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-600 dark:text-slate-300">{shop.full_name}</td>
                    <td className="py-4 px-5 text-slate-400">{shop.email}</td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${shop.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {shop.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button onClick={() => openEdit(shop)} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No shops found matching your search</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredShops.map(shop => (
              <div key={shop.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {shop.logo_url ? (
                    <img src={shop.logo_url} alt={shop.business_name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {shop.business_name?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{shop.business_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{shop.email}</p>
                  </div>
                </div>
                <button onClick={() => openEdit(shop)} className="p-2 rounded-xl bg-slate-50 text-slate-500 flex-shrink-0">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setEditingShop(null)}>
          <div className="bg-white dark:bg-[#151D2A] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Shop</h3>
              <button onClick={() => setEditingShop(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold"><AlertCircle className="w-4 h-4" />{error}</div>}
            {success && <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold"><CheckCircle2 className="w-4 h-4" />{success}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Shop Name</label>
                <input
                  value={form.business_name}
                  onChange={(e) => setForm(f => ({ ...f, business_name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  value={form.shop_description}
                  onChange={(e) => setForm(f => ({ ...f, shop_description: e.target.value }))}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Logo</label>
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="hidden" id="logo-upload" />
                <label htmlFor="logo-upload" className="flex items-center gap-2 cursor-pointer px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                  <ImageIcon className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload Logo Image'}
                </label>
                {form.logo_url && <img src={form.logo_url} className="w-16 h-16 rounded-xl mt-2 object-cover border" alt="Logo preview" />}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingShop(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
