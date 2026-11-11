"use client";

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, AlertTriangle, AlertCircle, CheckCircle2, RefreshCw,
  Search, Filter, Edit2, Check, X, Loader2, ArrowRight, TrendingUp, Plus, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';

type StockFilter = 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StockFilter>('All');
  
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingStock, setEditingStock] = useState<number | ''>('');
  const [updating, setUpdating] = useState<string | number | null>(null);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/listings/me?limit=100').catch(() => null);

      if (res?.data) {
        const products = Array.isArray(res.data) ? res.data : res.data.listings || res.data.items || [];
        setInventory(products);
        updateStats(products);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStats = (products: any[]) => {
    const totalItems = products.reduce((sum: number, p: any) => sum + (p.quantity ?? p.stock ?? 1), 0);
    const lowStockCount = products.filter((p: any) => {
      const q = p.quantity ?? p.stock ?? 1;
      return q > 0 && q <= 5;
    }).length;
    const outOfStockCount = products.filter((p: any) => (p.quantity ?? p.stock ?? 1) === 0).length;
    const inventoryValue = products.reduce((sum: number, p: any) => sum + ((p.price || 0) * (p.quantity ?? p.stock ?? 1)), 0);

    setStats({
      total_items: totalItems,
      low_stock: lowStockCount,
      out_of_stock: outOfStockCount,
      inventory_value: inventoryValue,
    });
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditingStock(item.quantity ?? item.stock ?? 0);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingStock('');
  };

  const handleSaveStock = async (itemId: string | number, currentStock: number) => {
    if (editingStock === '' || editingStock === currentStock) {
      handleCancelEdit();
      return;
    }

    const newQty = Math.max(0, parseInt(editingStock.toString(), 10) || 0);
    setUpdating(itemId);
    try {
      await api.patch(`/listings/${itemId}`, {
        quantity: newQty,
      }).catch(async () => {
        return api.put(`/listings/${itemId}`, { quantity: newQty });
      });

      const updated = inventory.map((item) =>
        item.id === itemId ? { ...item, quantity: newQty, stock: newQty } : item
      );
      setInventory(updated);
      updateStats(updated);
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    } finally {
      setUpdating(null);
    }
  };

  const filteredItems = inventory.filter((item) => {
    const title = (item.title_en || item.title || '').toLowerCase();
    const sku = (item.id || '').toString();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || title.includes(q) || sku.includes(q);

    const qty = item.quantity ?? item.stock ?? 1;
    if (!matchesSearch) return false;
    if (activeTab === 'In Stock') return qty > 5;
    if (activeTab === 'Low Stock') return qty > 0 && qty <= 5;
    if (activeTab === 'Out of Stock') return qty === 0;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading inventory levels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Inventory & Stock
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block mt-0.5">
            Monitor product levels, restock alerts, and total asset valuation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadInventoryData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-full bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-600 dark:text-neutral-200 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
          </button>

          <Link
            to="/seller-dashboard/products/add"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-full text-xs font-extrabold transition-all shadow-md shadow-sky-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock</span>
          </Link>
        </div>
      </div>

      {/* ── Compact 4-Metric Strip (Redesigned from tall stacked boxes) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3">
        <button
          onClick={() => setActiveTab('All')}
          className={`bg-white dark:bg-neutral-900/90 rounded-2xl p-3.5 border transition-all text-left ${
            activeTab === 'All'
              ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
              : 'border-slate-100 dark:border-neutral-800 hover:shadow-md'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Items
          </span>
          <p className="text-lg md:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {stats?.total_items || 0}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">In catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('Low Stock')}
          className={`bg-white dark:bg-neutral-900/90 rounded-2xl p-3.5 border transition-all text-left ${
            activeTab === 'Low Stock'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'border-slate-100 dark:border-neutral-800 hover:shadow-md'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Low Stock
          </span>
          <p className="text-lg md:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {stats?.low_stock || 0}
          </p>
          <span className="text-[10px] text-amber-500 font-medium">&le; 5 units left</span>
        </button>

        <button
          onClick={() => setActiveTab('Out of Stock')}
          className={`bg-white dark:bg-neutral-900/90 rounded-2xl p-3.5 border transition-all text-left ${
            activeTab === 'Out of Stock'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
              : 'border-slate-100 dark:border-neutral-800 hover:shadow-md'
          }`}
        >
          <span className="text-[10px] md:text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            Out of Stock
          </span>
          <p className="text-lg md:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
            {stats?.out_of_stock || 0}
          </p>
          <span className="text-[10px] text-rose-500 font-medium">Needs restocking</span>
        </button>

        <div className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3.5 border border-slate-100 dark:border-neutral-800 shadow-sm text-left">
          <span className="text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Inventory Value
          </span>
          <p className="text-base md:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
            KSh {Number(stats?.inventory_value || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600/70 font-medium">Total merchandise</span>
        </div>
      </div>

      {/* ── Search & Filter Tabs ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inventory by title or SKU..."
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

        {/* Filter Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-100 dark:border-neutral-800 px-2 overflow-x-auto no-scrollbar">
          {(['All', 'In Stock', 'Low Stock', 'Out of Stock'] as StockFilter[]).map((tab) => {
            const isTabActive = activeTab === tab;
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
                <span>{tab}</span>
                {isTabActive && (
                  <motion.div
                    layoutId="activeInventoryTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Inventory List Cards (Mobile & Desktop View) ── */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const title = item.title_en || item.title || 'Untitled Product';
            const img = item.images?.[0] || item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80';
            const qty = item.quantity ?? item.stock ?? 1;
            const price = item.price || 0;
            const isEditing = editingId === item.id;
            const isOutOfStock = qty === 0;
            const isLowStock = qty > 0 && qty <= 5;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3.5 md:p-4 border border-slate-100 dark:border-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Product Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={img}
                    alt={title}
                    className="w-14 h-14 rounded-2xl object-cover bg-slate-100 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-800 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                      {title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">SKU-{item.id?.toString().padStart(6, '0')}</span>
                      <span>•</span>
                      <span className="font-black text-slate-900 dark:text-white">KSh {price.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Value: <span className="font-bold text-slate-700 dark:text-neutral-300">KSh {(price * qty).toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                {/* Stock Controls & Status */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50 dark:border-neutral-800">
                  {/* Status Badge */}
                  <div>
                    {isOutOfStock && (
                      <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Out of Stock</span>
                      </span>
                    )}
                    {isLowStock && (
                      <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock</span>
                      </span>
                    )}
                    {!isOutOfStock && !isLowStock && (
                      <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>In Stock</span>
                      </span>
                    )}
                  </div>

                  {/* Stock Quantity Stepper / Editor */}
                  <div className="flex items-center gap-1.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingStock}
                          onChange={(e) => setEditingStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-16 px-2 py-1 rounded-xl border border-sky-500 bg-white dark:bg-neutral-800 text-xs font-bold text-slate-900 dark:text-white text-center outline-none"
                          min="0"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveStock(item.id, qty)}
                          disabled={updating === item.id}
                          className="p-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-white'
                        }`}>
                          {qty} units
                        </span>
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-sky-500 transition-colors"
                          title="Edit Stock Quantity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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
            {searchQuery ? 'No matching inventory items' : 'No products in this category'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {searchQuery ? 'Try clearing your search query.' : 'Add listings to your store to start tracking inventory.'}
          </p>
        </div>
      )}

    </div>
  );
}
