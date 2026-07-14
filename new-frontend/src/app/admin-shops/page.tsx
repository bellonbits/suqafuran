"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader, Store, Package, Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/services/api';

const ShopsPage = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedShops, setExpandedShops] = useState<number[]>([]);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    setLoading(true);
    try {
      // Get verified sellers (shops) - limit to 50 to avoid timeout
      const verResponse = await api.get('/verifications/?limit=50');

      let shopsData = Array.isArray(verResponse.data) ? verResponse.data : [];
      console.log(`Loaded ${shopsData.length} shops from verifications`);

      // Fetch listings sequentially to avoid timeout
      const results = [];
      for (const shop of shopsData) {
        let listings: any[] = [];

        try {
          const listingsRes = await api.get(`/listings/?limit=100&owner_id=${shop.user_id}`);
          if (Array.isArray(listingsRes.data)) {
            listings = listingsRes.data;
          }
        } catch (e) {
          // Silently fail
        }

        results.push({
          id: shop.id,
          shop_name: shop.user?.business_name || shop.user?.full_name || 'Unknown',
          owner_name: shop.user?.full_name || 'Unknown',
          email: shop.user?.email || '',
          phone: shop.user?.phone || '',
          verified: shop.status === 'approved',
          created_at: shop.created_at || new Date().toISOString(),
          listings: listings,
          total_products: listings.length,
          active_products: listings.filter((l: any) => l.status === 'active').length,
          user_id: shop.user_id
        });
      }

      console.log(`Transformed to ${results.length} shops`);
      setShops(results);
    } catch (error) {
      console.error('Error loading shops:', error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter(s =>
    s.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleShop = (shopId: number) => {
    setExpandedShops(prev =>
      prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Shops Management</h1>
            <p className="text-gray-500 mt-1">View all shops and their listings</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search shops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
          />
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-3xl font-black text-gray-900">{filteredShops.length}</p>
            <p className="text-sm text-gray-500 mt-2">Total Shops</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-3xl font-black text-[#5bc0e8]">{filteredShops.reduce((sum, s) => sum + s.total_products, 0)}</p>
            <p className="text-sm text-gray-500 mt-2">Total Listings</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-3xl font-black text-green-600">{filteredShops.reduce((sum, s) => sum + s.active_products, 0)}</p>
            <p className="text-sm text-gray-500 mt-2">Active Listings</p>
          </div>
        </div>

        {/* Shops */}
        <div className="space-y-4">
          {filteredShops.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
              No shops found
            </div>
          ) : (
            filteredShops.map((shop) => (
              <div key={shop.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Shop Header */}
                <button
                  onClick={() => toggleShop(shop.id)}
                  className="w-full p-6 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-[#e0f7ff] flex items-center justify-center">
                      <Store className="w-6 h-6 text-[#5bc0e8]" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-black text-gray-900">{shop.shop_name}</h3>
                      <p className="text-sm text-gray-600">{shop.owner_name}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">{shop.total_products}</p>
                        <p className="text-xs text-gray-500">Listings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-green-600">{shop.active_products}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                      {expandedShops.includes(shop.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Shop Details */}
                {expandedShops.includes(shop.id) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">EMAIL</p>
                        <p className="text-sm text-gray-900">{shop.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">PHONE</p>
                        <p className="text-sm text-gray-900">{shop.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">JOINED</p>
                        <p className="text-sm text-gray-900">{new Date(shop.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">STATUS</p>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-block">
                          ✓ Verified
                        </span>
                      </div>
                    </div>

                    {/* Listings */}
                    {shop.listings && shop.listings.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4">Listings ({shop.listings.length})</h4>
                        <div className="space-y-3">
                          {shop.listings.map((listing: any) => (
                            <div key={listing.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4">
                              {listing.images && listing.images.length > 0 ? (
                                <img src={listing.images[0]} alt="" className="w-16 h-16 rounded object-cover" />
                              ) : (
                                <div className="w-16 h-16 rounded bg-gray-200" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{listing.title_en || listing.title_so || 'Unknown'}</p>
                                    <p className="text-xs text-gray-600 mt-1">{listing.location}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-gray-900">{listing.currency} {listing.price?.toLocaleString()}</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block mt-1 ${
                                      listing.status === 'active' ? 'bg-green-100 text-green-700' :
                                      listing.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {listing.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm">No listings yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopsPage;
