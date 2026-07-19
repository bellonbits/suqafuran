"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Copy, Loader } from 'lucide-react';
import api from '@/services/api';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/api/v1/listings/me?limit=100');
      if (res.data) {
        setProducts(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-500 text-sm">Loading products...</p>
        </div>
      </div>
    );
  }

  const activeCount = products.filter(p => p.status === 'active').length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Products</h1>
          <p className="text-gray-600 dark:text-slate-400">Manage your product listings</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Active Products</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Out of Stock</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{outOfStockCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Views</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSales}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          />
        </div>
        <button className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Product</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Price</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Stock</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Views</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Sales</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">No products yet</td>
                </tr>
              ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{product.title || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{product.id?.substring(0, 8) || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">KSh {(product.price || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      (product.stock || 0) > 20
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : (product.stock || 0) > 0
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {product.stock || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{product.views || 0}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{product.sales || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      product.status === 'active'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {product.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded">
                        <Edit2 className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded">
                        <Copy className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded">
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
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
}
