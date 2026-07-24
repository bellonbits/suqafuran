"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api, { resolveMediaUrl, optimizeCloudinaryUrl } from '../../../../services/api';
import { listingsService } from '../../../../services/listings';
import {
  ChevronRight, Star, MapPin, Edit, Settings, Phone, Mail, Clock, Heart, Share2, MessageCircle,
  Plus, Minus, ShoppingBag, X, Loader, Package, CheckCircle, Filter, Search
} from 'lucide-react';
import { useAuthStore } from '../../../../store/useAuth';
import { useCart } from '../../../../store/useCart';

interface ShopProfile {
  id: string;
  user_id: string;
  shop_name: string;
  description: string;
  phone: string;
  email: string;
  logo_url?: string;
  banner_url?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  operating_hours?: Array<{
    day: string;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }>;
  categories?: number[];
  return_policy?: string;
  delivery_policy?: string;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  follower_count?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
  helpful_count?: number;
}

interface Listing {
  id: string | number;
  title_en: string;
  price: number;
  images: string[];
  category_id: number;
}

export default function PublicShopPage() {
  const params = useParams();
  const router = useRouter();
  const shopSlug = params.slug as string;
  const { user, isAuthenticated } = useAuthStore();
  const [isAdminOrAgent, setIsAdminOrAgent] = useState(false);

  const [shopData, setShopData] = useState<ShopProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about'>('products');
  const [followed, setFollowed] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Listing | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [favorites, setFavorites] = useState<Set<string | number>>(new Set());

  const { addItem } = useCart();
  const cartItems = useCart((state) => state.items);

  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    return listings.filter((product) => {
      const matchesSearch = !searchQuery ||
        product.title_en.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      return matchesSearch && matchesPrice && matchesCategory;
    });
  }, [listings, searchQuery, selectedCategory, priceRange]);

  const getCartQuantity = (productId: string) => {
    return cartItems.find((item) => item.id === String(productId))?.quantity || 0;
  };

  useEffect(() => {
    fetchShopData();
  }, [shopSlug]);

  useEffect(() => {
    // Check if current user is admin or agent
    if (isAuthenticated && user) {
      const checkAdminAgent = async () => {
        try {
          const userEmail = user.email || '';
          if (userEmail.includes('admin') || userEmail.includes('agent')) {
            setIsAdminOrAgent(true);
          }
        } catch (error) {
          setIsAdminOrAgent(false);
        }
      };
      checkAdminAgent();
    }
  }, [isAuthenticated, user]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      let shopProfile: any = null;

      // Fetch shop by slug (more efficient than fetching all shops)
      try {
        const shopRes = await api.get(`/listings/shops/${shopSlug}`);
        const shop = shopRes.data;

        if (!shop) {
          setLoading(false);
          return;
        }

        shopProfile = shop;

        setShopData({
          id: shop.id,
          user_id: shop.user_id,
          shop_name: shop.shop_name,
          description: shop.description || '',
          phone: shop.phone || '',
          email: shop.email || '',
          logo_url: shop.logo_url,
          banner_url: shop.banner_url,
          address: shop.address,
          latitude: shop.latitude,
          longitude: shop.longitude,
          city: shop.city,
          operating_hours: shop.operating_hours,
          categories: shop.categories,
          return_policy: shop.return_policy,
          delivery_policy: shop.delivery_policy,
          is_verified: shop.is_verified,
          rating: shop.rating,
          review_count: shop.review_count || 0,
          follower_count: shop.follower_count || 0,
        });
      } catch (err) {
        // Fallback: fetch from listings/shops with slug search
        const shopsRes = await api.get('/listings/shops', {
          params: { limit: 100, skip: 0 }
        });

        const shop = (shopsRes.data.shops || []).find((s: any) =>
          s.slug?.toLowerCase() === shopSlug.toLowerCase()
        );

        if (!shop) {
          setLoading(false);
          return;
        }

        shopProfile = shop;
        setShopData({
          id: shop.id,
          user_id: shop.user_id,
          shop_name: shop.shop_name,
          description: shop.description || '',
          phone: shop.phone || '',
          email: shop.email || '',
          is_verified: shop.is_verified,
          rating: shop.rating,
          review_count: shop.review_count || 0,
          follower_count: shop.follower_count || 0,
        });
      }

      // Fetch products
      const listingsRes = await listingsService.getListings({
        owner_id: Number(shopProfile.user_id),
        limit: 200
      });
      setListings(listingsRes || []);

      // Fetch reviews from backend
      try {
        const reviewsRes = await api.get(`/shops/${shopProfile.id}/reviews`);
        setReviews(reviewsRes.data || []);
      } catch {
        setReviews([]);
      }

      setIsOpen(isShopOpen(shopProfile?.operating_hours || []));
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isShopOpen = (hours: any[] | undefined) => {
    if (!hours || hours.length === 0) return true;
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    const todayHours = hours.find((h) => h.day === dayName);
    if (!todayHours || todayHours.is_closed) return false;

    return currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: shopData?.shop_name,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleContact = (type: 'whatsapp' | 'phone' | 'email') => {
    if (type === 'whatsapp' && shopData?.phone) {
      window.open(`https://wa.me/${shopData.phone.replace(/\D/g, '')}`);
    } else if (type === 'phone' && shopData?.phone) {
      window.location.href = `tel:${shopData.phone}`;
    } else if (type === 'email' && shopData?.email) {
      window.location.href = `mailto:${shopData.email}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (!shopData) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Shop Not Found</h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            The shop you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const shopInitial = shopData.shop_name?.[0]?.toUpperCase() || 'S';

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* Breadcrumbs */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3.5 flex items-center gap-2 text-xs font-semibold">
          <button onClick={() => router.push('/')} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-900 dark:text-white truncate">{shopData.shop_name}</span>
        </div>
      </div>

      {/* Hero Section with Banner and Logo */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Banner */}
        <div className="relative bg-gradient-to-br from-orange-100 to-orange-50 dark:from-slate-800 dark:to-slate-900 h-48 md:h-64 rounded-2xl overflow-hidden mb-8 shadow-sm border border-gray-100 dark:border-slate-800">
          {shopData.banner_url ? (
            <img
              src={optimizeCloudinaryUrl(shopData.banner_url, { width: 1920, quality: 'auto' }) || shopData.banner_url}
              alt={shopData.shop_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-500" />
          )}

          {/* Logo Overlay */}
          <div className="absolute bottom-4 left-6 w-20 h-20 rounded-full bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-700 shadow-lg flex items-center justify-center overflow-hidden">
            {shopData.logo_url ? (
              <img src={shopData.logo_url} alt={shopData.shop_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-2xl">
                {shopInitial}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setFollowed(!followed)}
              className={`p-2 rounded-full shadow-sm transition-all ${
                followed
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                  : 'bg-white/90 dark:bg-slate-900/90 text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              <Heart className={`w-5 h-5 ${followed ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-gray-600 dark:text-slate-400 hover:text-gray-900 shadow-sm transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shop Info Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white">
                  {shopData.shop_name}
                </h1>
                {isAdminOrAgent && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/seller-dashboard/shop`)}
                      className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30 font-semibold text-sm flex items-center gap-1 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Shop
                    </button>
                    <button
                      onClick={() => router.push(`/seller-dashboard/products?add=true`)}
                      className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 font-semibold text-sm flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </button>
                    <button
                      onClick={() => router.push(`/seller-dashboard`)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Manage
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {shopData.is_verified && (
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
                {shopData.rating !== undefined && (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(shopData.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">
                      {shopData.rating?.toFixed(1)} ({shopData.review_count} reviews)
                    </span>
                  </div>
                )}
                {shopData.city && (
                  <span className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {shopData.city}
                  </span>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                isOpen
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-[#02CCFE]' : 'bg-red-600'}`} />
                {isOpen ? 'Open now' : 'Closed'}
              </div>
            </div>
          </div>

          {shopData.description && (
            <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed max-w-2xl mb-4">
              {shopData.description}
            </p>
          )}

          {/* Quick Actions - Contact Seller */}
          <div className="bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-6 border-2 border-orange-200 dark:border-orange-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">💬 Contact this seller:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleContact('whatsapp')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#02CCFE] hover:bg-[#02CCFE] text-white rounded-full font-bold text-sm transition-all hover:scale-105 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={() => handleContact('phone')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold text-sm transition-all hover:scale-105 shadow-md"
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
              <button
                onClick={() => handleContact('email')}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-bold text-sm transition-all hover:scale-105 shadow-md"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => router.push('/messages')}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold text-sm transition-all hover:scale-105 shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            </div>
          </div>
        </div>

        {/* Marketplace Filters Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-600"
            />
          </div>

          {/* Category Filter Bar - Horizontal Scroll */}
          {shopData.categories && shopData.categories.length > 0 && (
            <div className="overflow-x-auto pb-2 -mx-4 px-4">
              <div className="flex gap-2 w-max">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                    selectedCategory === null
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200'
                  }`}
                >
                  All Products
                </button>
                {shopData.categories.map((catId) => (
                  <button
                    key={catId}
                    onClick={() => setSelectedCategory(catId)}
                    className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                      selectedCategory === catId
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200'
                    }`}
                  >
                    Category {catId}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Row */}
          <div className="flex gap-3 items-center">
            {/* Search Box - Pill Shape */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-12 pr-10 py-2.5 rounded-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-500 text-gray-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters Button - Pill Shape */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                showFilters
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters Drawer */}
        {showFilters && (
          <div className="mb-6 p-5 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Price Range</label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                    placeholder="Min price"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="text-gray-400">—</div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 100000 })}
                    placeholder="Max price"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800 mb-8 overflow-x-auto">
          {[
            { id: 'products' as const, label: 'Products', count: listings.length },
            { id: 'reviews' as const, label: 'Reviews', count: shopData.review_count },
            { id: 'about' as const, label: 'About' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400'
                  : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label} {tab.count !== undefined && tab.count > 0 && <span className="text-xs ml-1">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              {listings.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No products yet</h3>
                  <p className="text-gray-600 dark:text-slate-400">This shop hasn't listed any products yet.</p>
                </div>
              ) : (
                <div>
                  {/* Filtered Products Grid */}
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                      <Package className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No products found</h3>
                      <p className="text-gray-600 dark:text-slate-400">Try adjusting your filters or search.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-full min-w-0 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                        {filteredProducts.map((product) => {
                        const cartQty = getCartQuantity(String(product.id));
                        const isFavorite = favorites.has(product.id);
                        return (
                          <div
                            key={product.id}
                            className="group"
                          >
                            <div className="relative bg-gray-100 dark:bg-slate-900/60 aspect-square rounded-lg overflow-hidden mb-3 flex items-center justify-center border border-gray-200 dark:border-slate-800 group-hover:shadow-md transition-shadow">
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.title_en}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <ShoppingBag className="w-6 h-6 text-gray-300" />
                              )}

                              {/* Favorite Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newFavorites = new Set(favorites);
                                  if (isFavorite) {
                                    newFavorites.delete(product.id);
                                  } else {
                                    newFavorites.add(product.id);
                                  }
                                  setFavorites(newFavorites);
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md hover:scale-110 active:scale-95 flex items-center justify-center transition-all border border-gray-200 dark:border-slate-800"
                              >
                                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                              </button>

                              {/* Add to Cart Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addItem({
                                    owner_id: shopData.user_id,
                                    id: String(product.id),
                                    title: product.title_en,
                                    price: product.price,
                                    image: product.images?.[0],
                                    quantity: cartQty + 1
                                  });
                                }}
                                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 text-green-600 shadow-md hover:scale-105 active:scale-95 flex items-center justify-center transition-all border border-gray-200 dark:border-slate-800"
                              >
                                {cartQty > 0 ? (
                                  <span className="text-xs font-black text-gray-900 dark:text-white">{cartQty}</span>
                                ) : (
                                  <Plus className="w-4 h-4 stroke-[3]" />
                                )}
                              </button>
                            </div>

                            {/* Product Info */}
                            <div
                              onClick={() => {
                                setSelectedProduct(product);
                                setModalQuantity(cartQty || 1);
                              }}
                              className="cursor-pointer"
                            >
                              <h3 className="font-semibold text-gray-900 dark:text-white text-xs leading-normal line-clamp-2 min-h-[32px] group-hover:text-orange-600 transition-colors">
                                {product.title_en}
                              </h3>
                              <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                                {product.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center py-16">
                  <Star className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No reviews yet</h3>
                  <p className="text-gray-600 dark:text-slate-400">Be the first to review this shop!</p>
                </div>
              ) : (
                <div className="space-y-4 pb-20">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{review.reviewer_name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-slate-300 text-sm mb-3">{review.comment}</p>
                      {review.helpful_count !== undefined && (
                        <button className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300">
                          👍 Helpful ({review.helpful_count})
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="pb-20">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  {shopData.description && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About</h3>
                      <p className="text-gray-700 dark:text-slate-300 leading-relaxed">{shopData.description}</p>
                    </div>
                  )}

                  {shopData.address && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Location</h3>
                      <p className="text-gray-700 dark:text-slate-300 flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        {shopData.address}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {shopData.operating_hours && shopData.operating_hours.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Operating Hours
                      </h3>
                      <div className="space-y-2">
                        {shopData.operating_hours.map((hours, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-700 dark:text-slate-300">
                            <span className="font-medium">{hours.day}</span>
                            <span>
                              {hours.is_closed
                                ? 'Closed'
                                : `${hours.open_time} - ${hours.close_time}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {shopData.return_policy && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Return Policy</h3>
                      <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{shopData.return_policy}</p>
                    </div>
                  )}

                  {shopData.delivery_policy && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Delivery Policy</h3>
                      <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{shopData.delivery_policy}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setSelectedProduct(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 z-10 border border-gray-200 dark:border-slate-800"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full border-2 border-orange-600 text-white bg-orange-600 hover:bg-orange-700 flex items-center justify-center transition-all"
              >
                <X className="w-6 h-6 stroke-[3]" />
              </button>

              <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-slate-950 rounded-2xl overflow-hidden mb-5 flex items-center justify-center border border-gray-200 dark:border-slate-800">
                {selectedProduct.images?.[0] ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.title_en}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-gray-300" />
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {selectedProduct.title_en}
                </h2>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    KSh {selectedProduct.price.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-center py-2">
                  <div className="flex items-center gap-4 bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-800">
                    <button
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-slate-400 transition-colors"
                    >
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <span className="text-lg font-black text-gray-900 dark:text-white min-w-[24px] text-center">
                      {modalQuantity}
                    </span>
                    <button
                      onClick={() => setModalQuantity((q) => q + 1)}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-orange-600 dark:text-orange-400 transition-colors"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    addItem({
                      owner_id: shopData.user_id,
                      id: String(selectedProduct.id),
                      title: selectedProduct.title_en,
                      price: selectedProduct.price,
                      image: selectedProduct.images?.[0],
                      quantity: modalQuantity
                    });
                    setSelectedProduct(null);
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 px-6 rounded-full transition-colors flex items-center justify-between text-sm shadow-md"
                >
                  <span>Add {modalQuantity} to order</span>
                  <span>KSh {(selectedProduct.price * modalQuantity).toLocaleString()}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
