import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../services/listingService';
import {
    Search, Trash2, Edit, Eye, CheckCircle, XCircle,
    ChevronLeft, ChevronRight, AlertTriangle, Loader2, Filter
} from 'lucide-react';
import api from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
    active:   'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    sold:     'bg-gray-100 text-gray-500',
    inactive: 'bg-gray-100 text-gray-500',
};

const AdminListingsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const limit = 20;

    const { data: listings = [], isLoading } = useQuery({
        queryKey: ['admin-listings', search, statusFilter, page],
        queryFn: () => listingService.getListings({
            q: search || undefined,
            limit,
            skip: (page - 1) * limit,
        }),
    });

    const filteredListings = statusFilter
        ? listings.filter(l => l.status === statusFilter)
        : listings;

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
                    <h1 className="text-2xl font-bold text-gray-900">All Listings</h1>
                    <p className="text-sm text-gray-500 mt-1">View, edit, moderate or delete any listing</p>
                </div>
                <span className="text-sm text-gray-400">{filteredListings.length} results</span>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                        <option value="sold">Sold</option>
                        <option value="inactive">Inactive</option>
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
                    <div className="text-center py-20 text-gray-400">No listings found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Listing</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Seller</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Views</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Posted</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredListings.map(listing => (
                                    <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                                        {/* Listing info */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                    {listing.images?.[0] ? (
                                                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate max-w-[200px]">{listing.title}</p>
                                                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{listing.location}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Seller */}
                                        <td className="px-4 py-3 text-gray-600">
                                            <p className="font-medium">{listing.owner?.full_name || '—'}</p>
                                            <p className="text-xs text-gray-400">{listing.owner?.phone}</p>
                                        </td>
                                        {/* Price */}
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {listing.price ? `${listing.currency || 'KSh'} ${listing.price.toLocaleString()}` : 'Free'}
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <select
                                                value={listing.status || 'active'}
                                                onChange={e => statusMutation.mutate({ id: listing.id, status: e.target.value })}
                                                className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300 ${STATUS_COLORS[listing.status || 'active']}`}
                                            >
                                                <option value="active">Active</option>
                                                <option value="pending">Pending</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="sold">Sold</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </td>
                                        {/* Views */}
                                        <td className="px-4 py-3 text-gray-500">{listing.views ?? 0}</td>
                                        {/* Date */}
                                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                            {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {listing.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => moderateMutation.mutate({ id: listing.id, approve: true })}
                                                            title="Approve"
                                                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => moderateMutation.mutate({ id: listing.id, approve: false })}
                                                            title="Reject"
                                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/listing/${listing.id}`)}
                                                    title="View"
                                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/edit-ad/${listing.id}`)}
                                                    title="Edit"
                                                    className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(listing.id)}
                                                    title="Delete"
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <span className="text-sm text-gray-500">Page {page}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={listings.length < limit}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next <ChevronRight className="h-4 w-4" />
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
                                <h3 className="font-bold text-gray-900">Delete Listing</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(deleteTarget)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                            >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminListingsPage;
