import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Filter, Edit2, Trash2, Copy, Archive, Eye,
  Package, ChevronDown, ChevronUp, X, Upload, Tag, AlertCircle,
  Check, Loader2, MoreVertical, BarChart2, Heart, ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sellerDashboardService, fmtKSh } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageUtils';

type ProductStatus = 'all' | 'active' | 'draft' | 'archived' | 'out_of_stock';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  draft: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  archived: { label: 'Archived', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  out_of_stock: { label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  inactive: { label: 'Inactive', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
};

const CONDITIONS = ['new', 'used', 'refurbished'];

interface ProductFormData {
  title_en: string;
  description_en: string;
  price: string;
  discount_price: string;
  stock_quantity: string;
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  condition: string;
  weight: string;
  dimensions: string;
  images: string[];
  variants: VariantGroup[];
}

interface VariantGroup {
  type: 'color' | 'size' | 'material' | 'capacity' | 'model';
  values: string[];
}

const EMPTY_FORM: ProductFormData = {
  title_en: '', description_en: '', price: '', discount_price: '',
  stock_quantity: '', category: '', subcategory: '', brand: '', sku: '',
  condition: 'new', weight: '', dimensions: '', images: [], variants: []
};

const VARIANT_TYPES = ['color', 'size', 'material', 'capacity', 'model'] as const;

export const SellerProductsPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedAnalytics, setExpandedAnalytics] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newVariantType, setNewVariantType] = useState<typeof VARIANT_TYPES[number]>('color');
  const [newVariantValue, setNewVariantValue] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: () => sellerDashboardService.getMyListings({ limit: 200 }),
    staleTime: 60_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: sellerDashboardService.getCategories,
    staleTime: 10 * 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: sellerDashboardService.deleteListing,
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries({ queryKey: ['seller-listings'] }); },
    onError: () => toast.error('Failed to delete'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => sellerDashboardService.patchListing(id, data),
    onSuccess: () => { toast.success('Product updated'); qc.invalidateQueries({ queryKey: ['seller-listings'] }); },
    onError: () => toast.error('Failed to update'),
  });

  // Filter
  const filtered = listings.filter((l: any) => {
    const matchesSearch = !search || (l.title_en || '').toLowerCase().includes(search.toLowerCase()) || (l.sku || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    const st = (l.status || (l.is_active ? 'active' : 'inactive')).toLowerCase();
    if (statusFilter === 'out_of_stock') return (l.stock_quantity ?? l.stock_level ?? 1) === 0;
    return st === statusFilter;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const openAdd = () => { setEditingProduct(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (p: any) => {
    setEditingProduct(p);
    setForm({
      title_en: p.title_en || '',
      description_en: p.description_en || '',
      price: String(p.price || ''),
      discount_price: String(p.discount_price || ''),
      stock_quantity: String(p.stock_quantity ?? p.stock_level ?? ''),
      category: p.category || '',
      subcategory: p.subcategory || '',
      brand: p.brand || '',
      sku: p.sku || '',
      condition: p.condition || 'new',
      weight: String(p.weight || ''),
      dimensions: p.dimensions || '',
      images: p.images || [],
      variants: p.variants || [],
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title_en.trim()) { toast.error('Product name required'); return; }
    if (!form.price) { toast.error('Price required'); return; }
    try {
      const payload = {
        title_en: form.title_en,
        description_en: form.description_en,
        price: parseFloat(form.price),
        discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
        stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : null,
        category: form.category,
        subcategory: form.subcategory,
        brand: form.brand,
        sku: form.sku,
        condition: form.condition,
        weight: form.weight ? parseFloat(form.weight) : null,
        dimensions: form.dimensions,
        images: form.images,
        variants: form.variants,
        currency: 'KES',
      };
      if (editingProduct) {
        await sellerDashboardService.updateListing(editingProduct.id, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/listings/', payload);
        toast.success('Product created!');
      }
      qc.invalidateQueries({ queryKey: ['seller-listings'] });
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await sellerDashboardService.uploadMultipleImages(files);
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`${urls.length} image(s) uploaded`);
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  };

  const addVariantValue = () => {
    if (!newVariantValue.trim()) return;
    setForm(f => {
      const existing = f.variants.find(v => v.type === newVariantType);
      if (existing) {
        return { ...f, variants: f.variants.map(v => v.type === newVariantType ? { ...v, values: [...v.values, newVariantValue.trim()] } : v) };
      }
      return { ...f, variants: [...f.variants, { type: newVariantType, values: [newVariantValue.trim()] }] };
    });
    setNewVariantValue('');
  };

  const removeVariantValue = (type: string, val: string) => {
    setForm(f => ({
      ...f,
      variants: f.variants.map(v => v.type === type ? { ...v, values: v.values.filter(vv => vv !== val) } : v).filter(v => v.values.length > 0)
    }));
  };

  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map((l: any) => l.id));

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} product(s)?`)) return;
    await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
    setSelectedIds([]);
  };

  const duplicateProduct = (p: any) => {
    setEditingProduct(null);
    setForm({
      title_en: `${p.title_en || ''} (Copy)`,
      description_en: p.description_en || '',
      price: String(p.price || ''),
      discount_price: String(p.discount_price || ''),
      stock_quantity: String(p.stock_quantity ?? p.stock_level ?? ''),
      category: p.category || '',
      subcategory: p.subcategory || '',
      brand: p.brand || '',
      sku: '',
      condition: p.condition || 'new',
      weight: String(p.weight || ''),
      dimensions: p.dimensions || '',
      images: [...(p.images || [])],
      variants: [...(p.variants || [])],
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">{filtered.length} products {statusFilter !== 'all' ? `(${statusFilter})` : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'active', 'draft', 'out_of_stock', 'archived'] as ProductStatus[]).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'flex-shrink-0 px-3 py-2 text-xs font-bold rounded-xl transition-all capitalize',
                statusFilter === s ? 'bg-sky-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl mb-4">
          <span className="text-sm font-bold text-sky-700">{selectedIds.length} selected</span>
          <button onClick={bulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={() => setSelectedIds([])} className="ml-auto p-1.5 text-sky-500 hover:text-sky-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <Package className="w-14 h-14 text-slate-200 mb-4" />
          <h3 className="text-base font-bold text-slate-700">No products found</h3>
          <p className="text-sm text-slate-400 mt-1">{search ? 'Try a different search' : 'Add your first product to get started'}</p>
          <button onClick={openAdd} className="mt-4 flex items-center gap-2 px-5 py-2 bg-sky-500 text-white text-sm font-bold rounded-xl hover:bg-sky-600 transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={selectedIds.length === paginated.length && paginated.length > 0} onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide hidden md:table-cell">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Analytics</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((p: any) => {
                  const statusKey = p.stock_quantity === 0 || p.stock_level === 0 ? 'out_of_stock' : (p.status || (p.is_active ? 'active' : 'inactive'));
                  const meta = STATUS_LABELS[statusKey] || STATUS_LABELS.inactive;
                  const thumb = p.images?.[0];
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors group">
                        <td className="w-10 px-4 py-3">
                          <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                              {thumb ? <img src={getImageUrl(thumb)} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300 m-auto mt-2.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{p.title_en || p.name_en || 'Untitled'}</p>
                              <p className="text-xs text-slate-400 capitalize">{p.condition || 'new'} · {p.category || 'Uncategorized'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <code className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded">{p.sku || '—'}</code>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{fmtKSh(p.price)}</p>
                            {p.discount_price && <p className="text-xs text-slate-400 line-through">{fmtKSh(p.discount_price)}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={cn('text-xs font-bold px-2 py-1 rounded-lg border', meta.bg, meta.color)}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <button onClick={() => setExpandedAnalytics(expandedAnalytics === p.id ? null : p.id)} className="flex items-center gap-1.5 text-xs text-sky-600 font-bold hover:text-sky-700">
                            <BarChart2 className="w-3.5 h-3.5" />
                            Analytics
                            {expandedAnalytics === p.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(p)} className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => duplicateProduct(p)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Duplicate">
                              <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateMutation.mutate({ id: p.id, data: { status: 'archived' } })} className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Archive">
                              <Archive className="w-4 h-4" />
                            </button>
                            <button onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(p.id); }} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedAnalytics === p.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="px-6 py-3">
                            <div className="flex flex-wrap gap-6">
                              {[
                                { icon: Eye, label: 'Views', value: p.views ?? 0, color: 'text-sky-600' },
                                { icon: Heart, label: 'Favorites', value: p.favorites_count ?? 0, color: 'text-pink-500' },
                                { icon: ShoppingCart, label: 'Cart Adds', value: p.cart_count ?? 0, color: 'text-purple-600' },
                                { icon: Package, label: 'Orders', value: p.orders_count ?? 0, color: 'text-emerald-600' },
                                { icon: Tag, label: 'Revenue', value: fmtKSh(p.revenue ?? 0), color: 'text-amber-600' },
                              ].map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                  <item.icon className={cn('w-4 h-4', item.color)} />
                                  <span className="text-xs text-slate-500">{item.label}:</span>
                                  <span className="text-xs font-bold text-slate-800">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
              <p className="text-xs text-slate-400">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors">Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = page <= 3 ? i + 1 : page + i - 2;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button key={pg} onClick={() => setPage(pg)} className={cn('w-8 h-8 text-xs font-bold rounded-lg transition-colors', pg === page ? 'bg-sky-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100')}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-end">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-black text-slate-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-5">
              {/* Basic Info */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Basic Information</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Product Name *</label>
                    <input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} placeholder="Enter product name" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Description</label>
                    <textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} rows={4} placeholder="Describe your product..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">Brand</label>
                      <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Samsung" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">SKU</label>
                      <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. PROD-001" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">Category</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-white">
                        <option value="">Select category</option>
                        {categories.map((c: any) => <option key={c.id || c.slug} value={c.slug || c.name_en}>{c.name_en}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">Condition</label>
                      <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-white">
                        {CONDITIONS.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Pricing & Stock</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Price (KSh) *</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" min="0" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Discount Price (KSh)</label>
                    <input type="number" value={form.discount_price} onChange={e => setForm(f => ({ ...f, discount_price: e.target.value }))} placeholder="0" min="0" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Stock Quantity</label>
                    <input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} placeholder="0" min="0" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Weight (kg)</label>
                    <input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="0.0" step="0.1" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Dimensions (L x W x H cm)</label>
                  <input value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} placeholder="e.g. 30 x 20 x 10" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
                </div>
              </div>

              {/* Images */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Product Images</p>
                <label className={cn('flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-colors', uploading ? 'border-sky-300 bg-sky-50' : 'border-slate-200 hover:border-sky-400 hover:bg-sky-50/50')}>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  {uploading ? <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-2" /> : <Upload className="w-8 h-8 text-slate-300 mb-2" />}
                  <span className="text-sm font-bold text-slate-500">{uploading ? 'Uploading...' : 'Click to upload images'}</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG, WebP up to 10MB each</span>
                </label>
                {form.images.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variants */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Product Variants</p>
                <div className="flex gap-2 mb-3">
                  <select value={newVariantType} onChange={e => setNewVariantType(e.target.value as any)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                    {VARIANT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  <input value={newVariantValue} onChange={e => setNewVariantValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && addVariantValue()} placeholder="Add value (e.g. Red)" className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
                  <button onClick={addVariantValue} className="p-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.variants.map(vg => (
                  <div key={vg.type} className="mb-2">
                    <p className="text-xs font-bold text-slate-600 capitalize mb-1.5">{vg.type}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {vg.values.map(val => (
                        <span key={val} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                          {val}
                          <button onClick={() => removeVariantValue(vg.type, val)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-slate-100 bg-white flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-sm">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Need api import for create
import api from '../../services/api';
