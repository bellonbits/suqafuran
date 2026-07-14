"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Search, Filter, Plus, MoreVertical, ArrowLeft, Edit, Trash2, X, Loader } from 'lucide-react';
import api from '@/services/api';

export default function SellerProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title_en: '',
    price: '',
    stock: '',
    status: 'pending',
  });
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/listings/me');
      if (res.data && Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      title_en: product.title_en || '',
      price: product.price?.toString() || '',
      stock: product.attributes?.stock?.toString() || '',
      status: product.status || 'pending',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      await api.patch(`/listings/${editingId}`, {
        title_en: formData.title_en,
        price: parseFloat(formData.price),
        attributes: {
          stock: formData.stock ? parseInt(formData.stock) : null,
        },
        status: formData.status,
      });

      setShowModal(false);
      setEditingId(null);
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/listings/${id}`);
      setDeleteConfirm(null);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter(p =>
    (p.title_en || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6 justify-between">
          <div className="flex items-center gap-4">
            <Link href="/seller-dashboard" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <h1 className="text-3xl font-black text-white">My Products ({products.length})</h1>
          </div>
          <Link href="/sell">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg flex items-center gap-2 transition-colors font-bold"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </motion.button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#6cd4ff]"
            />
          </div>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors">
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No products yet</p>
            <p className="text-slate-400 text-sm">Add your first product to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-sky-600 transition-colors"
              >
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.title_en} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-slate-500" />
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white truncate">{product.title_en || 'Untitled'}</h3>
                  <p className="text-sm text-slate-400 mt-1">{product.category_id ? 'Category' : '—'}</p>

                  {/* Price & Stock */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                    <div>
                      <p className="text-xs text-slate-400">Price</p>
                      <p className="text-xl font-black text-green-400">Ksh {product.price?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Stock</p>
                      <p className={`text-xl font-black ${(product.attributes?.stock || 0) > 0 ? 'text-[#6cd4ff]' : 'text-red-400'}`}>
                        {product.attributes?.stock || 0}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      product.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                      {product.status === 'active' ? 'Active' : product.status?.toUpperCase() || 'Inactive'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Link href={`/seller-products/${product.id}/edit`} className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="w-full px-3 py-2 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </motion.button>
                    </Link>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setDeleteConfirm(product.id)}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Edit Product</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Product Name</label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-[#6cd4ff]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Price (Ksh)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-[#6cd4ff]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-[#6cd4ff]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Product Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-[#6cd4ff]"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg font-bold transition-colors"
              >
                Save Changes
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-lg p-6 max-w-sm w-full border border-slate-700"
          >
            <h2 className="text-lg font-black text-white mb-4">Delete Product?</h2>
            <p className="text-slate-300 mb-6">This action cannot be undone.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
