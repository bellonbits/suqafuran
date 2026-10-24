"use client";

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, SlidersHorizontal, Calendar, ChevronRight,
  MoreHorizontal, Loader2, Package, Tag, AlertTriangle, CheckCircle2,
  Edit2, Trash2, Copy, FileUp, Zap, Clock, Box, X, User as UserIcon, Check
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuth';
import api from '@/services/api';
import { dealsService, type ChatBuyer } from '@/services/deals';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All Status');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxProducts, setMaxProducts] = useState<number | null>(200);

  // Sold modal state
  const [soldModalProduct, setSoldModalProduct] = useState<any | null>(null);
  const [chatBuyers, setChatBuyers] = useState<ChatBuyer[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState<number | 'other' | null>(null);
  const [submittingSold, setSubmittingSold] = useState(false);
  const [soldError, setSoldError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/listings/me?limit=100').catch(() => null);
      if (res?.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.listings || res.data.items || [];
        setProducts(items);
      }
    } catch (err) {
      console.error('Error loading seller products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/listings/${id}`).catch(() => null);
      loadProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleOpenSoldModal = async (product: any) => {
    setSoldModalProduct(product);
    setSelectedBuyerId(null);
    setSoldError('');
    setLoadingBuyers(true);
    try {
      const buyers = await dealsService.getListingChatBuyers(product.id).catch(() => []);
      setChatBuyers(buyers || []);
      if (buyers && buyers.length > 0) {
        setSelectedBuyerId(buyers[0].id);
      } else {
        setSelectedBuyerId('other');
      }
    } catch (err) {
      console.error('Error fetching chat buyers:', err);
      setChatBuyers([]);
      setSelectedBuyerId('other');
    } finally {
      setLoadingBuyers(false);
    }
  };

  const handleConfirmSold = async () => {
    if (!soldModalProduct) return;
    setSubmittingSold(true);
    setSoldError('');
    try {
      if (selectedBuyerId && selectedBuyerId !== 'other') {
        await dealsService.sellerMarkSold(soldModalProduct.id, selectedBuyerId);
      } else {
        await api.patch(`/listings/${soldModalProduct.id}`, { is_sold: true, status: 'sold' });
      }
      setSoldModalProduct(null);
      loadProducts();
    } catch (err: any) {
      console.error('Failed to mark listing as sold:', err);
      setSoldError(err?.response?.data?.detail || 'Failed to mark as sold. Please try again.');
    } finally {
      setSubmittingSold(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const title = p.title_en || p.title || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const isSold = p.is_sold || p.status === 'sold';
    const matchesStatus = statusFilter === 'All Status' ||
                          (statusFilter === 'Published' && p.status === 'active' && !isSold) ||
                          (statusFilter === 'Pending' && p.status === 'pending') ||
                          (statusFilter === 'Sold' && isSold);
    return matchesSearch && matchesStatus;
  });

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active' && !p.is_sold && p.status !== 'sold').length;
  const pendingProducts = products.filter(p => p.status === 'pending').length;
  const soldProducts = products.filter(p => p.is_sold || p.status === 'sold').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading Products List...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Action CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Products List
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage your listings, chat deals, and mark items as sold
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller-dashboard/products/bulk-import"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800 text-slate-700 dark:text-neutral-100 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileUp className="w-4 h-4 text-sky-500" />
            <span>Bulk Import</span>
          </Link>

          <Link
            to="/seller-dashboard/products/add"
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Products Stat Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-950 rounded-3xl p-5 border border-slate-100 dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalProducts.toLocaleString()}
            </h2>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full">
              Total
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">All store listings</p>
        </div>

        <div className="bg-white dark:bg-neutral-950 rounded-3xl p-5 border border-slate-100 dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published Active</p>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeProducts.toLocaleString()}
            </h2>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Visible to customers</p>
        </div>

        <div className="bg-white dark:bg-neutral-950 rounded-3xl p-5 border border-slate-100 dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sold Deals</p>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {soldProducts.toLocaleString()}
            </h2>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
              Sold
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Completed offline deals</p>
        </div>

        <div className="bg-white dark:bg-neutral-950 rounded-3xl p-5 border border-slate-100 dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</p>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {pendingProducts.toLocaleString()}
            </h2>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
              Pending
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Awaiting moderation</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-neutral-950 rounded-3xl p-4 border border-slate-100 dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title, SKU or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/50 rounded-2xl pl-10 pr-12 py-2.5 text-xs md:text-sm text-slate-800 dark:text-neutral-50 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/50 text-slate-700 dark:text-neutral-100 text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          >
            <option value="All Status">All Status</option>
            <option value="Published">Published</option>
            <option value="Pending">Pending</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white dark:bg-neutral-950 rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {filteredProducts.length > 0 ? (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/60 dark:bg-neutral-900/40 border-b border-slate-100 dark:border-neutral-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Product Info</th>
                    <th className="py-3.5 px-5">SKU / Code</th>
                    <th className="py-3.5 px-5">Price (KSh)</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/40">
                  {filteredProducts.map((p) => {
                    const title = p.title_en || p.title || 'Untitled Product';
                    const image = p.images?.[0] || p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80';
                    const isSold = p.is_sold || p.status === 'sold';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <img src={image} alt={title} className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-neutral-800 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white leading-tight">{title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{p.location || 'Nairobi, Kenya'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 font-mono font-extrabold text-slate-700 dark:text-neutral-200">
                          SKU-{p.id?.toString().padStart(6, '0')}
                        </td>

                        <td className="py-4 px-5 font-black text-slate-900 dark:text-white">
                          Ksh {(p.price || 0).toLocaleString()}
                        </td>

                        <td className="py-4 px-5">
                          {isSold ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Sold
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                              p.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {p.status === 'active' ? 'Published' : 'Pending'}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isSold && (
                              <button
                                onClick={() => handleOpenSoldModal(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors font-bold text-[11px]"
                                title="Mark item as sold"
                              >
                                Mark Sold
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/seller-dashboard/products/edit/${p.id}`)}
                              className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-900 text-slate-600 dark:text-neutral-200 hover:bg-slate-100 transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-100 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-neutral-800">
              {filteredProducts.map((p) => {
                const title = p.title_en || p.title || 'Untitled Product';
                const image = p.images?.[0] || p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80';
                const isSold = p.is_sold || p.status === 'sold';

                return (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <img src={image} alt={title} className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-neutral-800 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{title}</p>
                        <p className="text-[10px] text-slate-400">SKU-{p.id?.toString().padStart(6, '0')}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white mt-1">Ksh {(p.price || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-neutral-800">
                      {isSold ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          Sold
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          • {p.status === 'active' ? 'Published' : 'Pending'}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        {!isSold && (
                          <button
                            onClick={() => handleOpenSoldModal(p)}
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold"
                          >
                            Mark Sold
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/seller-dashboard/products/edit/${p.id}`)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-100 rounded-xl text-xs font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Box className="w-12 h-12 text-slate-200 dark:text-neutral-200" />
            <p className="text-base font-extrabold text-slate-700 dark:text-neutral-100">No Products Found</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Click "+ Add Product" to publish your first listing on Suqafuran Marketplace.
            </p>
          </div>
        )}
      </div>

      {/* Mark As Sold Modal */}
      {soldModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-neutral-950 rounded-t-3xl md:rounded-3xl w-full md:max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mark as Sold</h2>
              <button
                onClick={() => setSoldModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-900 p-3 rounded-2xl">
              <img
                src={soldModalProduct.images?.[0] || soldModalProduct.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                alt=""
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {soldModalProduct.title_en || soldModalProduct.title}
                </p>
                <p className="text-xs text-slate-400">
                  Ksh {(soldModalProduct.price || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">
                Who bought this item?
              </label>
              <p className="text-xs text-slate-400 mb-3">
                Selecting a chat buyer will prompt them to confirm the purchase, boosting trust scores and recording a verified deal.
              </p>

              {loadingBuyers ? (
                <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading buyers who chatted on this item...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {chatBuyers.map((b) => (
                    <label
                      key={b.id}
                      onClick={() => setSelectedBuyerId(b.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedBuyerId === b.id
                          ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 text-sky-900 dark:text-sky-100'
                          : 'border-slate-200/80 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold">
                          {b.full_name?.charAt(0).toUpperCase() || 'B'}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">{b.full_name}</p>
                          <p className="text-[10px] text-slate-400">Chatted on this listing</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="sold_buyer"
                        checked={selectedBuyerId === b.id}
                        onChange={() => setSelectedBuyerId(b.id)}
                        className="text-sky-500 focus:ring-sky-500"
                      />
                    </label>
                  ))}

                  <label
                    onClick={() => setSelectedBuyerId('other')}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedBuyerId === 'other'
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 text-sky-900 dark:text-sky-100'
                        : 'border-slate-200/80 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center text-xs text-slate-400 font-bold">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">Outside buyer / Other</p>
                        <p className="text-[10px] text-slate-400">Sold offline or to an unlisted contact</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="sold_buyer"
                      checked={selectedBuyerId === 'other'}
                      onChange={() => setSelectedBuyerId('other')}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                  </label>
                </div>
              )}
            </div>

            {soldError && (
              <p className="text-xs text-rose-500 font-semibold">{soldError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSoldModalProduct(null)}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 font-bold text-xs hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSold}
                disabled={submittingSold || loadingBuyers}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20"
              >
                {submittingSold ? 'Updating...' : 'Confirm Sold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
