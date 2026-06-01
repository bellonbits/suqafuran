import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageField } from '../../hooks/useLanguageField';
import { listingService } from '../../services/listingService';
import api from '../../services/api';
import {
    Search, Filter, Loader2, CheckCircle, XCircle,
    Eye, Edit, Trash2, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    active:   'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    sold:     'bg-gray-100 text-gray-500',
    inactive: 'bg-gray-100 text-gray-500',
};

const AdminListingsPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { getField } = useLanguageField();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [subcategoryFilter, setSubcategoryFilter] = useState('');
    const [subsubcategoryFilter, setSubsubcategoryFilter] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const limit = 20;

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => listingService.getCategories(),
    });

    const { data: listings = [], isLoading } = useQuery({
        queryKey: ['admin-listings', search, statusFilter, categoryFilter, subcategoryFilter, subsubcategoryFilter, page],
        queryFn: () => listingService.getListings({
            q: search || undefined,
            status: statusFilter || undefined,
            category_id: categoryFilter || undefined,
            subcategory_id: subcategoryFilter || undefined,
            subsubcategory_id: subsubcategoryFilter || undefined,
            limit,
            skip: (page - 1) * limit,
        }),
    });

    const filteredListings = listings;

    const deleteMutation = useMutation({
        mutationFn: (id: number) => listingService.deleteListing(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
            setDeleteTarget(null);
        },
    });

    const moderateMutation = useMutation({
        mutationFn: ({ id, approve }: { id: number; approve: boolean }) =>
            api.post(`/admin/moderate/${id}`, null, { params: { approve } }).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-listings'] }),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            api.patch(`/listings/${id}`, { status }).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-listings'] }),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('admin.allListings')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('admin.allListingsSubtitle')}</p>
                </div>
                <span className="text-sm text-gray-400">{filteredListings.length} {t('admin.results')}</span>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('admin.searchByTitle')}
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={categoryFilter}
                        onChange={e => { 
                            setCategoryFilter(e.target.value); 
                            setSubcategoryFilter('');
                            setSubsubcategoryFilter('');
                            setPage(1); 
                        }}
                        className="py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    >
                        <option value="">{t('admin.allCategories')}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {getField(cat, 'name')}
                            </option>
                        ))}
                    </select>

                    {categoryFilter && (
                        <select
                            value={subcategoryFilter}
                            onChange={e => { 
                                setSubcategoryFilter(e.target.value); 
                                setSubsubcategoryFilter('');
                                setPage(1); 
                            }}
                            className="py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 ml-2 animate-in slide-in-from-left-1 duration-200"
                        >
                            <option value="">{t('admin.allSubcategories', 'All Subcategories')}</option>
                            {categories.find(c => String(c.id) === categoryFilter)?.subcategories?.map((sub: any) => (
                                <option key={sub.id} value={sub.id}>
                                    {getField(sub, 'name')}
                                </option>
                            ))}
                        </select>
                    )}

                    {subcategoryFilter && (
                        <select
                            value={subsubcategoryFilter}
                            onChange={e => { 
                                setSubsubcategoryFilter(e.target.value); 
                                setPage(1); 
                            }}
                            className="py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 ml-2 animate-in slide-in-from-left-1 duration-200"
                        >
                            <option value="">{t('admin.allSubSubcategories', 'All Types')}</option>
                            {categories
                                .find(c => String(c.id) === categoryFilter)
                                ?.subcategories?.find((s: any) => String(s.id) === subcategoryFilter)
                                ?.subsubcategories?.map((ss: any) => (
                                    <option key={ss.id} value={ss.id}>
                                        {getField(ss, 'name')}
                                    </option>
                                ))
                            }
                        </select>
                    )}

                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 ml-2"
                    >
                        <option value="">{t('admin.allStatuses')}</option>
                        <option value="active">{t('admin.approved')}</option>
                        <option value="pending">{t('admin.pending')}</option>
                        <option value="rejected">{t('admin.rejected')}</option>
                        <option value="sold">{t('admin.sold')}</option>
                        <option value="inactive">{t('admin.inactive')}</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">{t('admin.noListings')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.listing')}</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.seller')}</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.price')}</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.status')}</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.views')}</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Sold</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.posted')}</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-600">{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredListings.map(listing => (
                                    <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                    {listing.images?.[0] ? (
                                                        <img src={listing.images[0]} alt={getField(listing, 'title')} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">{t('admin.noImg')}</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate max-w-[200px]">{getField(listing, 'title')}</p>
                                                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{listing.location}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            <p className="font-medium">{listing.owner?.full_name || '—'}</p>
                                            <p className="text-xs text-gray-400">{listing.owner?.phone}</p>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {listing.price ? `${listing.currency || 'KSh'} ${listing.price.toLocaleString()}` : t('common.free')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={listing.status || 'active'}
                                                onChange={e => statusMutation.mutate({ id: listing.id, status: e.target.value })}
                                                className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300 ${STATUS_COLORS[listing.status || 'active']}`}
                                            >
                                                <option value="active">{t('myads.active')}</option>
                                                <option value="pending">{t('admin.pending')}</option>
                                                <option value="rejected">{t('admin.rejected')}</option>
                                                <option value="sold">{t('admin.sold')}</option>
                                                <option value="inactive">{t('admin.inactive')}</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{listing.views ?? 0}</td>
                                        <td className="px-4 py-3">
                                            {(listing as any).is_sold ? (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                                        ✓ Sold
                                                    </span>
                                                    {(listing as any).sold_via && (
                                                        <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{(listing as any).sold_via}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-300 font-medium">Not sold</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                            {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                {listing.status === 'pending' && (
                                                    <div className="flex items-center gap-1 border-r border-gray-100 pr-2 mr-1">
                                                        <button
                                                            onClick={() => moderateMutation.mutate({ id: listing.id, approve: true })}
                                                            title={t('admin.approve')}
                                                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => moderateMutation.mutate({ id: listing.id, approve: false })}
                                                            title={t('admin.reject')}
                                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/listing/${listing.id}`)}
                                                    title={t('listing.viewProfile')}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/edit-ad/${listing.id}`)}
                                                    title={t('common.edit')}
                                                    className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(listing.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all font-bold text-xs shadow-sm border border-red-100"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>{t('common.delete')}</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && filteredListings.length > 0 && (
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" /> {t('admin.previous')}
                    </button>
                    <span className="text-sm text-gray-500">{t('admin.page')} {page}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={listings.length < limit}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {t('admin.next')} <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteTarget !== null && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{t('admin.deleteListing')}</h3>
                                <p className="text-sm text-gray-500">{t('admin.cannotUndo')}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(deleteTarget)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                            >
                                {deleteMutation.isPending ? t('admin.deleting') : t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminListingsPage;
