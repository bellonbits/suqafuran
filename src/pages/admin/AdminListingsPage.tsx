import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, CheckCircle, XCircle,
  Eye, Trash2, Tag, MapPin, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { listingService } from '../../services/listingService';
import api from '../../services/api';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { BoardTable, type Column } from '../../components/dashboard/BoardTable';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { getImageUrl } from '../../utils/imageUtils';

export const AdminListingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listingService.getCategories(),
    staleTime: 10 * 60_000,
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['admin-listings', search, statusFilter, categoryFilter],
    queryFn: () => listingService.getListings({
      q: search || undefined,
      status: statusFilter || undefined,
      category_id: categoryFilter || undefined,
      limit: 100,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => listingService.deleteListing(id),
    onSuccess: () => {
      toast.success('Listing deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete listing'),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) =>
      api.post(`/admin/moderate/${id}`, null, { params: { approve } }).then(r => r.data),
    onSuccess: (_, variables) => {
      toast.success(variables.approve ? 'Listing approved' : 'Listing rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
    },
    onError: () => toast.error('Failed to moderate listing'),
  });

  const columns: Column<any>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (item) => {
        const thumb = item.primary_image || (item.images && item.images[0]);
        return (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
              {thumb ? (
                <img src={getImageUrl(thumb)} alt={item.title_en} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Tag className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate max-w-xs">{item.title_en || item.title}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate">{item.location || 'East Africa'}</span>
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      header: 'Price',
      render: (item) => (
        <span className="font-extrabold text-sky-600 font-mono text-xs">
          {item.currency || 'KES'} {Number(item.price || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.is_sold ? 'sold' : item.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => window.open(`/listing/${item.id}`, '_blank')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
            title="View live ad"
          >
            <Eye className="w-4 h-4" />
          </button>

          {item.status === 'pending' && (
            <>
              <button
                onClick={() => moderateMutation.mutate({ id: item.id, approve: true })}
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Approve"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => moderateMutation.mutate({ id: item.id, approve: false })}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete ad"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Listings"
        subtitle="Search, filter, review and moderate all classifieds advertisements across East Africa."
        breadcrumbs={[
          { label: 'Admin Console', path: '/admin-dashboard' },
          { label: 'Listings' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
          </div>
        }
      />

      <BoardTable
        columns={columns}
        data={listings}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        searchable={true}
        searchPlaceholder="Search listings by title or location..."
        searchFilter={(item, query) => {
          const t = (item.title_en || item.title || '').toLowerCase();
          const l = (item.location || '').toLowerCase();
          return t.includes(query) || l.includes(query);
        }}
        filterTabs={[
          { id: '', label: 'All', count: listings.length },
          { id: 'active', label: 'Live', count: listings.filter((l: any) => l.status === 'active' && !l.is_sold).length },
          { id: 'pending', label: 'Under Review', count: listings.filter((l: any) => l.status === 'pending').length },
          { id: 'rejected', label: 'Needs Changes', count: listings.filter((l: any) => l.status === 'rejected').length },
          { id: 'sold', label: 'Sold', count: listings.filter((l: any) => l.is_sold || l.status === 'sold').length },
        ]}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        pageSize={15}
        emptyTitle="No listings match your search"
        emptySubtitle="Try adjusting status filters or search queries."
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete this advertisement?"
        description={`"${deleteTarget?.title_en || 'Listing'}" will be permanently taken down and removed from the marketplace.`}
        confirmLabel="Delete Listing"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminListingsPage;
