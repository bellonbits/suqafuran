"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader, ChevronLeft, Eye, Trash2, Edit2, X, ChevronDown, Download, Upload, ImageOff, Check, XCircle, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import Papa from 'papaparse';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '../admin-dashboard/navigation';
import { useAuthStore } from '@/store/useAuth';

const ListingsManagementPage = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [viewingListing, setViewingListing] = useState<any>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [approvalStatusOpen, setApprovalStatusOpen] = useState(false);
  const [exportCount, setExportCount] = useState(0);
  const [rejectingListing, setRejectingListing] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvingListing, setApprovingListing] = useState<number | null>(null);
  const [hoveredRejectionReason, setHoveredRejectionReason] = useState<{id: number, reason: string} | null>(null);

  const { user } = useAuthStore();
  const navItems = ADMIN_NAV_ITEMS.map(item => ({
    ...item,
    icon: <item.icon className="w-5 h-5" />
  }));

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadListings();
  }, [searchQuery, categoryFilter, statusFilter, approvalStatusFilter]);

  const loadListings = async () => {
    setLoading(true);
    try {
      let url = `/listings/?limit=500`;
      if (searchQuery) url += `&q=${searchQuery}`;
      if (categoryFilter !== 'all') url += `&category_id=${categoryFilter}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (approvalStatusFilter !== 'all') url += `&approval_status=${approvalStatusFilter}`;

      const res = await api.get(url).catch(() => null);
      if (res?.data) {
        const data = Array.isArray(res.data) ? res.data : [];
        setListings(data);
        setExportCount(data.length);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/listings/categories').catch(() => null);
      if (res?.data) {
        const cats = Array.isArray(res.data) ? res.data : [];
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getCategoryName = (categoryId: string | number | null) => {
    if (!categoryId) return 'N/A';
    const category = categories.find(c => c.id == categoryId);
    return category?.name_en || 'N/A';
  };

  const handleView = (listing: any) => {
    setViewingListing(listing);
  };

  const handleEdit = (id: number) => {
    window.location.href = `/admin-listings/${id}/edit`;
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/listings/${id}`).catch(() => null);
        setDeleting(null);
        loadListings();
      } catch (error) {
        console.error('Error deleting listing:', error);
        setDeleting(null);
      }
    } else {
      setDeleting(null);
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(listings.map(l => ({
      id: l.id,
      title_en: l.title_en,
      title_so: l.title_so,
      description_en: l.description_en,
      description_so: l.description_so,
      price: l.price,
      currency: l.currency,
      category: getCategoryName(l.category_id),
      condition: l.condition,
      location: l.location,
      status: l.status,
      views: l.views,
      is_sold: l.is_sold,
      images: l.images?.join('|') || '',
    })));

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `listings_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results: any) => {
        console.log('Imported CSV data:', results.data);
        // Handle CSV import - show modal or redirect to bulk editor
      },
      error: (error: any) => {
        console.error('CSV parse error:', error);
        alert('Error parsing CSV file');
      },
    });
  };

  const handleApprove = async (id: number) => {
    setApprovingListing(id);
    try {
      const notes = prompt('Add optional moderation notes:');
      await api.post(`/listings/${id}/approve`, { notes: notes || '' }).catch(() => null);
      loadListings();
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('Failed to approve listing');
    } finally {
      setApprovingListing(null);
    }
  };

  const handleRejectClick = (id: number) => {
    setRejectingListing(id);
    setRejectionReason('');
    setRejectionNotes('');
    setShowRejectionModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Rejection reason is required');
      return;
    }

    if (!rejectingListing) return;

    try {
      await api.post(`/listings/${rejectingListing}/reject`, {
        reason: rejectionReason,
        notes: rejectionNotes || '',
      }).catch(() => null);
      setShowRejectionModal(false);
      setRejectingListing(null);
      setRejectionReason('');
      setRejectionNotes('');
      loadListings();
    } catch (error) {
      console.error('Error rejecting listing:', error);
      alert('Failed to reject listing');
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <DashboardLayout title="Posted Ads" navItems={navItems} userRole="admin">
      <div className="py-8">

        {/* Buttons & Filters */}
        <div className="flex gap-3 flex-wrap mb-6 items-center">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#02CCFE] hover:bg-[#02CCFE] text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            Export {exportCount} Listings with Images
          </button>

          <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors cursor-pointer">
            <Upload size={16} />
            Import & Bulk Update CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          <div className="flex-1" />

          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative z-40">
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 font-medium flex items-center gap-2 transition-colors min-w-48"
            >
              Category: {categoryFilter === 'all' ? 'All' : (categories.find(c => c.id == categoryFilter)?.name_en || 'Select')}
              <ChevronDown className="w-4 h-4" />
            </button>
            {categoryOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCategoryOpen(false)} />
                <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-64 max-h-96 overflow-y-auto">
                  <button
                    onClick={() => { setCategoryFilter('all'); setCategoryOpen(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  >
                    All Categories
                  </button>
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategoryFilter(cat.id); setCategoryOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                      >
                        {cat.name_en || cat.name_so || 'Unnamed'}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800">No categories</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative z-40">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 font-medium flex items-center gap-2 transition-colors"
            >
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
              <ChevronDown className="w-4 h-4" />
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setStatusOpen(false)} />
                <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-40 overflow-y-auto">
                  {['all', 'active', 'inactive', 'pending'].map(status => (
                    <button
                      key={status}
                      onClick={() => { setStatusFilter(status); setStatusOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                    >
                      {status === 'all' ? 'All Statuses' : status}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Approval Status Dropdown */}
          <div className="relative z-40">
            <button
              onClick={() => setApprovalStatusOpen(!approvalStatusOpen)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 font-medium flex items-center gap-2 transition-colors"
            >
              Approval: {approvalStatusFilter === 'all' ? 'All' : approvalStatusFilter}
              <ChevronDown className="w-4 h-4" />
            </button>
            {approvalStatusOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setApprovalStatusOpen(false)} />
                <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-48 overflow-y-auto">
                  {['all', 'pending', 'approved', 'rejected'].map(status => (
                    <button
                      key={status}
                      onClick={() => { setApprovalStatusFilter(status); setApprovalStatusOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800 flex items-center gap-2"
                    >
                      {status === 'all' && 'All Approval Statuses'}
                      {status === 'pending' && (
                        <>
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          Pending Review
                        </>
                      )}
                      {status === 'approved' && (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Approved
                        </>
                      )}
                      {status === 'rejected' && (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          Rejected
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">CSV includes: images (pipe-separated URLs)</p>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">TITLE</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">PRICE</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">CATEGORY</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">IMAGES</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">STATUS</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">APPROVAL</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">VIEWS</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No listings found
                      </td>
                    </tr>
                  ) : (
                    listings.map((listing) => (
                      <tr
                        key={listing.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt=""
                                className="w-10 h-10 rounded object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <ImageOff size={16} className="text-gray-400" />
                              </div>
                            )}
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {listing.title_en || listing.title_so || 'Unknown'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {listing.currency} {listing.price ? (listing?.price || 0).toLocaleString() : '0'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getCategoryName(listing.category_id)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            {listing.images && listing.images.slice(0, 3).map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Img ${idx}`}
                                className="w-8 h-8 rounded object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ))}
                            {listing.images && listing.images.length > 3 && (
                              <div className="w-8 h-8 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
                                +{listing.images.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              listing.status === 'active'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : listing.status === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative">
                            <span className={`px-2 py-1 rounded text-xs font-bold inline-block ${getApprovalStatusColor(listing.approval_status || 'pending')}`}>
                              {listing.approval_status === 'approved' && 'Approved'}
                              {listing.approval_status === 'rejected' && 'Rejected'}
                              {listing.approval_status === 'pending' && 'Pending'}
                            </span>
                            {listing.approval_status === 'rejected' && listing.rejection_reason && (
                              <div
                                className="relative inline-block ml-2"
                                onMouseEnter={() => setHoveredRejectionReason({id: listing.id, reason: listing.rejection_reason})}
                                onMouseLeave={() => setHoveredRejectionReason(null)}
                              >
                                <AlertCircle className="w-4 h-4 text-red-600 cursor-help inline" />
                                {hoveredRejectionReason?.id === listing.id && (
                                  <div className="absolute left-0 mt-2 w-64 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 text-xs text-red-800 dark:text-red-300 z-10 shadow-lg">
                                    {hoveredRejectionReason.reason}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {listing.views || 0}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(listing)}
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4 text-[#5bc0e8] dark:text-[#6cd4ff]" />
                            </button>
                            {listing.approval_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(listing.id)}
                                  disabled={approvingListing === listing.id}
                                  className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
                                  title="Approve"
                                >
                                  {approvingListing === listing.id ? (
                                    <Loader className="w-4 h-4 text-green-600 dark:text-green-400 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRejectClick(listing.id)}
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(listing.id)}
                              className="p-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(listing.id)}
                              disabled={deleting === listing.id}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === listing.id ? (
                                <Loader className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
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
        )}
      </div>

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                Reject Listing
              </h2>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectingListing(null);
                  setRejectionReason('');
                  setRejectionNotes('');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Rejection Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Why is this listing being rejected? (e.g., Duplicate listing, Policy violation, Poor quality images)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={4}
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  This will be shown to the seller
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Internal Notes (Optional)
                </label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Add internal notes for moderation team..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectingListing(null);
                    setRejectionReason('');
                    setRejectionNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Listing Details</h2>
              <button
                onClick={() => setViewingListing(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {viewingListing.images && viewingListing.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Images</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {viewingListing.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">TITLE (EN)</p>
                  <p className="text-sm text-gray-900 dark:text-white">{viewingListing.title_en}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">TITLE (SO)</p>
                  <p className="text-sm text-gray-900 dark:text-white">{viewingListing.title_so}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">PRICE</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {viewingListing.currency} {viewingListing.price?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">LOCATION</p>
                  <p className="text-sm text-gray-900 dark:text-white">{viewingListing.location}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">CONDITION</p>
                  <p className="text-sm text-gray-900 dark:text-white">{viewingListing.condition}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">CATEGORY</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {getCategoryName(viewingListing.category_id)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">STATUS</p>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold inline-block ${
                      viewingListing.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : viewingListing.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {viewingListing.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">APPROVAL STATUS</p>
                  <span className={`px-2 py-1 rounded text-xs font-bold inline-block ${getApprovalStatusColor(viewingListing.approval_status || 'pending')}`}>
                    {viewingListing.approval_status === 'approved' && 'Approved'}
                    {viewingListing.approval_status === 'rejected' && 'Rejected'}
                    {viewingListing.approval_status === 'pending' && 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">VIEWS</p>
                  <p className="text-sm text-gray-900 dark:text-white">{viewingListing.views || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">DESCRIPTION (EN)</p>
                <p className="text-sm text-gray-900 dark:text-white">{viewingListing.description_en}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">DESCRIPTION (SO)</p>
                <p className="text-sm text-gray-900 dark:text-white">{viewingListing.description_so}</p>
              </div>

              {viewingListing.approval_status === 'rejected' && viewingListing.rejection_reason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <p className="text-xs font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    REJECTION REASON
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">{viewingListing.rejection_reason}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleEdit(viewingListing.id)}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => {
                    handleDelete(viewingListing.id);
                    setViewingListing(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ListingsManagementPage;
