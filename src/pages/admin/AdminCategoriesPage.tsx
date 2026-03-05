import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { listingService } from '../../services/listingService';
import { Button } from '../../components/Button';
import {
    Plus, Trash2, Folder, Loader2, AlertCircle, Edit2,
    ChevronDown, ChevronRight, Image as ImageIcon, Upload, X, Check
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

const AdminCategoriesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState<{ type: 'category' | 'subcategory', data: any } | null>(null);
    const [isAdding, setIsAdding] = useState<{ type: 'category' | 'subcategory', parentId?: number } | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', icon_name: 'Folder', image_url: '' });
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const categoryMutation = useMutation({
        mutationFn: (data: any) => isEditing
            ? adminService.updateCategory(isEditing.data.id, data)
            : adminService.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeModals();
        },
        onError: (err: any) => setError(err.response?.data?.detail || 'Operation failed')
    });

    const subCategoryMutation = useMutation({
        mutationFn: (data: any) => isEditing
            ? adminService.updateSubCategory(isEditing.data.id, data)
            : adminService.createSubCategory({ ...data, category_id: isAdding?.parentId! }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeModals();
        },
        onError: (err: any) => setError(err.response?.data?.detail || 'Operation failed')
    });

    const deleteMutation = useMutation({
        mutationFn: ({ type, id }: { type: 'category' | 'subcategory', id: number }) =>
            type === 'category' ? adminService.deleteCategory(id) : adminService.deleteSubCategory(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError('');
        try {
            const result = await listingService.uploadImage(file);
            setFormData(prev => ({ ...prev, image_url: result.url }));
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const closeModals = () => {
        setIsEditing(null);
        setIsAdding(null);
        setFormData({ name: '', slug: '', icon_name: 'Folder', image_url: '' });
        setError('');
    };

    const openEdit = (type: 'category' | 'subcategory', item: any) => {
        setIsEditing({ type, data: item });
        setFormData({
            name: item.name,
            slug: item.slug,
            icon_name: item.icon_name || 'Folder',
            image_url: item.image_url || ''
        });
    };

    const openAdd = (type: 'category' | 'subcategory', parentId?: number) => {
        setIsAdding({ type, parentId });
        setFormData({ name: '', slug: '', icon_name: 'Folder', image_url: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.slug) {
            setError('Name and slug are required');
            return;
        }

        const type = isEditing?.type || isAdding?.type;
        if (type === 'category') {
            categoryMutation.mutate(formData);
        } else {
            subCategoryMutation.mutate(formData);
        }
    };

    const renderIcon = (iconName: string) => {
        // @ts-ignore
        const Icon = LucideIcons[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || Folder;
        return <Icon className="w-5 h-5" />;
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Platform Categories</h1>
                    <p className="text-gray-500 mt-1 italic">Manage listing structure and visual branding.</p>
                </div>
                <Button onClick={() => openAdd('category')} className="gap-2 rounded-xl">
                    <Plus size={18} />
                    Add Root Category
                </Button>
            </div>

            <div className="space-y-4">
                {categories?.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:border-primary-100">
                        {/* Category Header */}
                        <div className="p-4 md:p-6 flex items-center gap-4">
                            <button
                                onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"
                            >
                                {expandedCategory === cat.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </button>

                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                                {cat.image_url ? (
                                    <img src={getImageUrl(cat.image_url)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    renderIcon(cat.icon_name)
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{cat.name}</h3>
                                <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-0.5">
                                    <span className="bg-gray-50 px-2 py-0.5 rounded">{cat.slug}</span>
                                    <span>•</span>
                                    <span>{cat.subcategories?.length || 0} Subcategories</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 w-9 p-0"
                                    onClick={() => openEdit('category', cat)}
                                >
                                    <Edit2 size={16} className="text-gray-400" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 text-primary-600 font-bold hidden md:flex"
                                    onClick={() => openAdd('subcategory', cat.id)}
                                >
                                    <Plus size={16} className="mr-1" /> Add Sub
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 w-9 p-0 text-red-500 hover:bg-red-50"
                                    onClick={() => {
                                        if (confirm(`Delete category "${cat.name}" and all its subcategories?`)) {
                                            deleteMutation.mutate({ type: 'category', id: cat.id });
                                        }
                                    }}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Subcategories (Expanded) */}
                        {expandedCategory === cat.id && (
                            <div className="bg-gray-50/50 border-t border-gray-50 px-6 py-4 md:px-20">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-4 md:hidden">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subcategories</span>
                                        <Button size="sm" variant="outline" className="h-8 py-0 rounded-lg text-xs" onClick={() => openAdd('subcategory', cat.id)}>
                                            + Add
                                        </Button>
                                    </div>

                                    {cat.subcategories?.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic py-4">No subcategories yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {cat.subcategories?.map(sub => (
                                                <div key={sub.id} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between group shadow-sm transition-all hover:bg-gray-50">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 shrink-0 overflow-hidden">
                                                            {sub.image_url ? (
                                                                <img src={getImageUrl(sub.image_url)} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                    <ImageIcon size={14} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700 truncate">{sub.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEdit('subcategory', sub)}
                                                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Delete subcategory "${sub.name}"?`)) {
                                                                    deleteMutation.mutate({ type: 'subcategory', id: sub.id });
                                                                }
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {categories?.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                        <Folder className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 italic">No categories found. Start by adding one.</p>
                    </div>
                )}
            </div>

            {/* Modal (Add/Edit) */}
            {(isEditing || isAdding) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModals} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isEditing ? `Edit ${isEditing.type}` : `Add New ${isAdding?.type}`}
                                </h2>
                                <button onClick={closeModals} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* Image — Upload file OR paste URL */}
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                                        <p className="text-sm font-bold text-gray-900">Category Image</p>
                                        <div className="flex items-center gap-4">
                                            {/* Preview circle */}
                                            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-200 shrink-0 relative group">
                                                {formData.image_url ? (
                                                    <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-7 h-7 text-gray-200" />
                                                )}
                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                        <Loader2 className="w-5 w-5 animate-spin text-primary-600" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                {/* Upload button */}
                                                <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 w-full">
                                                    <Upload className="w-4 h-4 text-primary-500 shrink-0" />
                                                    Upload image file
                                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                                </label>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <div className="flex-1 h-px bg-gray-200" />
                                                    <span>or paste URL</span>
                                                    <div className="flex-1 h-px bg-gray-200" />
                                                </div>
                                            </div>
                                        </div>
                                        {/* URL input */}
                                        <input
                                            type="url"
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all"
                                            placeholder="https://images.unsplash.com/... or picsum.photos/..."
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        />
                                        {formData.image_url && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                                className="text-xs text-red-500 hover:underline flex items-center gap-1"
                                            >
                                                <X size={12} /> Remove image
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-full">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Display Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                                                placeholder="e.g. Mobile Phones"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Slug (URL ID)</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
                                                placeholder="e.g. mobile-phones"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                            />
                                        </div>
                                        {(isEditing?.type === 'category' || isAdding?.type === 'category') && (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Lucide Icon</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                                                    placeholder="e.g. Smartphone"
                                                    value={formData.icon_name}
                                                    onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-sm flex items-center gap-3">
                                        <AlertCircle size={18} />
                                        <p className="font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="flex-1 rounded-xl h-12" onClick={closeModals}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 rounded-xl h-12 shadow-lg shadow-primary-100"
                                        disabled={categoryMutation.isPending || subCategoryMutation.isPending || isUploading}
                                    >
                                        {(categoryMutation.isPending || subCategoryMutation.isPending) ? (
                                            <Loader2 className="animate-spin h-5 w-5" />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Check size={18} />
                                                <span>{isEditing ? 'Save Changes' : 'Create Entry'}</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategoriesPage;
