"use client";
import React, { useState, useEffect } from 'react';
import {
  Loader, Store, Package, Search, ChevronDown, ChevronUp,
  LayoutDashboard, Users, UserCheck, ShoppingCart, DollarSign,
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

const ShopsPage = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedShop, setExpandedShop] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'listings' | 'active'>('listings');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { loadShops(); }, []);

  const loadShops = async () => {
    setLoading(true);
    try {
      const [verResponse, listingsResponse] = await Promise.all([
        api.get('/verifications/?limit=500'),
        api.get('/listings/?limit=5000'),
      ]);

      let shopsData = Array.isArray(verResponse.data) ? verResponse.data : [];
      let allListings = Array.isArray(listingsResponse.data) ? listingsResponse.data : [];

      const listingsByOwner = allListings.reduce((acc: any, listing: any) => {
        const ownerId = listing.owner_id;
        if (!acc[ownerId]) acc[ownerId] = [];
        acc[ownerId].push(listing);
        return acc;
      }, {});

      const results = shopsData.map(shop => {
        const listings = listingsByOwner[shop.user_id] || [];
        return {
          id: shop.id,
          shop_name: shop.user?.business_name || shop.user?.full_name || 'Unknown',
          owner_name: shop.user?.full_name || 'Unknown',
          email: shop.user?.email || '',
          phone: shop.user?.phone || '',
          verified: shop.status === 'approved',
          created_at: shop.created_at || new Date().toISOString(),
          listings,
          total_products: listings.length,
          active_products: listings.filter((l: any) => l.status === 'active').length,
          user_id: shop.user_id,
        };
      });

      setShops(results);
    } catch (error) {
      console.error('Error loading shops:', error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = shops
    .filter(s =>
      s.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let av = sortBy === 'name' ? a.shop_name : sortBy === 'listings' ? a.total_products : a.active_products;
      let bv = sortBy === 'name' ? b.shop_name : sortBy === 'listings' ? b.total_products : b.active_products;
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
        shop_name: s.shop_name,
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
    link.download = `shops_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results: any) => {
        console.log('Imported CSV data:', results.data);
        alert(`Loaded ${results.data.length} shops for bulk update. Feature coming soon.`);
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
      <DashboardLayout title="Shops Management" navItems={adminNavItems} userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-gray-500 text-sm">Loading shops…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Shops Management" navItems={adminNavItems} userRole="admin">
      {/* Page header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900">All Shops</h2>
            <p className="text-sm text-gray-500 mt-0.5">View all verified shops and their listings</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops, owners, email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Export/Import buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download size={16} />
            Export {filtered.length} Shops to CSV
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
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
            <Store className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{filtered.length}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Shops</p>
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

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="data-table-wrapper">
          <div className="py-20 text-center">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No shops found</p>
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
                      Shop <SortIcon col="name" />
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
                {filtered.map(shop => (
                  <React.Fragment key={shop.id}>
                    <tr className={expandedShop === shop.id ? 'bg-sky-50/60' : ''}>
                      {/* Shop name */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Store className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{shop.shop_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{shop.owner_name}</p>
                          </div>
                        </div>
                      </td>
                      {/* Contact */}
                      <td className="hidden md:table-cell">
                        <div className="space-y-0.5">
                          {shop.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />{shop.email}
                            </div>
                          )}
                          {shop.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />{shop.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Joined */}
                      <td className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(shop.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      {/* Listings */}
                      <td>
                        <span className="text-lg font-black text-gray-800">{shop.total_products}</span>
                      </td>
                      {/* Active */}
                      <td>
                        <span className="text-lg font-black text-emerald-600">{shop.active_products}</span>
                      </td>
                      {/* Status */}
                      <td>
                        <span className={`badge ${shop.verified ? 'badge-green' : 'badge-gray'}`}>
                          <StatusDot active={shop.verified} />
                          {shop.verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      {/* Expand */}
                      <td className="text-right">
                        <button
                          onClick={() => setExpandedShop(expandedShop === shop.id ? null : shop.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-sky-100 hover:text-sky-700 text-gray-600 text-xs font-semibold transition-all"
                        >
                          {expandedShop === shop.id ? (
                            <><ChevronUp className="w-3.5 h-3.5" /> Hide</>
                          ) : (
                            <><ExternalLink className="w-3.5 h-3.5" /> Listings</>
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded listings row */}
                    {expandedShop === shop.id && (
                      <tr>
                        <td colSpan={7} className="px-0 py-0 bg-slate-50 border-t border-b border-sky-100">
                          <div className="p-5">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <Package className="w-4 h-4 text-sky-500" />
                              Listings for {shop.shop_name}
                              <span className="ml-1 badge badge-blue">{shop.listings.length}</span>
                            </h4>

                            {shop.listings.length === 0 ? (
                              <div className="py-8 text-center text-gray-400 text-sm">
                                <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                No listings yet
                              </div>
                            ) : (
                              <div className="data-table-wrapper">
                                <div className="overflow-x-auto">
                                  <table className="data-table">
                                    <thead>
                                      <tr>
                                        <th>Product</th>
                                        <th>Location</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {shop.listings.map((listing: any) => (
                                        <tr key={listing.id}>
                                          <td>
                                            <div className="flex items-center gap-3">
                                              {listing.images?.[0] ? (
                                                <img src={listing.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                                              ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
                                              )}
                                              <p className="font-medium text-gray-900 max-w-[200px] truncate">
                                                {listing.title_en || listing.title_so || 'Unknown'}
                                              </p>
                                            </div>
                                          </td>
                                          <td>
                                            {listing.location && (
                                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />{listing.location}
                                              </div>
                                            )}
                                          </td>
                                          <td>
                                            <span className="font-semibold text-gray-900">
                                              {listing.currency} {listing.price?.toLocaleString()}
                                            </span>
                                          </td>
                                          <td>
                                            <span className={`badge ${
                                              listing.status === 'active' ? 'badge-green' :
                                              listing.status === 'pending' ? 'badge-yellow' : 'badge-gray'
                                            }`}>
                                              {listing.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-400">
            <span>Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{shops.length}</span> shops</span>
            <span>Click "Listings" to expand a shop's products</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ShopsPage;
