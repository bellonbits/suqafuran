"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Loader, ChevronLeft, Eye, Trash2, Edit2, X, ChevronDown, Download, Upload,
  LayoutDashboard, Users, UserCheck, ShoppingCart, DollarSign, Truck, Grid3x3,
  Tag, Percent, MessageSquare, Shield, AlertTriangle, TrendingUp, FileText, AlertCircle, BarChart3, Zap, Package
} from 'lucide-react';
import api from '@/services/api';
import Papa from 'papaparse';
import { DashboardLayout } from '@/components/DashboardLayout';

const adminNavItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/admin-dashboard' },
  { label: 'Shops', icon: <Package className="w-5 h-5" />, href: '/admin-shops' },
  { label: 'Sellers', icon: <Users className="w-5 h-5" />, href: '/admin-sellers' },
  { label: 'Listings', icon: <Grid3x3 className="w-5 h-5" />, href: '/admin-listings' },
  { label: 'Verifications', icon: <UserCheck className="w-5 h-5" />, href: '/admin-verifications' },
  { label: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, href: '/admin-orders' },
];

const AdminSellersPage = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingSeller, setViewingSeller] = useState<any>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [exportCount, setExportCount] = useState(0);

  useEffect(() => {
    loadSellers();
  }, [searchQuery]);

  const loadSellers = async () => {
    setLoading(true);
    try {
      let url = `/admin/sellers?limit=500`;
      if (searchQuery) url += `&search=${searchQuery}`;

      const res = await api.get(url).catch(() => null);
      if (res?.data) {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setSellers(data);
        setExportCount(data.length);
      }
    } catch (error) {
      console.error('Error loading sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (seller: any) => {
    setViewingSeller(seller);
  };

  const handleEdit = (id: number) => {
    window.location.href = `/admin-sellers/\${id}/edit`;
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    if (confirm('Are you sure you want to delete this seller account?')) {
      try {
        await api.delete(`/users/\${id}`).catch(() => null);
        setDeleting(null);
        loadSellers();
      } catch (error) {
        console.error('Error deleting seller:', error);
        setDeleting(null);
      }
    } else {
      setDeleting(null);
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(
      sellers.map(s => ({
        id: s.id,
        full_name: s.full_name,
        email: s.email,
        phone: s.phone || '',
        business_name: s.business_name || '',
        location: s.location || '',
        market: s.market || '',
        is_active: s.is_active ? 'Yes' : 'No',
        is_verified: s.is_verified ? 'Yes' : 'No',
        verified_level: s.verified_level || '',
        trust_level: s.trust_level || 'NEW',
        trust_score: s.trust_score || 0,
        is_flagged: s.is_flagged ? 'Yes' : 'No',
        is_suspended: s.is_suspended ? 'Yes' : 'No',
        response_time: s.response_time || '',
        listings_count: s.listings_count || 0,
        joined_date: s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
      }))
    );

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `sellers_export_\${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results: any) => {
        console.log('Imported CSV data:', results.data);
        alert(`Loaded \${results.data.length} sellers for bulk update. Feature coming soon.`);
      },
      error: (error: any) => {
        console.error('CSV parse error:', error);
        alert('Error parsing CSV file');
      },
    });
  };

  return (
    <DashboardLayout title="Sellers Management" navItems={adminNavItems} userRole="admin">
      <div className="max-w-7xl mx-auto px-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Sellers Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and export all {exportCount} seller accounts</p>
        </div>

        <div className="flex gap-3 flex-wrap mb-6 items-center">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors">
            <Download size={16} />
            Export {exportCount} Sellers
          </button>
          <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors cursor-pointer">
            <Upload size={16} />
            Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <div className="flex-1" />
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search sellers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

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
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">NAME</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">BUSINESS</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">EMAIL</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">PHONE</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">TRUST</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">LISTINGS</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No sellers found</td></tr>
                  ) : (
                    sellers.map((seller) => (
                      <tr key={seller.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-900 dark:text-white">{seller.full_name || 'Unknown'}</p></td>
                        <td className="px-4 py-4"><p className="text-sm text-gray-600 dark:text-gray-400">{seller.business_name || '—'}</p></td>
                        <td className="px-4 py-4"><p className="text-sm text-gray-600 dark:text-gray-400 truncate">{seller.email}</p></td>
                        <td className="px-4 py-4"><p className="text-sm text-gray-600 dark:text-gray-400">{seller.phone || '—'}</p></td>
                        <td className="px-4 py-4"><span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{seller.trust_level || 'NEW'}</span></td>
                        <td className="px-4 py-4"><p className="text-sm font-bold text-gray-900 dark:text-white">{seller.listings_count || 0}</p></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleView(seller)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                              <Eye className="w-4 h-4 text-[#5bc0e8]" />
                            </button>
                            <button onClick={() => handleEdit(seller.id)} className="p-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded transition-colors">
                              <Edit2 className="w-4 h-4 text-orange-600" />
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

      {viewingSeller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Details</h2>
              <button onClick={() => setViewingSeller(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-bold text-gray-600 dark:text-gray-400">NAME</p><p className="text-sm text-gray-900 dark:text-white">{viewingSeller.full_name}</p></div>
                <div><p className="text-xs font-bold text-gray-600 dark:text-gray-400">BUSINESS</p><p className="text-sm text-gray-900 dark:text-white">{viewingSeller.business_name || '—'}</p></div>
                <div><p className="text-xs font-bold text-gray-600 dark:text-gray-400">EMAIL</p><p className="text-sm text-gray-900 dark:text-white">{viewingSeller.email}</p></div>
                <div><p className="text-xs font-bold text-gray-600 dark:text-gray-400">PHONE</p><p className="text-sm text-gray-900 dark:text-white">{viewingSeller.phone || '—'}</p></div>
                <div><p className="text-xs font-bold text-gray-600 dark:text-gray-400">LOCATION</p><p className="text-sm text-gray-900 dark:text-white">{viewingSeller.location || '—'}</p></div>
                <div><p className="text-xs font-bold text-gray-600 dark:text-gray-400">TRUST LEVEL</p><p className="text-sm text-gray-900 dark:text-white">{viewingSeller.trust_level || 'NEW'}</p></div>
                <div><p className="text-xs font-bold text-gray-600 dark:text-gray-400">LISTINGS</p><p className="text-sm text-gray-900 dark:text-white">{viewingSeller.listings_count || 0}</p></div>
                <div><p className="text-xs font-bold text-gray-600 dark:text-gray-400">TRUST SCORE</p><p className="text-sm text-gray-900 dark:text-white">{viewingSeller.trust_score || 0}</p></div>
              </div>
              {viewingSeller.shop_description && (
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">SHOP DESCRIPTION</p>
                  <p className="text-sm text-gray-900 dark:text-white">{viewingSeller.shop_description}</p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={() => handleEdit(viewingSeller.id)} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors">
                  <Edit2 className="w-4 h-4 inline mr-2" /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminSellersPage;
