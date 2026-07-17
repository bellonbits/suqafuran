"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, Store, MapPin, Star, Package, X, ChevronLeft, ChevronRight, Percent, ThumbsUp } from 'lucide-react';
import { listingsService, PublicShop } from '../../../services/listings';
import api, { resolveMediaUrl } from '../../../services/api';
import { useLocationStore } from '../../../store/useLocation';
import { MARKET_TO_CITY } from '../../../constants/markets';

interface Category {
  id: number;
  name_en: string;
  name_so?: string;
  slug: string;
  icon_name?: string;
  image_url?: string;
  active_listing_count?: number;
}

// ─── Category Stickers Icon Mapping ──────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  'food-groceries':      '/icons/fruits.png',
  'grocery':             '/icons/fruits.png',
  'agriculture-food':    '/icons/fruits.png',
  'health-beauty':       '/icons/beauty.png',
  'beauty-personal-care':'/icons/beauty.png',
  'leisure-sports':      '/icons/soccer-ball.png',
  'clothing-shoes':      '/icons/street-market.png',
  'electronics':         '/icons/keyboard.png',
  'household-items':     '/icons/households.png',
  'vehicles':            '/icons/classic-car.png',
  'livestock':           '/icons/cow.png',
  'property':            '/icons/for-rent.png',
  'services':            '/icons/24-hours-support.png',
  'commercial-equipment':'/icons/container.png',
  'land-farms':          '/icons/farm.png',
  'repair-construction': '/icons/repair.png',
  'jobs':                '/icons/job-search.png',
  'mobiles':             '/icons/mobile-app.png',
  'phones':              '/icons/mobile-app.png',
  'babies-kids':         '/icons/baby.png',
};

function getCategoryStickerIcon(slug: string): string {
  const normalized = slug.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }
  return '/icons/street-market.png';
}


function getShopBanner(shop: PublicShop): string | null {
  // Prioritize custom shop page banner (Cloudinary URL)
  if (shop.shop_page_banner && typeof shop.shop_page_banner === 'string') {
    if (shop.shop_page_banner.startsWith('http')) return shop.shop_page_banner;
    if (shop.shop_page_banner.startsWith('data:')) return shop.shop_page_banner;
    const resolved = resolveMediaUrl(shop.shop_page_banner);
    if (resolved) return resolved;
  }

  // Fallback to first listing image
  if (shop.cover_image && typeof shop.cover_image === 'string') {
    // If it's already a data URL (base64), use it directly
    if (shop.cover_image.startsWith('data:')) return shop.cover_image;
    // Otherwise resolve it
    const resolved = resolveMediaUrl(shop.cover_image);
    if (resolved) return resolved;
  }

  // No fallback — return null if no custom banner or cover image
  return null;
}

// ─── Glovo Shop Card ────────────────────────────────────────────────────
function GlovoShopCard({ shop, index }: { shop: PublicShop; index: number }) {
  const [imgError, setImgError] = useState(false);

  // Use banner from shop data (already included in main response)
  const banner = imgError ? null : getShopBanner(shop);
  const initial = shop.shop_name?.[0]?.toUpperCase() || 'S';

  // Use real data from API response
  const deliveryTime = shop.delivery_time || '15-30 min';
  const ratingPercent = shop.rating ? Math.round(shop.rating * 20) : 85;
  const reviewCount = 0; // No review count in API yet
  const isFreeDel = shop.free_delivery === true;
  const hasPromo = false; // No promo data in API yet
  const promoText = hasPromo ? '-10% some items' : null;
  const market = shop.market || 'Eastleigh Market';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.28, ease: 'easeOut' }}
    >
      <Link href={`/shops/${shop.slug}`} className="group block">

        {/* ─── Banner (16:9) ────────────────────────────────────── */}
        {/* Glovo uses rounded-lg (~8px) — not pill/2xl              */}
        <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
          {banner ? (
            <>
              <img
                src={banner}
                alt={shop.shop_name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                onError={() => setImgError(true)}
              />
              {/* Subtle dark gradient at bottom for logo legibility */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
            </>
          ) : (
            /* Placeholder when no banner */
            <div className="w-full h-full bg-gray-100 dark:bg-slate-800" />
          )}

          {/* Promo badge — top-left */}
          {promoText && (
            <div className="absolute top-2.5 left-2.5 bg-[#e81f44] text-white text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-0.5">
              <Percent className="w-2.5 h-2.5 stroke-[3]" />
              {promoText}
            </div>
          )}

          {/* Verified badge — top-right */}
          {shop.is_verified && (
            <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wide">
              VERIFIED
            </div>
          )}

          {/* Shop logo — INSIDE banner, bottom-left, Glovo-style circle (increased size) */}
          <div className="absolute bottom-2.5 left-3.5 w-14 h-14 rounded-full bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-700 shadow-md overflow-hidden flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-lg">
              {initial}
            </div>
          </div>
        </div>

        {/* ─── Details below banner ─────────────────────────────── */}
        <div className="mt-2.5 px-0.5">
          <h3 className="font-extrabold text-gray-900 dark:text-white text-[16px] leading-snug group-hover:text-orange-500 transition-colors truncate">
            {shop.shop_name}
          </h3>

          {/* Metrics row (delivery time and rating) */}
          <div className="flex items-center gap-2 mt-1.5 text-[13px] font-semibold text-gray-500 dark:text-slate-400 flex-nowrap overflow-hidden">
            {isFreeDel && (
              <>
                <span className="bg-[#ff1244] text-white text-[11px] uppercase font-black px-2 py-0.5 rounded shrink-0">
                  Free
                </span>
                <span className="text-gray-300 dark:text-slate-700 font-normal shrink-0">•</span>
              </>
            )}
            <span className="shrink-0 text-[12px] font-semibold">{deliveryTime}</span>
            <span className="text-gray-300 dark:text-slate-700 font-normal shrink-0">•</span>
            <div className="flex items-center gap-1 shrink-0 font-bold">
              <ThumbsUp className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
              <span className="truncate">{ratingPercent}%</span>
            </div>
          </div>

          {/* Market row (below metrics) */}
          <div className="mt-1 text-[12px] font-semibold text-gray-500 dark:text-slate-400">
            {market}
          </div>
        </div>

      </Link>
    </motion.div>
  );
}

// ─── Skeleton Card ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-slate-800 rounded-lg" />
      <div className="mt-2.5 space-y-1.5 px-0.5">
        <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const SHOPS_PER_PAGE = 24;

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
  const [page, setPage] = useState(1);
  const [shopCountsByCategory, setShopCountsByCategory] = useState<Record<string, number>>({});
  const categoryParam = searchParams.get('category');

  // Get markets for the selected city
  const getMarketsForCity = (cityName: string): string[] => {
    return Object.entries(MARKET_TO_CITY)
      .filter(([, c]) => c === cityName)
      .map(([market]) => market);
  };

  const selectedMarkets = city ? getMarketsForCity(city) : [];

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

  // Reset to page 1 on search or category filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategoryId]);

  const fetchShops = useCallback(async () => {
    // Clear browser cache to get fresh banners
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('banner') || key.includes('shop')) {
          localStorage.removeItem(key);
        }
      });
    }
    setLoading(true);
    setError(null);
    try {
      const result = await listingsService.getShops({
        skip: (page - 1) * SHOPS_PER_PAGE,
        limit: SHOPS_PER_PAGE,
        search: debouncedSearch || undefined,
        category_id: selectedCategoryId || undefined,
        _t: Date.now(),
      });

      // Filter shops by selected market
      let filteredShops = result.shops || [];
      if (selectedMarkets.length > 0) {
        filteredShops = filteredShops.filter(shop =>
          selectedMarkets.includes(shop.market || 'Eastleigh Market')
        );
      }

      setShops(filteredShops);
      setTotal(filteredShops.length);
    } catch (err: any) {
      console.error('Failed to fetch shops:', err);
      setError('Failed to load shops. Please try again.');
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategoryId, selectedMarkets]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const totalPages = Math.ceil(total / SHOPS_PER_PAGE);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
      {/* ── Header & Search ─────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 pt-4 pb-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Shops</h1>
            <p className="text-gray-500 dark:text-slate-400 text-xs font-semibold mt-0.5">
              {city || 'Select Location'} <span className="text-gray-300 dark:text-slate-800">/</span> Markets near you
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search shops..."
              className="w-full pl-10 pr-9 py-2 rounded-full bg-gray-100 dark:bg-slate-900 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-400 text-gray-900 dark:text-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      {/* ── Category Stickers ───────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto mt-3 px-4">
        <div className="w-full overflow-x-auto hide-scrollbar">
          <div className="flex flex-row flex-nowrap items-start gap-5 pb-3 pt-1">

            {/* ALL STICKER */}
            <div
              onClick={() => setSelectedCategoryId(null)}
              className="flex flex-col items-center shrink-0 cursor-pointer group"
            >
              <div
                className={`relative w-[80px] h-[80px] flex items-center justify-center transition-all duration-200 ${
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
                  className="relative z-10 w-12 h-12 object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <span className={`text-[13px] font-extrabold mt-2 tracking-tight text-center w-[80px] truncate block ${
                selectedCategoryId === null ? 'text-orange-500' : 'text-gray-700 dark:text-slate-300'
              }`}>
                All
              </span>
            </div>

            {/* DYNAMIC STICKERS — only categories with active listings */}
            {categories
              .filter(cat => (cat.active_listing_count ?? 0) > 0)
              .map(cat => {
              const icon = getCategoryStickerIcon(cat.slug);
              const isSelected = selectedCategoryId === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="flex flex-col items-center shrink-0 cursor-pointer group"
                >
                  <div
                    className={`relative w-[80px] h-[80px] flex items-center justify-center transition-all duration-200 ${
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
                      className="relative z-10 w-12 h-12 object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <span className={`text-[13px] font-extrabold mt-2 tracking-tight text-center w-[88px] truncate block ${
                    isSelected ? 'text-orange-500' : 'text-gray-700 dark:text-slate-300'
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
      <div className="max-w-screen-xl mx-auto px-4 mt-5">
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">
          {selectedCategoryId
            ? `${categories.find(c => c.id === selectedCategoryId)?.name_en || 'Filtered'} Markets`
            : 'All Markets'}
        </h2>

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

        {/* Grid Container — 5 cols on xl, 4 on lg, 3 on md, 2 on sm */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/40 rounded-3xl p-8 border border-dashed border-gray-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No shops here yet</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              There are no verified shops under this category with active listings at the moment.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
              {shops.map((shop, i) => (
                <GlovoShopCard key={shop.id} shop={shop} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                      onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-full text-sm font-black transition-all ${
                        page === pg
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
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
        <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShopsPageContent />
    </Suspense>
  );
}
