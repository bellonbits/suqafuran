import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminService } from '../../services/adminService';
import { listingService } from '../../services/listingService';
import { Button } from '../../components/Button';
import {
    Plus, Trash2, Folder, Loader2, AlertCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const AdminCategoriesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon_name: '' });
    const [error, setError] = useState('');

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const createMutation = useMutation({
        mutationFn: adminService.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsAdding(false);
            setNewCategory({ name: '', slug: '', icon_name: '' });
        },
        onError: (err: any) => {
            setError(err.response?.data?.detail || 'Failed to create category');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: adminService.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!newCategory.name || !newCategory.slug || !newCategory.icon_name) {
            setError('All fields are required');
            return;
        }
        createMutation.mutate(newCategory);
    };

    // Helper to render dynamic icon
    const renderIcon = (iconName: string) => {
        // @ts-ignore
        const Icon = LucideIcons[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || Folder;
        return <Icon className="w-5 h-5" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-500">Manage listing categories</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
                    <Plus size={18} />
                    Add Category
                </Button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-lg mb-4">New Category</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Vehicles"
                                    className="w-full p-2 border rounded-lg"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (ID)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. vehicles"
                                    className="w-full p-2 border rounded-lg"
                                    value={newCategory.slug}
                                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lucide Icon Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. car"
                                    className="w-full p-2 border rounded-lg"
                                    value={newCategory.icon_name}
                                    onChange={(e) => setNewCategory({ ...newCategory, icon_name: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Create Category'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : categories?.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 italic">
                        No categories found. Add one to get started.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Icon</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Slug</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories?.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-500">
                                        {renderIcon(cat.icon_name)}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                                    <td className="px-6 py-4 text-gray-500 bg-gray-50 rounded font-mono text-xs w-fit">{cat.slug}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:bg-red-50"
                                            onClick={() => {
                                                if (confirm('Are you sure? This might affect existing listings.')) {
                                                    deleteMutation.mutate(cat.id);
                                                }
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminCategoriesPage;
