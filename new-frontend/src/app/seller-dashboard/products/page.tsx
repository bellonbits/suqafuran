"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Copy, Loader, CheckCircle, Zap, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuth';

const truncateId = (id: any, length: number = 8): string => {
  if (!id) return 'N/A';
  try {
    const idStr = typeof id === 'string' ? id : String(id);
    return idStr.substring(0, length);
  } catch {
    return 'N/A';
  }
};

export default function ProductsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [maxProducts, setMaxProducts] = useState<number | null>(200); // null = unlimited
  const [planName, setPlanName] = useState<string>('free');

  useEffect(() => {
    loadProducts();
    if (user) {
      api.get(`/subscriptions/sellers/${user.id}/features`)
        .then((res) => {
          setMaxProducts(res.data?.max_products ?? 200);
          setPlanName(res.data?.plan_name ?? 'free');
        })
        .catch(() => {});
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      console.log('[DEBUG] Loading products from /listings/me');
      const res = await api.get('/listings/me?limit=100');
      console.log('[DEBUG] API Response:', res);
      console.log('[DEBUG] Response data:', res.data);
      
      if (res.data) {
        const productsArray = Array.isArray(res.data) ? res.data : res.data.listings || res.data.items || [];
        console.log('[DEBUG] Parsed products array:', productsArray);
        console.log('[DEBUG] Product count:', productsArray.length);
        setProducts(productsArray);
      } else {
        console.warn('[DEBUG] No data in response');
        setProducts([]);
      }
    } catch (error) {
      console.error('[ERROR] Loading products failed:', error);
      if (error instanceof Error) {
        console.error('[ERROR] Error message:', error.message);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setDeleting(productId);
    try {
      await api.delete(`/listings/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = async (product: any) => {
    setCopying(product.id);
    try {
      const newProduct = {
        ...product,
        title: `${product.title} (Copy)`,
      };
      delete newProduct.id;
      delete newProduct.created_at;
      delete newProduct.updated_at;
      delete newProduct.views;
      delete newProduct.sales;

      await api.post('/listings', newProduct);
      alert('Product copied successfully!');
      loadProducts();
    } catch (error) {
      console.error('Error copying product:', error);
      alert('Failed to copy product');
    } finally {
      setCopying(null);
    }
  };

  const handleEdit = (product: any) => {
    window.location.href = `/listings/${product.id}/edit`;
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

  const filteredProducts = products.filter(p => {
    const title = (p.title_en || p.title || '').toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });
  
  console.log('[DEBUG] Filtered products count:', filteredProducts.length);

  const productCount = products.length;
  const limitPct = maxProducts !== null ? Math.min(100, Math.round((productCount / maxProducts) * 100)) : 0;
  const nearLimit = maxProducts !== null && limitPct >= 90 && limitPct < 100;
  const atLimit = maxProducts !== null && productCount >= maxProducts;

  return (
    <div className="space-y-6">
      {/* Product limit banner */}
      {atLimit && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl">
          <Zap className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex-1">
            You've reached your product limit ({maxProducts} products). Upgrade to Business to add more.
          </p>
          <Link
            href="/seller-dashboard/subscription"
            className="flex-shrink-0 text-xs font-bold px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Upgrade Now
          </Link>
        </div>
      )}
      {nearLimit && !atLimit && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You're at <strong>{limitPct}%</strong> of your product limit ({productCount} / {maxProducts}). Consider upgrading soon.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Products</h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-600 dark:text-slate-400">Manage your product listings</p>
            {maxProducts !== null && (
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                {productCount} / {maxProducts}
              </span>
            )}
          </div>
          {maxProducts !== null && (
            <div className="mt-2 h-1.5 w-48 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  limitPct >= 100 ? 'bg-red-500' : limitPct >= 90 ? 'bg-amber-500' : 'bg-orange-500'
                }`}
                style={{ width: `${limitPct}%` }}
              />
            </div>
          )}
        </div>
        <a
          href="/sell"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors text-center"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </a>
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
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {searchQuery ? 'No products match your search' : 'No products yet'}
                  </td>
                </tr>
              ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{product.title_en || product.title || product.name || 'Untitled Product'}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{truncateId(product.id)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">KSh {(product.price || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      (product.quantity || 0) > 20
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : (product.quantity || 0) > 0
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {product.quantity || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{product.views || 0}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{product.sales || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      (product.is_active === true || product.status === 'active')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {(product.is_active === true || product.status === 'active') ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleCopy(product)}
                        disabled={copying === product.id}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded disabled:opacity-50"
                        title="Duplicate product"
                      >
                        {copying === product.id ? (
                          <Loader className="w-4 h-4 animate-spin text-gray-600 dark:text-slate-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded disabled:opacity-50"
                        title="Delete product"
                      >
                        {deleting === product.id ? (
                          <Loader className="w-4 h-4 animate-spin text-red-600 dark:text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
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
