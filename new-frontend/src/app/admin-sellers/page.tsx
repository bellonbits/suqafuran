"use client";
import React, { useState, useEffect } from 'react';
import {
  Loader, Users, Package, Search, ChevronDown, ChevronUp,
  LayoutDashboard, UserCheck, ShoppingCart, DollarSign,
  Truck, Grid3x3, Tag, Percent, MessageSquare, Shield,
  AlertTriangle, TrendingUp, FileText, AlertCircle, BarChart3,
  Zap, ExternalLink, MapPin, Mail, Phone, Calendar, Download, Upload, Store
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';
import Papa from 'papaparse';

const adminNavItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/admin-dashboard' },
  { label: 'Shops', icon: <Store className="w-5 h-5" />, href: '/admin-shops' },
  { label: 'Sellers', icon: <Users className="w-5 h-5" />, href: '/admin-sellers' },
  { label: 'Listings', icon: <Grid3x3 className="w-5 h-5" />, href: '/admin-listings' },
  { label: 'Verifications', icon: <UserCheck className="w-5 h-5" />, href: '/admin-verifications' },
  { label: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, href: '/admin-orders' },
];

const AdminSellersPage = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSeller, setExpandedSeller] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'listings' | 'active'>('listings');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { loadSellers(); }, []);

  const loadSellers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sellers?limit=500');
      let sellersData = Array.isArray(res.data) ? res.data : [];
      setSellers(sellersData);
    } catch (error) {
      console.error('Error loading sellers:', error);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sellers
    .filter(s =>
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let av = sortBy === 'name' ? a.full_name : sortBy === 'listings' ? a.listings_count : a.listings_count;
      let bv = sortBy === 'name' ? b.full_name : sortBy === 'listings' ? b.listings_count : b.listings_count;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(
      filtered.map(s => ({
        id: s.id,
        full_name: s.full_name,
        business_name: s.business_name || '',
        email: s.email,
        phone: s.phone || '',
        location: s.location || '',
        market: s.market || '',
        verified: s.is_verified ? 'Yes' : 'No',
        trust_level: s.trust_level || 'NEW',
        trust_score: s.trust_score || 0,
        listings_count: s.listings_count || 0,
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

  if (loading) {
    return (
      <DashboardLayout title="Sellers Management" navItems={adminNavItems} userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-gray-500 text-sm">Loading sellers…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Sellers Management" navItems={adminNavItems} userRole="admin">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900">All Sellers</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage and export all verified sellers</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sellers, email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 bg-white shadow-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download size={16} />
            Export {filtered.length} Sellers
          </button>
          <label className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer">
            <Upload size={16} />
            Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="stat-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{filtered.length}</p>
              <p className="text-sm text-gray-500 mt-0.5">Total Sellers</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{filtered.reduce((s, sh) => s + (sh.listings_count || 0), 0)}</p>
              <p className="text-sm text-gray-500 mt-0.5">Total Listings</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Grid3x3 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{filtered.filter(s => s.is_verified).length}</p>
              <p className="text-sm text-gray-500 mt-0.5">Verified</p>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="data-table-wrapper">
            <div className="py-20 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No sellers found</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(seller => (
              <div key={seller.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{seller.full_name}</p>
                    <p className="text-xs text-gray-500">{seller.business_name || '—'}</p>
                  </div>
                  {seller.is_verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Verified</span>}
                </div>
                <div className="space-y-1 text-sm mb-3">
                  {seller.email && <div className="flex items-center gap-1.5 text-gray-600"><Mail className="w-3 h-3" />{seller.email}</div>}
                  {seller.phone && <div className="flex items-center gap-1.5 text-gray-600"><Phone className="w-3 h-3" />{seller.phone}</div>}
                  {seller.location && <div className="flex items-center gap-1.5 text-gray-600"><MapPin className="w-3 h-3" />{seller.location}</div>}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{seller.listings_count || 0}</p>
                    <p className="text-xs text-gray-500">Listings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{seller.trust_level || 'NEW'}</p>
                    <p className="text-xs text-gray-500">Trust</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{seller.trust_score || 0}</p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSellersPage;
