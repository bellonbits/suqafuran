"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, Search, Filter, Plus, ArrowLeft, Edit, Eye, Trash2, Loader } from 'lucide-react';
import api from '@/services/api';

export default function AgentListingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const res = await api.get('/promotions/agent/all-listings');
      setListings(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(l =>
    (l.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6 justify-between">
          <div className="flex items-center gap-4">
            <Link href="/agent-dashboard" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <h1 className="text-3xl font-black text-white">My Listings ({listings.length})</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg flex items-center gap-2 transition-colors font-bold"
          >
            <Plus className="w-5 h-5" />
            New Listing
          </motion.button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#6cd4ff]"
            />
          </div>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors">
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>
      </div>

      <div className="p-6">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No listings</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-sky-600 transition-colors"
              >
                <div className="h-40 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <Briefcase className="w-12 h-12 text-slate-500" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white truncate">{listing.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{listing.location || '—'}</p>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                    <div>
                      <p className="text-xs text-slate-400">Price</p>
                      <p className="text-xl font-black text-green-400">Ksh {listing.price?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Views</p>
                      <p className="text-xl font-black text-[#6cd4ff]">{listing.views || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 px-3 py-2 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-sm">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
