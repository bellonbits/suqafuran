"use client";
// Based on old Vite app's AdminCategoriesPage pattern
// Single API call fetches full hierarchy: Category → Subcategory → SubSubcategory
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader, ArrowLeft, ChevronDown, ChevronUp, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '@/services/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  somali_name?: string;
  lucide_icon?: string;
  subcategories?: any[];
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [modalState, setModalState] = useState<{
    type: 'category' | 'subcategory' | 'subsubcategory' | null;
    action: 'add' | 'edit';
    data?: any;
    parentId?: number;
  }>({ type: null, action: 'add' });
  const [editForm, setEditForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'en' | 'so'>('en');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Single API call returns full hierarchy: Category → Subcategory → SubSubcategory
      const res = await api.get('/listings/categories');
      if (res?.data) {
        const cats = Array.isArray(res.data) ? res.data : [];
        console.log(`Loaded ${cats.length} categories with full hierarchy`);
        setCategories(cats);
        // Expand all by default
        setExpandedIds(cats.map(c => c.id));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const openModal = (type: 'category' | 'subcategory' | 'subsubcategory', action: 'add' | 'edit', data?: any, parentId?: number) => {
    setModalState({ type, action, data, parentId });
    setActiveTab('en');
    if (action === 'edit' && data) {
      setEditForm({
        name_en: data.name_en || data.name || '',
        name_so: data.name_so || '',
        slug: data.slug || '',
        image_url: data.image_url || '',
        lucide_icon: data.lucide_icon || 'Folder'
      });
    } else {
      setEditForm({
        name_en: '',
        name_so: '',
        slug: '',
        image_url: '',
        lucide_icon: 'Folder'
      });
    }
  };

  const closeModal = () => {
    setModalState({ type: null, action: 'add' });
    setEditForm({});
  };

  const getCategoryImage = (cat: any) => {
    if (cat.image_url) {
      return cat.image_url;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Platform Categories</h1>
              <p className="text-gray-500 mt-1">Manage listing structure and visual branding.</p>
            </div>
          </div>
          <button
            onClick={() => openModal('category', 'add')}
            className="flex items-center gap-2 bg-blue-500 hover:bg-[#5bc0e8] text-white font-bold py-3 px-6 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Root Category
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
            No categories found
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div
                  onClick={() => toggleExpand(cat.id)}
                  className="w-full p-6 hover:bg-gray-50 transition-colors flex items-start justify-between text-left cursor-pointer"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl flex-shrink-0 mt-1">
                      {getCategoryImage(cat) ? (
                        <img src={getCategoryImage(cat)} alt="" className="w-12 h-12 rounded object-cover" />
                      ) : (
                        ''
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {cat.name}
                        {cat.somali_name && (
                          <span className="text-gray-500 ml-2 text-sm">({cat.somali_name})</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{cat.slug}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        • {cat.subcategories?.length || 0} Subcategories
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal('subcategory', 'add', undefined, cat.id); }}
                      className="text-[#6cd4ff] hover:text-[#5bc0e8] font-semibold text-sm"
                    >
                      + Add Sub
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal('category', 'edit', cat); }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                    {expandedIds.includes(cat.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Subcategories & SubSubcategories (Types) */}
                {expandedIds.includes(cat.id) && cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="space-y-4">
                      {cat.subcategories.map((sub: any) => (
                        <div key={sub.id} className="space-y-2">
                          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                                {sub.image_url ? (
                                  <img src={sub.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg"></span>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{sub.name || sub.name_en}</p>
                                <p className="text-xs text-gray-500">{sub.slug}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => openModal('subsubcategory', 'add', undefined, sub.id)}
                                className="text-[#6cd4ff] hover:text-[#5bc0e8] text-sm font-semibold whitespace-nowrap"
                              >
                                + Add Type
                              </button>
                              <button
                                onClick={() => openModal('subcategory', 'edit', sub)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>

                          {/* SubSubcategories (Types) */}
                          {sub.subsubcategories && sub.subsubcategories.length > 0 && (
                            <div className="pl-8 md:pl-12 flex flex-wrap gap-2">
                              {sub.subsubcategories.map((ss: any) => (
                                <div
                                  key={ss.id}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-white transition-all"
                                >
                                  <span>{ss.name || ss.name_en}</span>
                                  <div className="flex items-center gap-1 ml-1">
                                    <button
                                      onClick={() => openModal('subsubcategory', 'edit', ss)}
                                      className="text-gray-400 hover:text-[#6cd4ff] p-0.5 hover:bg-blue-50 rounded"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button className="text-gray-400 hover:text-red-500 p-0.5 hover:bg-red-50 rounded">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Universal Modal for all levels */}
      {modalState.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalState.action === 'edit' ? `Edit ${modalState.type}` : `Add ${modalState.type}`}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Language Tabs */}
              <div className="flex gap-4 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('en')}
                  className={`pb-3 font-semibold transition-colors ${
                    activeTab === 'en' ? 'text-[#6cd4ff] border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setActiveTab('so')}
                  className={`pb-3 font-semibold transition-colors ${
                    activeTab === 'so' ? 'text-[#6cd4ff] border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Somali (Soomaali)
                </button>
              </div>

              {/* Category Image */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Category Image</h3>
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden">
                    {editForm.image_url ? (
                      <img src={editForm.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl"></span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="block w-full border-2 border-dashed border-blue-400 rounded-lg py-4 text-center hover:bg-blue-50 cursor-pointer font-semibold text-[#6cd4ff]">
                      ⬆️ Upload image file
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                    <p className="text-sm text-gray-500 text-center">or paste URL</p>
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={editForm.image_url}
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  DISPLAY NAME ({activeTab === 'en' ? 'EN' : 'SO'})
                </label>
                <input
                  type="text"
                  value={activeTab === 'en' ? editForm.name_en : editForm.name_so}
                  onChange={(e) => {
                    if (activeTab === 'en') {
                      setEditForm({ ...editForm, name_en: e.target.value });
                    } else {
                      setEditForm({ ...editForm, name_so: e.target.value });
                    }
                  }}
                  placeholder={activeTab === 'en' ? 'e.g. Mobile Phones' : 'e.g. Taleefannada Gacanta'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>

              {/* Slug and Icon (only for categories) */}
              <div className={`grid ${modalState.type === 'category' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SLUG (URL ID)</label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="e.g. mobile-phones"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                {modalState.type === 'category' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">LUCIDE ICON</label>
                    <input
                      type="text"
                      placeholder="e.g. Smartphone"
                      value={editForm.lucide_icon}
                      onChange={(e) => setEditForm({ ...editForm, lucide_icon: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900"
                    />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-lg font-bold text-gray-900 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-6 py-3 bg-blue-500 hover:bg-[#5bc0e8] text-white rounded-lg font-bold flex items-center justify-center gap-2">
                  ✓ {modalState.action === 'edit' ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
