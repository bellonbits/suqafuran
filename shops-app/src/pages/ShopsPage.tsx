"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Store, MapPin, Package, X, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import { listingsService, PublicShop } from '@/services/listings';
import api from '@/services/api';
import { useLocationStore } from '@/store/useLocation';
import { MARKET_TO_CITY } from '@/constants/markets';
import { HomepageBannerRotation } from '@/components/ads/HomepageBannerRotation';
import { GlovoShopCard } from '@/components/shared/GlovoShopCard';
import { getCategoryStickerIcon } from '@/lib/categoryIcons';

interface Category {
  id: number;
  name_en: string;
  name_so?: string;
  slug: string;
  icon_name?: string;
  image_url?: string;
  active_listing_count?: number;
}

// Helper function to build category breadcrumb path
function getCategoryBreadcrumb(category: Category): string {
  // If category has a slug with multiple parts, split them
  if (category.slug && category.slug.includes('-')) {
    const parts = category.slug.split('-').map(p => 
      p.charAt(0).toUpperCase() + p.slice(1)
    );
    return parts.join(' > ');
  }
  // Otherwise just use the category name
  return category.name_en || 'Products';
}


// ─── Skeleton Card ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/7] w-full bg-gray-200 dark:bg-neutral-900 rounded-lg" />
      <div className="mt-2.5 space-y-1.5 px-0.5">
        <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 dark:bg-neutral-900 rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const SHOPS_PER_PAGE = 20;

function ShopsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { city } = useLocationStore();

  const [shops, setShops] = useState<PublicShop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [shopCountsByCategory, setShopCountsByCategory] = useState<Record<string, number>>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const categoryParam = searchParams.get('category');

  // Show scroll-to-top button after scrolling 300px
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Change page and scroll to shops grid
  const goToPage = (pg: number) => {
    setPage(pg);
    const shopsSection = document.querySelector('[data-shops-grid]');
    if (shopsSection) {
      shopsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load categories once at startup
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await listingsService.getCategories();
        setCategories(cats || []);

        // Fetch shop counts per category
        try {
          const countsResponse = await api.get('/listings/categories/stats/shop-counts');
          setShopCountsByCategory(countsResponse.data || {});
        } catch (err) {
          console.warn('Failed to load shop counts:', err);
        }

        // If category param is provided, find matching category ID and select it
        if (categoryParam && cats && cats.length > 0) {
          const categorySlug = decodeURIComponent(categoryParam);
          const matchedCat = cats.find(c =>
            c.slug === categorySlug ||
            c.name_en?.toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase()
          );
          if (matchedCat) {
            setSelectedCategoryId(matchedCat.id);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, [categoryParam]);

  // Reset to page 1 on search, category, or market filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategoryId, selectedMarket]);

  const fetchShops = useCallback(async (opts?: { silent?: boolean }) => {
    // Clear browser cache to get fresh banners
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('banner') || key.includes('shop')) {
          localStorage.removeItem(key);
        }
      });
    }
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const result = await listingsService.getShops({
        skip: (page - 1) * SHOPS_PER_PAGE,
        limit: SHOPS_PER_PAGE,
        search: debouncedSearch || undefined,
        category_id: selectedCategoryId || undefined,
        _t: Date.now(),
      });

      // Filter shops by selected market (optional)
      let filteredShops = result.shops || [];
      if (selectedMarket) {
        filteredShops = filteredShops.filter(shop =>
          shop.market === selectedMarket
        );
      }

      setShops(filteredShops);
      // Use API total for pagination, not filtered count
      setTotal(result.total || filteredShops.length);
    } catch (err: any) {
      console.error('Failed to fetch shops:', err);
      if (!opts?.silent) {
        setError('Failed to load shops. Please try again.');
        setShops([]);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategoryId, selectedMarket]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Live rotation: the backend reshuffles shop order every 10s (see
  // rotation_seed in GET /shops). Poll quietly on the first page so the
  // grid actually reflects that while the page is open, instead of only
  // rotating on a fresh page load. Skipped past page 1 so it doesn't yank
  // items out from under someone actively paging through results.
  useEffect(() => {
    if (page !== 1) return;
    const intervalId = setInterval(() => {
      fetchShops({ silent: true });
    }, 10000);
    return () => clearInterval(intervalId);
  }, [page, fetchShops]);

  const totalPages = Math.ceil(total / SHOPS_PER_PAGE);

  // Get all active categories, ordered most-shops-first so the categories
  // buyers are actually browsing surface before niche ones.
  const activeCategories = categories
    .filter(cat => (cat.active_listing_count ?? 0) > 0)
    .sort((a, b) => (shopCountsByCategory[b.id] ?? 0) - (shopCountsByCategory[a.id] ?? 0));

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-20">
      {/* ── Hero Banner Carousel ───────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        <HomepageBannerRotation />
      </div>

      {/* ── Page Title ─────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-2 md:pb-4">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Shops</h1>
        <p className="hidden md:block text-gray-600 dark:text-neutral-300 text-sm font-semibold mt-1">
          {total} shops in {selectedMarket || "All Markets"}
        </p>
      </div>

      {/* ── Search & Filter Row ─────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pb-4 md:pb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box - Full width on mobile, flex-1 on desktop */}
          <div className="relative flex-1 px-3 py-2.5 rounded-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-6 bg-transparent text-sm focus:outline-none placeholder:text-gray-500 text-gray-900 dark:text-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Market Filter Dropdown - Full width on mobile, w-64 on desktop */}
          <select
            value={selectedMarket || ''}
            onChange={(e) => setSelectedMarket(e.target.value || null)}
            className="w-full sm:w-64 px-3 py-2.5 rounded-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer truncate"
          >
            <option value="">All Markets</option>
            {Object.keys(MARKET_TO_CITY).sort().map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Category Stickers ───────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="w-full overflow-x-auto overscroll-x-contain hide-scrollbar">
          <div className="flex flex-row flex-nowrap items-start gap-4 pb-2 pt-0 min-w-max">

            {/* ALL STICKER */}
            <div
              onClick={() => setSelectedCategoryId(null)}
              className="flex flex-col items-center shrink-0 cursor-pointer group"
            >
              <div
                className={`relative w-16 h-16 flex items-center justify-center transition-all duration-200 ${
                  selectedCategoryId === null ? 'scale-105' : ''
                }`}
              >
                {/* fork.png circular plate background */}
                <img
                  src="/icons/fork.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
                {/* all-shops illustration */}
                <img
                  src="/icons/all-shops.png"
                  alt="All Shops"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/icons/shelves.png'; }}
                  className="relative z-10 w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <span className={`text-[12px] font-bold mt-2 tracking-tight text-center w-20 leading-tight block ${
                selectedCategoryId === null ? 'text-orange-500' : 'text-gray-700 dark:text-neutral-200'
              }`}>
                All
              </span>
            </div>

            {/* DYNAMIC STICKERS — only categories with active listings */}
            {activeCategories.map(cat => {
              const icon = getCategoryStickerIcon(cat.slug);
              const isSelected = selectedCategoryId === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="flex flex-col items-center shrink-0 cursor-pointer group"
                >
                  <div
                    className={`relative w-16 h-16 flex items-center justify-center transition-all duration-200 ${
                      isSelected ? 'scale-105' : ''
                    }`}
                  >
                    {/* fork.png circular plate background */}
                    <img
                      src="/icons/fork.png"
                      alt=""
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                    <img
                      src={icon}
                      alt={cat.name_en}
                      className="relative z-10 w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <span className={`text-[12px] font-bold mt-2 tracking-tight text-center w-20 leading-tight block ${
                    isSelected ? 'text-orange-500' : 'text-gray-700 dark:text-neutral-200'
                  }`}>
                    {cat.name_en}
                  </span>
                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* ── Stores Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8" data-shops-grid>
        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center mb-6">
            <p className="text-red-600 dark:text-red-400 text-sm font-semibold">{error}</p>
            <button
              onClick={fetchShops}
              className="mt-3 text-sm font-extrabold text-red-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Grid Container — 4 cols on lg+, 3 on md, 2 on sm */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-neutral-950/40 rounded-2xl p-8 border border-dashed border-gray-200 dark:border-neutral-800">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No shops here yet</h3>
            <p className="text-gray-500 dark:text-neutral-300 text-sm mt-1 max-w-sm mx-auto">
              There are no verified shops under this category with active listings at the moment.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {shops.map((shop, i) => (
                <GlovoShopCard key={shop.id} shop={shop} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 mb-4">
                <button
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-neutral-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pg = totalPages <= 7
                    ? i + 1
                    : page <= 4 ? i + 1
                    : page >= totalPages - 3 ? totalPages - 6 + i
                    : page - 3 + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => goToPage(pg)}
                      className={`w-9 h-9 rounded-full text-sm font-black transition-all ${
                        page === pg
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-neutral-950'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-neutral-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scroll-to-top FAB — appears after scrolling 300px */}
            {showScrollTop && (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
                className="fixed right-4 z-40 w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-lg flex items-center justify-center transition-all duration-200"
                aria-label="Scroll to top"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Export wrapper ───────────────────────────────────────────────────────────
export default function ShopsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShopsPageContent />
    </Suspense>
  );
}
