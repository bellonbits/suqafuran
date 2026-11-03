import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit2, Trash2, Eye, MessageSquare,
  Pause, Play, CheckCircle, X,
  Loader2, DollarSign, Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sellerDashboardService } from '../../services/sellerDashboardService';
import { getImageUrl } from '../../utils/imageUtils';
import { StatusBadge } from '../../components/dashboard/StatusBadge';

type ProductFilterStatus = 'all' | 'active' | 'pending' | 'rejected' | 'inactive' | 'sold';

export const SellerProductsPage: React.FC = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ProductFilterStatus>('all');
  const [search, setSearch] = useState('');

  // Quick Price Modal State
  const [priceModalListing, setPriceModalListing] = useState<any | null>(null);
  const [newPrice, setNewPrice] = useState('');

  // Delete Confirm Modal State
  const [deleteModalListing, setDeleteModalListing] = useState<any | null>(null);

  // Fetch listings
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: () => sellerDashboardService.getMyListings({ limit: 100 }),
    staleTime: 30_000,
  });

  // Mutations
  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => sellerDashboardService.patchListing(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-listings'] });
      qc.invalidateQueries({ queryKey: ['seller-dashboard-overview'] });
    },
    onError: () => toast.error('Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sellerDashboardService.deleteListing(id),
    onSuccess: () => {
      toast.success('Product removed');
      setDeleteModalListing(null);
      qc.invalidateQueries({ queryKey: ['seller-listings'] });
      qc.invalidateQueries({ queryKey: ['seller-dashboard-overview'] });
    },
    onError: () => toast.error('Failed to delete product'),
  });

  // Action Handlers
  const handleTogglePause = (listing: any) => {
    const isCurrentlyPaused = listing.status === 'inactive';
    const nextStatus = isCurrentlyPaused ? 'active' : 'inactive';
    patchMutation.mutate(
      { id: listing.id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success(isCurrentlyPaused ? 'Product is now live!' : 'Product paused');
        }
      }
    );
  };

  const handleMarkSold = (listing: any) => {
    patchMutation.mutate(
      { id: listing.id, data: { is_sold: true, status: 'sold' } },
      {
        onSuccess: () => {
          toast.success('Congratulations! Marked as sold.');
        }
      }
    );
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalListing || !newPrice || isNaN(Number(newPrice))) {
      toast.error('Please enter a valid price');
      return;
    }
    patchMutation.mutate(
      { id: priceModalListing.id, data: { price: Number(newPrice) } },
      {
        onSuccess: () => {
          toast.success('Price updated!');
          setPriceModalListing(null);
        }
      }
    );
  };

  // Filter listings
  const filteredListings = listings.filter((item: any) => {
    // Status filter
    if (filter !== 'all') {
      if (filter === 'sold' && (item.is_sold || item.status === 'sold')) {
        // match
      } else if (filter === item.status) {
        // match
      } else {
        return false;
      }
    }
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = (item.title_en || item.title || '').toLowerCase().includes(q);
      const locMatch = (item.location || '').toLowerCase().includes(q);
      if (!titleMatch && !locMatch) return false;
    }
    return true;
  });

  // Status counts
  const counts = {
    all: listings.length,
    active: listings.filter((l: any) => l.status === 'active' && !l.is_sold).length,
    pending: listings.filter((l: any) => l.status === 'pending').length,
    rejected: listings.filter((l: any) => l.status === 'rejected').length,
    inactive: listings.filter((l: any) => l.status === 'inactive' && !l.is_sold).length,
    sold: listings.filter((l: any) => l.is_sold || l.status === 'sold').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ── Top Header & Actions ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Products</h1>
          <p className="text-sm text-slate-500">
            Manage your listings, update prices, or mark sold items.
          </p>
        </div>

        <Link
          to="/seller-dashboard/products/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 transition-all text-sm"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add a Product</span>
        </Link>
      </div>

      {/* ── Search & Simple Filter Pills ───────────────────────────── */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product title or location..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Products', count: counts.all },
            { id: 'active', label: 'Live', count: counts.active },
            { id: 'pending', label: 'Under Review', count: counts.pending },
            { id: 'rejected', label: 'Needs Changes', count: counts.rejected },
            { id: 'inactive', label: 'Paused', count: counts.inactive },
            { id: 'sold', label: 'Sold', count: counts.sold },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as ProductFilterStatus)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                filter === tab.id
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === tab.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Product List Grid ──────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
          <span className="text-xs text-slate-400">Loading your products...</span>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
            <Tag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? 'Try a different search term or clear filters.'
                : 'You have not uploaded any products under this filter.'}
            </p>
          </div>
          <Link
            to="/seller-dashboard/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add a Product Now</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredListings.map((item: any) => {
            const thumb = (item.images && item.images[0]) || item.primary_image;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                {/* Top: Image + Info */}
                <div className="flex gap-3.5">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 relative">
                    {thumb ? (
                      <img src={getImageUrl(thumb)} alt={item.title_en || item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Tag className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5">
                      <StatusBadge status={item.is_sold ? 'sold' : item.status} />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {item.title_en || item.title}
                    </h3>
                    <p className="text-base font-black text-sky-600">
                      {item.currency || 'KES'} {Number(item.price || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      📍 {item.location || 'East Africa'}
                    </p>

                    {/* Stats pill */}
                    <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {item.views ?? 0} views
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        {item.leads ?? 0} enquiries
                      </span>
                    </div>

                    {item.status === 'rejected' && item.rejection_reason && (
                      <p className="text-[11px] text-red-600 font-medium bg-red-50 p-1.5 rounded-lg border border-red-100 mt-1">
                        Reason: {item.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Quick Price Button */}
                    <button
                      onClick={() => {
                        setPriceModalListing(item);
                        setNewPrice(String(item.price || ''));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Change Price</span>
                    </button>

                    {/* Pause / Activate */}
                    {!item.is_sold && item.status !== 'pending' && item.status !== 'rejected' && (
                      <button
                        onClick={() => handleTogglePause(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        {item.status === 'inactive' ? (
                          <>
                            <Play className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Activate</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pause</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Mark As Sold */}
                    {!item.is_sold && item.status !== 'sold' && (
                      <button
                        onClick={() => handleMarkSold(item)}
                        className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Sold</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/sell/${item.id}`}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Edit full product details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => setDeleteModalListing(item)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete advertisement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick Price Update Modal ───────────────────────────────── */}
      {priceModalListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Change Price</h3>
              <button
                onClick={() => setPriceModalListing(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 truncate">
              {priceModalListing.title_en || priceModalListing.title}
            </p>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {priceModalListing.currency || 'KES'}
                </span>
                <input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  className="w-full pl-14 pr-4 py-3 border-2 border-slate-200 focus:border-sky-500 rounded-2xl font-bold text-lg outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriceModalListing(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={patchMutation.isPending}
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20"
                >
                  {patchMutation.isPending ? 'Saving...' : 'Update Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────── */}
      {deleteModalListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete this advertisement?</h3>
              <p className="text-xs text-slate-500">
                "{deleteModalListing.title_en || deleteModalListing.title}" will be permanently removed.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalListing(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                Keep It
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteModalListing.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
