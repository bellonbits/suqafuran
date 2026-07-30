"use client";
import React, { useState, useEffect } from 'react';
import {
  Loader, Users, Package, Search, ChevronDown, ChevronUp,
  LayoutDashboard, Store, UserCheck, ShoppingCart, DollarSign,
  Truck, Grid3x3, Tag, Percent, MessageSquare, Shield,
  AlertTriangle, TrendingUp, FileText, AlertCircle, BarChart3,
  Zap, ExternalLink, MapPin, Mail, Phone, Calendar, Download, Upload
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';
import Papa from 'papaparse';

const adminNavItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/admin-dashboard' },
  { label: 'Agent Dashboard', icon: <TrendingUp className="w-5 h-5" />, href: '/agent-dashboard' },
  { label: 'Users', icon: <Users className="w-5 h-5" />, href: '/admin-users' },
  { label: 'Shops', icon: <Store className="w-5 h-5" />, href: '/admin-shops' },
  { label: 'Listings', icon: <Grid3x3 className="w-5 h-5" />, href: '/admin-listings' },
  { label: 'Verifications', icon: <UserCheck className="w-5 h-5" />, href: '/admin-verifications' },
  { label: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, href: '/admin-orders' },
  { label: 'Transactions', icon: <DollarSign className="w-5 h-5" />, href: '/admin-transactions' },
  { label: 'Deliveries', icon: <Truck className="w-5 h-5" />, href: '/admin-deliveries' },
  { label: 'Sellers', icon: <Package className="w-5 h-5" />, href: '/admin-sellers' },
  { label: 'Categories', icon: <Zap className="w-5 h-5" />, href: '/admin-categories' },
  { label: 'Vouchers', icon: <Tag className="w-5 h-5" />, href: '/admin-vouchers' },
  { label: 'Promotions', icon: <Percent className="w-5 h-5" />, href: '/admin-promotions' },
  { label: 'Support', icon: <MessageSquare className="w-5 h-5" />, href: '/admin-support' },
  { label: 'Fraud', icon: <Shield className="w-5 h-5" />, href: '/admin-fraud' },
  { label: 'Unusual Accounts', icon: <AlertTriangle className="w-5 h-5" />, href: '/admin-unusual-accounts' },
  { label: 'Marketing', icon: <TrendingUp className="w-5 h-5" />, href: '/admin-marketing' },
  { label: 'Reports', icon: <FileText className="w-5 h-5" />, href: '/admin-reports' },
  { label: 'Disputes', icon: <AlertCircle className="w-5 h-5" />, href: '/admin-disputes' },
  { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/admin-analytics' },
];

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
  );
}

const SellersPage = () => {
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
      const [verResponse, listingsResponse] = await Promise.all([
        api.get('/verifications/?limit=500'),
        api.get('/listings/?limit=5000'),
      ]);

      let sellersData = Array.isArray(verResponse.data) ? verResponse.data : [];
      let allListings = Array.isArray(listingsResponse.data) ? listingsResponse.data : [];

      const listingsByOwner = allListings.reduce((acc: any, listing: any) => {
        const ownerId = listing.owner_id;
        if (!acc[ownerId]) acc[ownerId] = [];
        acc[ownerId].push(listing);
        return acc;
      }, {});

      const results = sellersData.map(seller => {
        const listings = listingsByOwner[seller.user_id] || [];
        return {
          id: seller.id,
          seller_name: seller.user?.business_name || seller.user?.full_name || 'Unknown',
          owner_name: seller.user?.full_name || 'Unknown',
          email: seller.user?.email || '',
          phone: seller.user?.phone || '',
          verified: seller.status === 'approved',
          created_at: seller.created_at || new Date().toISOString(),
          listings,
          total_products: listings.length,
          active_products: listings.filter((l: any) => l.status === 'active').length,
          user_id: seller.user_id,
        };
      });

      setSellers(results);
    } catch (error) {
      console.error('Error loading sellers:', error);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sellers
    .filter(s =>
      s.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let av = sortBy === 'name' ? a.seller_name : sortBy === 'listings' ? a.total_products : a.active_products;
      let bv = sortBy === 'name' ? b.seller_name : sortBy === 'listings' ? b.total_products : b.active_products;
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
        seller_name: s.seller_name,
        owner_name: s.owner_name,
        email: s.email,
        phone: s.phone,
        total_products: s.total_products,
        active_products: s.active_products,
        verified: s.verified ? 'Yes' : 'No',
        joined_date: new Date(s.created_at).toLocaleDateString(),
      }))
    );

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `sellers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results: any) => {
        console.log('Imported CSV data:', results.data);
        alert(`Loaded ${results.data.length} sellers for bulk update. Feature coming soon.`);
      },
      error: (error: any) => {
        console.error('CSV parse error:', error);
        alert('Error parsing CSV file');
      },
    });
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <span className="ml-1 inline-flex flex-col gap-0">
      <ChevronUp className={`w-3 h-3 -mb-1 ${sortBy === col && sortDir === 'asc' ? 'text-sky-500' : 'text-gray-300'}`} />
      <ChevronDown className={`w-3 h-3 ${sortBy === col && sortDir === 'desc' ? 'text-sky-500' : 'text-gray-300'}`} />
    </span>
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">All Sellers</h2>
          <p className="text-sm text-gray-500 mt-0.5">View all verified sellers and their listings</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sellers, owners, email…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap mb-6">
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Download size={16} />
          Export {filtered.length} Sellers to CSV
        </button>
        <label className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer">
          <Upload size={16} />
          Import CSV for Bulk Update
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
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
            <p className="text-3xl font-black text-gray-900">{filtered.reduce((s, sh) => s + sh.total_products, 0)}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Listings</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Grid3x3 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{filtered.reduce((s, sh) => s + sh.active_products, 0)}</p>
            <p className="text-sm text-gray-500 mt-0.5">Active Listings</p>
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
        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <button onClick={() => toggleSort('name')} className="flex items-center hover:text-gray-700 transition-colors">
                      Seller <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="hidden md:table-cell">Contact</th>
                  <th className="hidden sm:table-cell">Joined</th>
                  <th>
                    <button onClick={() => toggleSort('listings')} className="flex items-center hover:text-gray-700 transition-colors">
                      Listings <SortIcon col="listings" />
                    </button>
                  </th>
                  <th>
                    <button onClick={() => toggleSort('active')} className="flex items-center hover:text-gray-700 transition-colors">
                      Active <SortIcon col="active" />
                    </button>
                  </th>
                  <th>Status</th>
                  <th className="text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(seller => (
                  <React.Fragment key={seller.id}>
                    <tr className={expandedSeller === seller.id ? 'bg-sky-50/60' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{seller.seller_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{seller.owner_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="space-y-0.5">
                          {seller.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />{seller.email}
                            </div>
                          )}
                          {seller.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />{seller.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(seller.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <p className="font-semibold text-gray-900">{seller.total_products}</p>
                      </td>
                      <td>
                        <p className="font-semibold text-gray-900">{seller.active_products}</p>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                          <StatusDot active={seller.verified} />
                          {seller.verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setExpandedSeller(expandedSeller === seller.id ? null : seller.id)}
                          className="text-sky-600 hover:text-sky-700 font-medium text-sm flex items-center gap-1 ml-auto"
                        >
                          {expandedSeller === seller.id ? 'Hide' : 'View'} <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SellersPage;
