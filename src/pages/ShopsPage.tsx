import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '../layouts/PublicLayout';
import { sellerService, Seller } from '../services/sellerService';
import { businessService } from '../services/businessService';
import { getImageUrl } from '../utils/imageUtils';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useLocationStore } from '../store/useLocationStore';
import {
  Search,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Star,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Grid3x3,
  List,
  Sparkles,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { cn } from '../utils/cn';

const SORT_OPTIONS = [
  { id: 'rating-desc', label: 'Highest Rated', icon: Star },
  { id: 'reviews-desc', label: 'Most Reviews', icon: TrendingUp },
  { id: 'distance-asc', label: 'Nearest', icon: MapPin },
  { id: 'name-asc', label: 'A to Z', icon: null },
];

interface ShopWithDistance extends Seller {
  distance_km?: number;
}

// Skeleton loader
const SkeletonShopCard = () => (
  <div className="bg-white rounded-3xl overflow-hidden border border-sky-100 shadow-sm animate-pulse">
    <div className="aspect-video bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="flex gap-2">
        <div className="h-3 bg-gray-100 rounded w-1/4" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  </div>
);

const ShopsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lat, lng } = useLocationStore();

  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating-desc');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Scroll position memory
  useScrollPosition('shops-page', []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sortBy !== 'rating-desc') params.set('sort', sortBy);
    if (selectedCategory) params.set('category', selectedCategory);
    setSearchParams(params);
  }, [debouncedSearch, sortBy, selectedCategory, setSearchParams]);

  // Fetch sellers
  const { data: sellers = [], isLoading, error } = useQuery({
    queryKey: ['sellers', debouncedSearch, selectedCategory],
    queryFn: async () => {
      const sellers = await sellerService.getSellers({
        limit: 50,
        search: debouncedSearch || undefined,
      });
      return sellers;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch nearby shops for featured section
  const { data: nearbyShops = [] } = useQuery({
    queryKey: ['nearby-shops', lat, lng],
    queryFn: async () => {
      if (!lat || !lng) return [];
      const shops = await businessService.getNearbyShops({
        lat,
        lng,
        limit: 6,
      });
      return shops;
    },
    enabled: !!lat && !!lng,
    staleTime: 10 * 60 * 1000,
  });

  // Get unique categories from sellers
  const categories = useMemo(() => {
    const cats = new Set(sellers.map(s => s.trust_level).filter(Boolean));
    return Array.from(cats).sort();
  }, [sellers]);

  // Filter shops
  const filteredShops = useMemo(() => {
    let filtered = sellers;

    if (selectedCategory) {
      filtered = filtered.filter(s => s.trust_level === selectedCategory);
    }

    return filtered;
  }, [sellers, selectedCategory]);

  // Sort shops
  const sortedShops = useMemo(() => {
    const shops = [...filteredShops];

    switch (sortBy) {
      case 'rating-desc':
        return shops.sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0));

      case 'reviews-desc':
        return shops.sort((a, b) => (b.listings_count || 0) - (a.listings_count || 0));

      case 'distance-asc':
        return shops.sort((a, b) => {
          const distA = (a as ShopWithDistance).distance_km || Infinity;
          const distB = (b as ShopWithDistance).distance_km || Infinity;
          return distA - distB;
        });

      case 'name-asc':
        return shops.sort((a, b) => (a.business_name || '').localeCompare(b.business_name || ''));

      default:
        return shops;
    }
  }, [filteredShops, sortBy]);

  // Featured shops (verified + high rating)
  const featuredShops = useMemo(() => {
    return sellers
      .filter(s => s.is_verified && (s.trust_score || 0) >= 4.5)
      .sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0))
      .slice(0, 6);
  }, [sellers]);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
        {/* Header with back button and title */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                Browse Shops
              </h1>
              <div className="w-12" />
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search shops by name, category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-sky-50 border border-sky-200 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Controls: Sort, Filter, View Mode */}
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter button (mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'md:hidden flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all',
              showFilters
                ? 'bg-sky-100 text-sky-700 border border-sky-300'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-sky-100 text-sky-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
              title="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-sky-100 text-sky-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Results count */}
          <span className="text-sm text-slate-500 font-medium">
            {sortedShops.length} shop{sortedShops.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Mobile Filters Drawer */}
          {showFilters && (
            <div className="md:hidden mb-6 bg-white rounded-2xl border border-sky-100 p-4 space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter by Category
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium',
                      !selectedCategory
                        ? 'bg-sky-100 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium capitalize',
                        selectedCategory === cat
                          ? 'bg-sky-100 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar + Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Desktop Filters Sidebar */}
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl border border-sky-100 p-4 sticky top-24">
                <h3 className="font-bold text-slate-900 mb-4">Filter</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium',
                      !selectedCategory
                        ? 'bg-sky-100 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium capitalize',
                        selectedCategory === cat
                          ? 'bg-sky-100 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              {/* Featured Shops Section */}
              {!debouncedSearch && featuredShops.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Featured Shops
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
                    {featuredShops.map(shop => (
                      <ShopCard key={shop.id} shop={shop} />
                    ))}
                  </div>
                  <div className="border-b-2 border-dashed border-sky-100 mb-8" />
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonShopCard key={i} />
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="font-bold text-red-900 mb-2">Error Loading Shops</h3>
                  <p className="text-red-700 text-sm mb-4">
                    We had trouble loading shops. Please try again.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && sortedShops.length === 0 && (
                <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-sky-100">
                  <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2">
                    No Shops Found
                  </h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    {debouncedSearch
                      ? `No shops match your search for "${debouncedSearch}". Try a different search term.`
                      : 'No shops available in this category. Please try another filter.'}
                  </p>
                </div>
              )}

              {/* Shops Grid/List */}
              {!isLoading && !error && sortedShops.length > 0 && (
                <div
                  className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                      : 'space-y-3'
                  )}
                >
                  {sortedShops.map(shop => (
                    <div key={shop.id}>
                      {viewMode === 'grid' ? (
                        <ShopCard shop={shop} />
                      ) : (
                        <ShopListItem shop={shop} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

interface ShopCardProps {
  shop: Seller;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <Link
      to={`/seller/${shop.id}`}
      className="group bg-white rounded-3xl overflow-hidden border border-sky-100 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col h-full"
    >
      {/* Banner/Image */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-sky-50 to-blue-50 overflow-hidden">
        {shop.shop_page_banner ? (
          <img
            src={getImageUrl(shop.shop_page_banner)}
            alt={shop.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100">
            <span className="text-4xl font-black text-sky-300 opacity-50">
              {shop.business_name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
        {/* Featured badge */}
        {shop.is_featured && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
            ⭐ Featured
          </div>
        )}
        {/* Verified badge */}
        {shop.is_verified && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full shadow-md flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-tight">
            {shop.business_name}
          </h3>

          {/* Rating */}
          {shop.trust_score > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3.5 w-3.5',
                      i < Math.round(shop.trust_score)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">
                {shop.trust_score.toFixed(1)}
              </span>
            </div>
          )}

          {/* Location */}
          {shop.location && (
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{shop.location}</span>
            </div>
          )}

          {/* Listings count */}
          <div className="text-xs text-slate-500 mt-2 font-medium">
            {shop.listings_count || 0} listing{(shop.listings_count || 0) !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-sky-100">
          <button className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg transition-colors">
            View Shop
          </button>
        </div>
      </div>
    </Link>
  );
};

const ShopListItem: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <Link
      to={`/seller/${shop.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-sky-100 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all duration-300 flex items-center p-4 gap-4"
    >
      {/* Avatar/Logo */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 overflow-hidden shrink-0 flex items-center justify-center">
        {shop.avatar_url ? (
          <img
            src={getImageUrl(shop.avatar_url)}
            alt={shop.business_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-black text-sky-300">
            {shop.business_name?.charAt(0)?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
            {shop.business_name}
          </h3>
          {shop.is_verified && (
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600">
          {/* Rating */}
          {shop.trust_score > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3 w-3',
                      i < Math.round(shop.trust_score)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-bold">{shop.trust_score.toFixed(1)}</span>
            </div>
          )}

          {/* Listings */}
          {shop.listings_count > 0 && (
            <span className="text-xs font-medium">
              {shop.listings_count} listings
            </span>
          )}

          {/* Location */}
          {shop.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="text-xs line-clamp-1">{shop.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0">
        <button className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors">
          View
        </button>
      </div>
    </Link>
  );
};

export { ShopsPage };
