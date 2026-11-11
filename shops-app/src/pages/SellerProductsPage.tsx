"use client";

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Calendar, ChevronRight,
  MoreVertical, Loader2, Package, Tag, AlertTriangle, CheckCircle2,
  Edit2, Trash2, Copy, FileUp, Zap, Clock, Box, X, Check, Eye
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuth';
import api from '@/services/api';
import { dealsService, type ChatBuyer } from '@/services/deals';

type TabType = 'All' | 'Published' | 'Pending' | 'Sold';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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

  // Close 3-dots popup on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
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
    setOpenMenuId(null);
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

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active' && !p.is_sold && p.status !== 'sold').length;
  const pendingProducts = products.filter(p => p.status === 'pending').length;
  const soldProducts = products.filter(p => p.is_sold || p.status === 'sold').length;

  const filteredProducts = products.filter(p => {
    const title = (p.title_en || p.title || '').toLowerCase();
    const cat = (p.category?.name || p.category_name || '').toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || cat.includes(searchQuery.toLowerCase());
    const isSold = p.is_sold || p.status === 'sold';
    const isPublished = p.status === 'active' && !isSold;
    const isPending = p.status === 'pending';

    if (!matchesSearch) return false;
    if (activeTab === 'Published') return isPublished;
    if (activeTab === 'Pending') return isPending;
    if (activeTab === 'Sold') return isSold;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading your products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Top Header matching Demo Screen 2 ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Products
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block mt-0.5">
            Manage, publish, and mark items as sold
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/seller-dashboard/products/bulk-import"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileUp className="w-3.5 h-3.5 text-sky-500" />
            <span>Bulk Import</span>
          </Link>

          <Link
            to="/seller-dashboard/products/add"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-full text-xs font-extrabold transition-all shadow-md shadow-sky-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ── Compact 4-Stat Strip (Clean, modern horizontal row) ── */}
      <div className="grid grid-cols-4 gap-2 md:gap-4 bg-slate-50/80 dark:bg-neutral-900/60 p-2.5 md:p-3 rounded-2xl border border-slate-100 dark:border-neutral-800/80">
        <button
          onClick={() => setActiveTab('All')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'All' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
          <span className="text-base md:text-xl font-black text-slate-900 dark:text-white">{totalProducts}</span>
        </button>

        <button
          onClick={() => setActiveTab('Published')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'Published' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active</span>
          <span className="text-base md:text-xl font-black text-emerald-600 dark:text-emerald-400">{activeProducts}</span>
        </button>

        <button
          onClick={() => setActiveTab('Sold')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'Sold' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Sold</span>
          <span className="text-base md:text-xl font-black text-indigo-600 dark:text-indigo-400">{soldProducts}</span>
        </button>

        <button
          onClick={() => setActiveTab('Pending')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'Pending' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</span>
          <span className="text-base md:text-xl font-black text-amber-600 dark:text-amber-400">{pendingProducts}</span>
        </button>
      </div>

      {/* ── Search Bar & Filter Tabs ── */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Navigation Tabs (matching Screen 2: All | Published | Draft) */}
        <div className="flex items-center gap-6 border-b border-slate-100 dark:border-neutral-800 px-2 overflow-x-auto no-scrollbar">
          {(['All', 'Published', 'Pending', 'Sold'] as TabType[]).map((tab) => {
            const isTabActive = activeTab === tab;
            const count =
              tab === 'All' ? totalProducts :
              tab === 'Published' ? activeProducts :
              tab === 'Pending' ? pendingProducts : soldProducts;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${
                  isTabActive
                    ? 'text-sky-600 dark:text-sky-400 font-extrabold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200'
                }`}
              >
                <span>{tab === 'Pending' ? 'Draft / Pending' : tab}</span>
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  isTabActive
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-black'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-400'
                }`}>
                  {count}
                </span>

                {isTabActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Products List View (Screen 2 Sleek Item Cards) ── */}
      {filteredProducts.length > 0 ? (
        <div className="space-y-3">
          {filteredProducts.map((p) => {
            const title = p.title_en || p.title || 'Untitled Product';
            const image = p.images?.[0] || p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80';
            const isSold = p.is_sold || p.status === 'sold';
            const isPending = p.status === 'pending';
            const isPublished = p.status === 'active' && !isSold;
            const dateStr = p.created_at
              ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recently added';

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3 md:p-4 border border-slate-100 dark:border-neutral-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex items-center justify-between gap-3 relative group"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-800">
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {isSold && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-[9px] font-black uppercase text-white bg-indigo-600/90 px-1.5 py-0.5 rounded">
                          Sold
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                      {title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="truncate">{p.category?.name || p.category_name || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white">
                        KSh {(p.price || 0).toLocaleString()}
                      </span>
                      {p.original_price && p.original_price > p.price && (
                        <span className="text-[10px] text-slate-400 line-through">
                          KSh {p.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & Ellipsis Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Status Pill matching Demo Screen 2 */}
                  {isPublished && (
                    <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                      Published
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                  {isSold && (
                    <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
                      Sold
                    </span>
                  )}

                  {/* 3-dots Menu Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === p.id ? null : p.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                      aria-label="Actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Popup */}
                    <AnimatePresence>
                      {openMenuId === p.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.12 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-slate-100 dark:border-neutral-800 py-1.5 z-30 overflow-hidden text-xs"
                        >
                          {!isSold && (
                            <button
                              onClick={() => handleOpenSoldModal(p)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-left font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark as Sold</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/seller-dashboard/products/edit/${p.id}`);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Listing</span>
                          </button>

                          <a
                            href={`/listing/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View on Store</span>
                          </a>

                          <div className="h-px bg-slate-100 dark:bg-neutral-800 my-1" />

                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleDelete(p.id);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900/60 rounded-3xl border border-slate-100 dark:border-neutral-800 p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
            {searchQuery ? 'No products match your search' : 'No products in this tab'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {searchQuery ? 'Try clearing your search query.' : 'Add your listings to start selling on Suqafuran.'}
          </p>
          <Link
            to="/seller-dashboard/products/add"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-full text-xs font-bold shadow-md shadow-sky-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </Link>
        </div>
      )}

      {/* ── Mark As Sold Modal ── */}
      {soldModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Mark as Sold</h2>
              <button
                onClick={() => setSoldModalProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl">
              <img
                src={soldModalProduct.images?.[0] || soldModalProduct.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                alt={soldModalProduct.title}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {soldModalProduct.title_en || soldModalProduct.title}
                </p>
                <p className="font-extrabold text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                  KSh {(soldModalProduct.price || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-2">
                Who purchased this item?
              </label>

              {loadingBuyers ? (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                  <span>Loading recent chat buyers...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {chatBuyers.map((buyer) => (
                    <button
                      key={buyer.id}
                      type="button"
                      onClick={() => setSelectedBuyerId(buyer.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-colors ${
                        selectedBuyerId === buyer.id
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold'
                          : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800/50 text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-600 font-bold flex items-center justify-center text-[10px]">
                          {buyer.full_name?.charAt(0) || 'B'}
                        </div>
                        <div>
                          <p className="font-bold leading-tight">{buyer.full_name || `Buyer #${buyer.id}`}</p>
                          <p className="text-[10px] text-slate-400">Recent customer</p>
                        </div>
                      </div>
                      {selectedBuyerId === buyer.id && <Check className="w-4 h-4 text-sky-600" />}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setSelectedBuyerId('other')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-colors ${
                      selectedBuyerId === 'other'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold'
                        : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800/50 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>Sold to someone else (Walk-in / External)</span>
                    {selectedBuyerId === 'other' && <Check className="w-4 h-4 text-sky-600" />}
                  </button>
                </div>
              )}
            </div>

            {soldError && (
              <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl">
                {soldError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setSoldModalProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSold}
                disabled={submittingSold}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                {submittingSold ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Confirm Sold</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
