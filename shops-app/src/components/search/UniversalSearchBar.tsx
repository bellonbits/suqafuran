"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Sparkles, X, Store, ShoppingBag, ShieldCheck, 
  MapPin, ChevronRight, Loader2, Tag
} from 'lucide-react';
import { searchService, type UniversalSearchResult } from '@/services/searchService';
import { optimizeCloudinaryUrl } from '@/services/api';

interface UniversalSearchBarProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSearchSubmit?: (q: string) => void;
}

export const UniversalSearchBar: React.FC<UniversalSearchBarProps> = ({
  placeholder = "Search products, shops, services...",
  className = "",
  inputClassName = "",
  onSearchSubmit,
}) => {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UniversalSearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'shops'>('all');

  // Debounced Universal Search as user types
  useEffect(() => {
    const cleanQ = query.trim();
    if (!cleanQ || cleanQ.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchService.universalSearch(cleanQ, 6);
        setResults(res);
      } catch (err) {
        console.error('Universal search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(clean);
    } else {
      navigate(`/search?q=${encodeURIComponent(clean)}`);
    }
  };

  const handleOpenAiShopper = (customQuery?: string) => {
    setIsOpen(false);
    const q = (customQuery !== undefined ? customQuery : query).trim();
    navigate(`/ai-shopper${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  const hasProducts = results && results.products.length > 0;
  const hasShops = results && results.shops.length > 0;
  const hasCategories = results && results.categories.length > 0;
  const hasAnyResults = hasProducts || hasShops || hasCategories;

  return (
    <>
      <div ref={wrapperRef} className={`relative w-full ${className}`}>
        <form onSubmit={handleSubmit} className="relative w-full flex items-center">
          {/* Left search icon */}
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400 shrink-0 pointer-events-none" />

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full h-11 sm:h-12 pl-11 sm:pl-12 pr-24 sm:pr-28 rounded-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white text-xs sm:text-sm font-medium placeholder:text-gray-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0078E8] dark:focus:ring-sky-500 focus:border-transparent transition-all ${inputClassName}`}
          />

          {/* Right Suffix: Clear and AI Shopper Chip */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults(null);
                  inputRef.current?.focus();
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 transition-colors"
                aria-label="Clear query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* AI Shopper Trigger Pill */}
            <button
              type="button"
              onClick={() => handleOpenAiShopper()}
              className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-full bg-[#00BFFF] hover:bg-[#02CCFE] text-white text-[10px] sm:text-xs font-extrabold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
              title="Open Suqafuran AI Shopper"
            >
              <Sparkles className="w-3 h-3 text-white" />
              <span className="hidden sm:inline">AI Shopper</span>
            </button>
          </div>
        </form>

        {/* Live Universal Search Dropdown */}
        {isOpen && query.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-[70] max-h-[80vh] flex flex-col transition-all">
            {/* Filter Tabs Header */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50/70 dark:bg-neutral-850">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    activeTab === 'all' 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900' 
                      : 'text-gray-500 dark:text-neutral-400 hover:bg-slate-200/60 dark:hover:bg-neutral-800'
                  }`}
                >
                  All Results
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    activeTab === 'products' 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900' 
                      : 'text-gray-500 dark:text-neutral-400 hover:bg-slate-200/60 dark:hover:bg-neutral-800'
                  }`}
                >
                  Products ({results?.products.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shops')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    activeTab === 'shops' 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900' 
                      : 'text-gray-500 dark:text-neutral-400 hover:bg-slate-200/60 dark:hover:bg-neutral-800'
                  }`}
                >
                  Shops ({results?.shops.length || 0})
                </button>
              </div>

              {loading && <Loader2 className="w-4 h-4 text-[#0078E8] animate-spin" />}
            </div>

            {/* AI Shopper Banner Prompt */}
            <div 
              onClick={() => handleOpenAiShopper()}
              className="mx-3 mt-3 p-3 rounded-2xl bg-[#00BFFF]/10 dark:bg-neutral-800 border border-[#00BFFF]/30 dark:border-neutral-700 flex items-center justify-between cursor-pointer group hover:border-[#00BFFF] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-[#00BFFF] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    Ask AI Shopper: "{query}"
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-neutral-400 truncate">
                    Extracts budget, best sellers & formats directed inquiry for chat
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#00BFFF] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Content Results */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Categories Pills */}
              {hasCategories && (activeTab === 'all') && (
                <div className="space-y-1.5 px-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    Categories
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {results!.categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/search?category=${cat.id}`);
                        }}
                        className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1 transition-colors"
                      >
                        <Tag className="w-3 h-3 text-[#0078E8]" />
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {hasProducts && (activeTab === 'all' || activeTab === 'products') && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
                    Matching Products
                  </p>
                  <div className="space-y-1">
                    {results!.products.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/listing/${prod.id}`);
                        }}
                        className="p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-800 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={optimizeCloudinaryUrl(prod.image, { width: 80 }) || prod.image || '/icon1.png'}
                            alt={prod.title}
                            className="w-11 h-11 rounded-xl object-cover bg-slate-100 dark:bg-neutral-800 shrink-0 border border-slate-100 dark:border-neutral-800"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-[#0078E8] transition-colors">
                              {prod.title}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                              <span className="font-semibold truncate">{prod.seller_name}</span>
                              {prod.is_verified && (
                                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                              )}
                              <span>•</span>
                              <span className="truncate">{prod.location}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                          KSh {prod.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Shops Section */}
              {hasShops && (activeTab === 'all' || activeTab === 'shops') && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
                    Verified Shops & Dealers
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results!.shops.map((shop) => (
                      <div
                        key={shop.id}
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/shop/${shop.slug}`);
                        }}
                        className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-neutral-850 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {shop.avatar_url ? (
                            <img
                              src={shop.avatar_url}
                              alt={shop.name}
                              className="w-9 h-9 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {shop.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h6 className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center gap-1">
                              <span>{shop.name}</span>
                              {shop.is_verified && (
                                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                              )}
                            </h6>
                            <p className="text-[10px] text-gray-400 truncate flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{shop.location}</span>
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && !hasAnyResults && (
                <div className="py-8 text-center text-xs text-gray-400">
                  No instant matches for "{query}". Press Enter or Ask AI to scan all listings.
                </div>
              )}
            </div>

            {/* Dropdown Bottom Bar */}
            <div className="p-3 border-t border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-medium">
                Press <strong className="text-slate-700 dark:text-neutral-300">Enter</strong> to view all results
              </span>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="text-xs font-black text-[#0078E8] hover:underline flex items-center gap-1"
              >
                <span>Search all results</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

