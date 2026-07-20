"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocationStore } from '../../../../store/useLocation';
import { LocationPickerModal } from '../../../../components/shared/LocationPickerModal';
import { listingsService } from '../../../../services/listings';
import api, { optimizeCloudinaryUrl, resolveMediaUrl } from '../../../../services/api';
import {
    ChevronRight, ChevronLeft, Star, Clock, MapPin, Plus, Minus, Search, ShoppingBag, X, Percent, ThumbsUp, Info, Heart, Filter, Phone, MessageCircle
} from 'lucide-react';
import { useCart } from '../../../../store/useCart';


// Deterministic mock product attributes helper (discount, hasPromo, etc.)
function getMockProductInfo(product: any) {
  const idNum = typeof product.id === 'number' ? product.id : (parseInt(String(product.id).slice(0, 4), 16) || 123);
  const discountPercent = 10 + (idNum % 4) * 5; // 10%, 15%, 20%, 25%
  const hasPromo = (idNum % 3) !== 0; // 66% of items have promo
  const originalPrice = hasPromo ? Math.round(product.price * (1 + discountPercent / 100)) : product.price;
  const promoText = hasPromo ? `-${discountPercent}%` : null;
  return { hasPromo, discountPercent, originalPrice, promoText };
}


// Helper: Build breadcrumb from full category hierarchy (Category > Subcategory > SubSubcategory)
function getCategoryPath(categoryId: number, subcategoryId: number | undefined, dbCategories: any[] = [], subsubcategoryId: number | undefined = undefined): string {
  if (!categoryId) return 'Products';
  
  // Find the category in dbCategories
  const category = dbCategories.find((c: any) => c.id === categoryId);
  if (!category) return `Category ${categoryId}`;
  
  const categoryName = category.name_en || `Category ${categoryId}`;
  
  // If subcategory_id is provided, find the subcategory name
  if (subcategoryId && category.subcategories) {
    const subcategory = category.subcategories.find((s: any) => s.id === subcategoryId);
    if (subcategory) {
      const subcategoryName = subcategory.name_en;
      
      // If sub-subcategory_id is provided, find the sub-subcategory name
      if (subsubcategoryId && subcategory.subsubcategories) {
        const subsubcategory = subcategory.subsubcategories.find((ss: any) => ss.id === subsubcategoryId);
        if (subsubcategory) {
          const subsubcategoryName = subsubcategory.name_en;
          return `${categoryName} > ${subcategoryName} > ${subsubcategoryName}`;
        }
      }
      
      return `${categoryName} > ${subcategoryName}`;
    }
  }
  
  return categoryName;
}

export default function ShopDetailPage() {
    const params = useParams();
    const router = useRouter();
    const shopSlug = params.slug as string;
    const { city } = useLocationStore();

    const [shopName, setShopName] = useState('');
    const [shopLogo, setShopLogo] = useState('');
    const [shopAvatar, setShopAvatar] = useState('');

    const [allListings, setAllListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(!city);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [expandedSubcategories, setExpandedSubcategories] = useState<Set<number>>(new Set());
    const [dbCategories, setDbCategories] = useState<any[]>([]);
    const [customBanner, setCustomBanner] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [modalQuantity, setModalQuantity] = useState(1);
    const [shopId, setShopId] = useState<string | null>(null);
    const [shopOwnerId, setShopOwnerId] = useState<string | number | null>(null);
    const [favorites, setFavorites] = useState<Set<string | number>>(new Set());
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
    const [selectedSubsubcategoryId, setSelectedSubsubcategoryId] = useState<number | null>(null);

    // Filters
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<Set<string>>(new Set());
    const [selectedConditions, setSelectedConditions] = useState<Set<string>>(new Set());
    const [selectedDiscounts, setSelectedDiscounts] = useState<Set<string>>(new Set());
    const [selectedRatings, setSelectedRatings] = useState<Set<string>>(new Set());

    const { items: cartItems, addItem, updateQuantity: updateCartQuantity, getTotalPrice } = useCart();

    const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const toggleSubcategoryExpand = (subcategoryId: number) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  const getCartQuantity = (productId: string) => {
        return cartItems.find(item => item.id === productId)?.quantity || 0;
    };

    // Resolve slug to shop ID
    const resolveShopId = async (): Promise<string | null> => {
        try {
            // If slug is numeric, it's likely an old ID - use it directly
            if (/^\d+$/.test(shopSlug)) {
                console.log(' Using numeric ID directly:', shopSlug);
                return shopSlug;
            }

            // Otherwise, bypass cache and fetch shops directly from API
            console.log(' Resolving slug:', shopSlug);
            const response = await api.get('/listings/shops', {
                params: { limit: 500, skip: 0 }
            });
            console.log(' Fetched shops count:', response.data.shops?.length);

            const shop = response.data.shops?.find((s: any) => {
                const shopSlugLower = s.slug?.toLowerCase();
                const paramSlugLower = shopSlug.toLowerCase();
                return shopSlugLower === paramSlugLower;
            });

            if (shop) {
                console.log(' Found shop by slug:', shop.id, shop.slug);
                return shop.id;
            } else {
                console.error(' Shop not found with slug:', shopSlug);
                console.log(' Available slugs:', response.data.shops?.map((s: any) => s.slug).slice(0, 10));
                return null;
            }
        } catch (error) {
            console.error('Failed to resolve shop slug:', error);
            return null;
        }
    };

    useEffect(() => {
        if (!city) {
            setIsLocationModalOpen(true);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Resolve slug to ID
                const resolvedId = await resolveShopId();
                if (!resolvedId) {
                    console.error('Shop not found:', shopSlug);
                    setLoading(false);
                    return;
                }
                setShopId(resolvedId);

                // 2. Fetch categories and target public shop in parallel
                const [categoriesData, shopsData] = await Promise.all([
                    listingsService.getCategories(),
                    listingsService.getShops({ shop_id: resolvedId, limit: 1 }),
                ]);
                setDbCategories(categoriesData || []);

                // Find public shop by UUID (shopId)
                const currentShop = (shopsData.shops || [])[0];

                if (currentShop) {
                    console.log(' Matched public shop:', currentShop);
                    // 2. Fetch listings specifically for this shop's user_id from the backend (highly optimized)
                    const shopListings = await listingsService.getListings({
                        owner_id: Number(currentShop.user_id),
                        limit: 200
                    });
                    console.log(' Retrieved shop listings:', shopListings);

                    setShopName(currentShop.shop_name || 'Shop');
                    setShopLogo(currentShop.cover_image || '');
                                        setShopAvatar(resolveMediaUrl(currentShop.user?.avatar_url) || '');
                    setShopOwnerId(currentShop.user_id);
                    setAllListings(shopListings || []);
                    console.log('📦 Sample listing:', shopListings?.[0]);
                    console.log('📦 Has subcategory_id:', shopListings?.[0]?.subcategory_id);
                    if (shopListings && shopListings.length > 0) {
                        setActiveCategory(String(shopListings[0].category_id || ''));
                    }

                    // Fetch custom banners from dedicated banners endpoint
                    try {
                        const ownerId = currentShop.user_id;
                        const bannerRes = await api.get(`/listings/shops/${ownerId}/banners`);
                        if (bannerRes.data?.shop_detail_banner) {
                            setCustomBanner(bannerRes.data.shop_detail_banner);
                        } else if (bannerRes.data?.shop_page_banner) {
                            setCustomBanner(bannerRes.data.shop_page_banner);
                        }
                    } catch (err: any) {
                        console.error(`⚠️ Banner fetch failed (will use category fallback):`, err.message);
                    }
                } else {
                    console.error('Shop not found in public shops list. Setting fallback data.');
                    // Fallback: use shop name from URL slug
                    setShopName(shopSlug || 'Shop');
                    setAllListings([]);
                }
            } catch (error) {
                console.error('Error fetching shop details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [shopId, city]);

    const filteredListings = useMemo(() => {
        if (!searchQuery.trim()) return allListings;
        const query = searchQuery.toLowerCase();
        return allListings.filter(p =>
            p.title_en?.toLowerCase().includes(query) ||
            p.description_en?.toLowerCase().includes(query)
        );
    }, [allListings, searchQuery]);

    const categories = useMemo(() => {
        // Create lookup maps for subcategories and subsubcategories
        const subcategoryMap = new Map<number, any>();
        const subsubcategoryMap = new Map<number, any>();

        dbCategories.forEach((cat: any) => {
            cat.subcategories?.forEach((sub: any) => {
                subcategoryMap.set(sub.id, sub);
                sub.subsubcategories?.forEach((subsub: any) => {
                    subsubcategoryMap.set(subsub.id, subsub);
                });
            });
        });

        const categoryMap = new Map<string, any[]>();
        filteredListings.forEach((listing: any) => {
            // Always group by main category_id to keep related products together
            const catId = String(listing.category_id);

            // But use the most specific name available for display
            let displayName = listing.category?.name_en || 'Products';
            if (listing.subsubcategory_id) {
                const subsub = subsubcategoryMap.get(listing.subsubcategory_id);
                if (subsub) displayName = subsub.name_en;
            } else if (listing.subcategory_id) {
                const sub = subcategoryMap.get(listing.subcategory_id);
                if (sub) displayName = sub.name_en;
            }

            if (!categoryMap.has(catId)) {
                categoryMap.set(catId, []);
            }
            categoryMap.get(catId)!.push({ ...listing, _displayName: displayName });
        });

        return Array.from(categoryMap.entries())
            .map(([id, products]) => ({
                id,
                name: products[0]._displayName || 'Products',
                products: products.map(({ _displayName, ...rest }) => rest)
            }))
            .sort((a, b) => b.products.length - a.products.length);
    }, [filteredListings, dbCategories]);

    const mainCategoryMap = useMemo(() => {
        const map = new Map<number, string>();
        dbCategories.forEach((cat: any) => {
            map.set(cat.id, cat.name_en);
            cat.subcategories?.forEach((sub: any) => {
                map.set(sub.id, cat.name_en);
                sub.subsubcategories?.forEach((subsub: any) => {
                    map.set(subsub.id, cat.name_en);
                });
            });
        });
        return map;
    }, [dbCategories]);

    const bannerImage = useMemo(() => {
        if (customBanner) {
            return customBanner;
        }
        return null;
    }, [customBanner]);

    // Intersection observer to track scrolled category
    useEffect(() => {
        if (loading || categories.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const catId = entry.target.getAttribute('data-category-id');
                        if (catId) {
                            setActiveCategory(catId);
                        }
                    }
                });
            },
            {
                root: null,
                rootMargin: '-15% 0px -55% 0px',
                threshold: 0,
            }
        );

        const currentRefs = categoryRefs.current;
        Object.keys(currentRefs).forEach((key) => {
            const el = currentRefs[key];
            if (el) observer.observe(el);
        });

        return () => {
            Object.keys(currentRefs).forEach((key) => {
                const el = currentRefs[key];
                if (el) observer.unobserve(el);
            });
        };
    }, [categories, loading]);

    const scrollProducts = (catId: string, direction: 'left' | 'right') => {
        const container = scrollRefs.current[catId];
        if (container) {
            const scrollAmount = direction === 'left' ? -350 : 350;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!city) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Select Your Location</h1>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setIsLocationModalOpen(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-full"
                    >
                        Choose Location
                    </motion.button>
                </div>
                <LocationPickerModal
                    isOpen={isLocationModalOpen}
                    onClose={() => { if (city) setIsLocationModalOpen(false); }}
                />
            </div>
        );
    }

    // Show not found if shop couldn't be resolved and not still loading
    if (!loading && !shopName) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">404</h1>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Shop Not Found</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-6">
                        The shop "{shopSlug}" doesn't exist or has been removed.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => router.push('/shops')}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-full"
                    >
                        Browse All Markets
                    </motion.button>
                </div>
            </div>
        );
    }

    const shopInitial = shopName?.[0]?.toUpperCase() || 'S';

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* STICKY HEADER / BREADCRUMBS */}
            <div className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <button onClick={() => router.push('/')} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {city}
                        </button>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <button onClick={() => router.push('/shops')} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            Shops
                        </button>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-900 dark:text-white truncate">{shopName}</span>
                    </div>
                </div>
            </div>

            {/* HERO BANNER & INFO (Glovo Style) */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
                {/* BANNER WITH SHOP LOGO OVERLAY */}
                <div className="relative bg-gray-200 dark:bg-slate-800 h-44 md:h-72 rounded-xl overflow-hidden mb-6 shadow-md border border-gray-100 dark:border-slate-800">
                    {bannerImage && (
                        <>
                            <img
                                src={optimizeCloudinaryUrl(bannerImage, { width: 1920, quality: 'auto', fetch_format: 'auto' }) || bannerImage}
                                alt={shopName}
                                className="w-full h-full object-cover"
                                loading="eager"
                                decoding="async"
                            />
                            <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
                        </>
                    )}
                    
                    {/* Circle Logo Overlay (Bottom-left) */}
                    <div className="absolute bottom-4 left-5 w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-700 shadow-lg flex items-center justify-center overflow-hidden">
                        {shopAvatar ? (
                            <img src={shopAvatar} alt={shopName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xl">
                                {shopInitial}
                            </div>
                        )}
                    </div>
                    <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-900/95 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:scale-105 shadow transition-all">
                        <Info className="w-4 h-4" />
                    </button>
                </div>

                {/* DETAILS ROW (Title, Badges, bubbles metrics) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-8">
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                            {shopName}
                        </h1>

                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-md cursor-pointer hover:bg-slate-200 transition-colors">
                                Price match ›
                            </span>
                            <span className="bg-red-50 dark:bg-red-950/20 text-[#e81f44] text-xs font-extrabold px-3 py-1 rounded-md flex items-center gap-1">
                                <Percent className="w-3 h-3 stroke-[2.5]" />
                                -15% some items
                            </span>
                        </div>

                        {/* SEARCH & FILTER */}
                        <div className="flex gap-3 items-center max-w-2xl">
                            {/* SEARCH BAR */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products, brands..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm border border-gray-200 dark:border-slate-800"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Buttons - Icon Only (Right Side, One Line) */}
                    <div className="md:col-span-4 flex justify-start md:justify-end gap-4 py-2 px-1">
                        {/* WhatsApp */}
                        <button
                            onClick={() => window.open(`https://wa.me/?text=Hi%20${shopName}`)}
                            title="WhatsApp"
                            className="hover:scale-110 transition-transform active:scale-95"
                        >
                            <img src="/whatsapp-icon.png" alt="WhatsApp" className="w-12 h-12 object-contain" />
                        </button>

                        {/* Call */}
                        <button
                            onClick={() => window.location.href = 'tel:+254712345678'}
                            title="Call"
                            className="hover:scale-110 transition-transform active:scale-95"
                        >
                            <img src="/call-icon.png" alt="Call" className="w-12 h-12 object-contain" />
                        </button>

                        {/* Message */}
                        <button
                            onClick={() => router.push('/messages')}
                            title="Message"
                            className="hover:scale-110 transition-transform active:scale-95"
                        >
                            <img src="/message-icon.png" alt="Message" className="w-12 h-12 object-contain" />
                        </button>
                    </div>
                </div>
            </div>

            {/* THREE-COLUMN GRID CONTENT */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-24 mt-6">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-slate-400 text-sm font-semibold">Loading store items...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 max-w-lg mx-auto">
                        <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-800 dark:text-white">No products found</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">
                            No listings match your search or filter options in this store.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-12 gap-8 items-start">
                        {/* 1. Left Sidebar (Categories with Subcategories) */}
                        <aside className="hidden lg:block lg:col-span-2 sticky top-28 self-start max-h-[75vh] overflow-y-auto pr-2 hide-scrollbar">
                            <div className="space-y-2">
                                {dbCategories
                                    .filter((dbCategory: any) => {
                                        // Only show categories that have products in this shop
                                        return allListings.some(listing => listing.category_id === dbCategory.id);
                                    })
                                    .map((dbCategory: any) => (
                                    <div key={dbCategory.id} className="space-y-1">
                                        {/* Main Category */}
                                        <button
                                            onClick={() => {
                                                setSelectedSubcategoryId(null);
                                                setSelectedSubsubcategoryId(null);
                                                setActiveCategory(dbCategory.id);
                                                const matchingCat = categories.find(c => c.products?.some((p: any) => p.category_id === dbCategory.id));
                                                if (matchingCat) {
                                                    categoryRefs.current[matchingCat.id]?.scrollIntoView({
                                                        behavior: 'smooth',
                                                        block: 'start',
                                                    });
                                                }
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900/40"
                                        >
                                            {dbCategory.name_en}
                                        </button>
                                        
                                        {/* Subcategories with Expandable Sub-subcategories */}
                                        {dbCategory.subcategories && dbCategory.subcategories.length > 0 && (
                                            <div className="pl-2 space-y-1">
                                                {dbCategory.subcategories
                                                    .filter((subcategory: any) => {
                                                        // Show only subcategories that have exact matching products in this shop
                                                        const hasMatch = allListings.some(
                                                            listing =>
                                                                listing.category_id === dbCategory.id &&
                                                                listing.subcategory_id === subcategory.id
                                                        );
                                                        if (hasMatch) {
                                                            console.log(`✓ ${subcategory.name_en} has products`);
                                                        }
                                                        return hasMatch;
                                                    })
                                                    .map((subcategory: any) => (
                                                    <div key={subcategory.id}>
                                                        {/* Subcategory */}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSubcategoryId(subcategory.id);
                                                                setSelectedSubsubcategoryId(null);

                                                                const matchingCat = categories.find(c =>
                                                                    c.products?.some((p: any) =>
                                                                        p.category_id === dbCategory.id &&
                                                                        p.subcategory_id === subcategory.id
                                                                    )
                                                                );
                                                                if (matchingCat) {
                                                                    setActiveCategory(matchingCat.id);
                                                                    categoryRefs.current[matchingCat.id]?.scrollIntoView({
                                                                        behavior: 'smooth',
                                                                        block: 'start',
                                                                    });
                                                                }
                                                            }}
                                                            className="w-full text-left px-3 py-1 rounded-lg text-[11px] font-semibold transition-all text-gray-600 dark:text-slate-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-slate-200 dark:hover:bg-slate-900/40 flex items-center justify-between"
                                                        >
                                                            <span className="truncate">{subcategory.name_en}</span>
                                                            {subcategory.subsubcategories && subcategory.subsubcategories.length > 0 && (
                                                                <div
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleSubcategoryExpand(subcategory.id);
                                                                    }}
                                                                    className="ml-1 shrink-0 cursor-pointer"
                                                                >
                                                                    <ChevronRight className={`w-3 h-3 transition-transform ${
                                                                        expandedSubcategories.has(subcategory.id) ? 'rotate-90' : ''
                                                                    }`} />
                                                                </div>
                                                            )}
                                                        </button>
                                                        
                                                        {/* Sub-subcategories (Expanded) - Show only those with products */}
                                                        {expandedSubcategories.has(subcategory.id) && subcategory.subsubcategories && (
                                                            <div className="pl-2 mt-1 space-y-1">
                                                                {subcategory.subsubcategories
                                                                    .filter((subsubcategory: any) => {
                                                                        // Show only subsubcategories that have exact matching products in this shop
                                                                        return allListings.some(
                                                                            listing =>
                                                                                listing.category_id === dbCategory.id &&
                                                                                listing.subcategory_id === subcategory.id &&
                                                                                listing.subsubcategory_id === subsubcategory.id
                                                                        );
                                                                    })
                                                                    .map((subsubcategory: any) => (
                                                                        <button
                                                                            key={subsubcategory.id}
                                                                            onClick={() => {
                                                                                setSelectedSubcategoryId(subcategory.id);
                                                                                setSelectedSubsubcategoryId(subsubcategory.id);

                                                                                const matchingCat = categories.find(c =>
                                                                                    c.products?.some((p: any) =>
                                                                                        p.category_id === dbCategory.id &&
                                                                                        p.subcategory_id === subcategory.id &&
                                                                                        p.subsubcategory_id === subsubcategory.id
                                                                                    )
                                                                                );
                                                                                if (matchingCat) {
                                                                                    setActiveCategory(matchingCat.id);
                                                                                    categoryRefs.current[matchingCat.id]?.scrollIntoView({
                                                                                        behavior: 'smooth',
                                                                                        block: 'start',
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className="w-full text-left px-3 py-1 rounded-lg text-[10px] font-medium transition-all text-gray-500 dark:text-slate-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:text-slate-300 dark:hover:bg-slate-900/40 cursor-pointer"
                                                                        >
                                                                            {subsubcategory.name_en}
                                                                        </button>
                                                                    ))
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Filters - Inside each category */}
                                        <div className="pl-2 space-y-3 mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
                                {/* Price Range */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Price Range</h3>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Under KSh 500', value: 'under500' },
                                            { label: 'KSh 500 - 1,000', value: '500-1000' },
                                            { label: 'KSh 1,000 - 2,500', value: '1000-2500' },
                                            { label: 'Above KSh 2,500', value: 'above2500' }
                                        ].map((range) => (
                                            <label key={range.value} className="flex items-center gap-2 cursor-pointer text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPriceRanges.has(range.value)}
                                                    onChange={(e) => {
                                                        const newRanges = new Set(selectedPriceRanges);
                                                        if (e.target.checked) newRanges.add(range.value);
                                                        else newRanges.delete(range.value);
                                                        setSelectedPriceRanges(newRanges);
                                                    }}
                                                />
                                                {range.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Condition */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Condition</h3>
                                    <div className="space-y-2">
                                        {['New', 'Used'].map((condition) => (
                                            <label key={condition} className="flex items-center gap-2 cursor-pointer text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedConditions.has(condition)}
                                                    onChange={(e) => {
                                                        const newConditions = new Set(selectedConditions);
                                                        if (e.target.checked) newConditions.add(condition);
                                                        else newConditions.delete(condition);
                                                        setSelectedConditions(newConditions);
                                                    }}
                                                />
                                                {condition}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Discount */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Discount</h3>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'On Sale', value: 'sale' },
                                            { label: '10%+ Off', value: '10off' },
                                            { label: '20%+ Off', value: '20off' },
                                            { label: '50%+ Off', value: '50off' }
                                        ].map((discount) => (
                                            <label key={discount.value} className="flex items-center gap-2 cursor-pointer text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDiscounts.has(discount.value)}
                                                    onChange={(e) => {
                                                        const newDiscounts = new Set(selectedDiscounts);
                                                        if (e.target.checked) newDiscounts.add(discount.value);
                                                        else newDiscounts.delete(discount.value);
                                                        setSelectedDiscounts(newDiscounts);
                                                    }}
                                                />
                                                {discount.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Rating */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Rating</h3>
                                    <div className="space-y-2">
                                        {[
                                            { label: '4★ & Above', value: '4star' },
                                            { label: '3★ & Above', value: '3star' }
                                        ].map((rating) => (
                                            <label key={rating.value} className="flex items-center gap-2 cursor-pointer text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRatings.has(rating.value)}
                                                    onChange={(e) => {
                                                        const newRatings = new Set(selectedRatings);
                                                        if (e.target.checked) newRatings.add(rating.value);
                                                        else newRatings.delete(rating.value);
                                                        setSelectedRatings(newRatings);
                                                    }}
                                                />
                                                {rating.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                    </div>
                ))}
            </div>
        </aside>

                        {/* 2. Center Column (List of Carousels) */}
                        <main className="col-span-12 lg:col-span-7 space-y-12">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    ref={(el) => { if (el) categoryRefs.current[category.id] = el; }}
                                    data-category-id={category.id}
                                    className="scroll-mt-28"
                                >
                                    <div className="mb-4">
                                        {/* Category Breadcrumb */}
                                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                            {(() => {
                                                // If subsubcategory selected, get its path
                                                if (selectedSubsubcategoryId) {
                                                    for (const cat of dbCategories) {
                                                        for (const subcat of cat.subcategories || []) {
                                                            const found = subcat.subsubcategories?.find((ss: any) => ss.id === selectedSubsubcategoryId);
                                                            if (found) {
                                                                return `${cat.name_en} > ${subcat.name_en} > ${found.name_en}`.toUpperCase();
                                                            }
                                                        }
                                                    }
                                                }

                                                // If subcategory selected, get its path
                                                if (selectedSubcategoryId) {
                                                    for (const cat of dbCategories) {
                                                        const found = cat.subcategories?.find((s: any) => s.id === selectedSubcategoryId);
                                                        if (found) {
                                                            return `${cat.name_en} > ${found.name_en}`.toUpperCase();
                                                        }
                                                    }
                                                }

                                                // Default: show main category or path from first product
                                                if (category.products && category.products.length > 0) {
                                                    const mainCat = dbCategories.find((c: any) =>
                                                        category.products?.some((p: any) => p.category_id === c.id)
                                                    );
                                                    if (mainCat) return mainCat.name_en.toUpperCase();
                                                }
                                                return (category.name === 'Other' ? 'Products' : category.name).toUpperCase();
                                            })()}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                                {(() => {
                                                    // If subsubcategory selected, find and show its name
                                                    if (selectedSubsubcategoryId) {
                                                        for (const cat of dbCategories) {
                                                            for (const subcat of cat.subcategories || []) {
                                                                const found = subcat.subsubcategories?.find((ss: any) => ss.id === selectedSubsubcategoryId);
                                                                if (found) return found.name_en;
                                                            }
                                                        }
                                                    }

                                                    // If subcategory selected, find and show its name
                                                    if (selectedSubcategoryId) {
                                                        for (const cat of dbCategories) {
                                                            const found = cat.subcategories?.find((s: any) => s.id === selectedSubcategoryId);
                                                            if (found) return found.name_en;
                                                        }
                                                    }

                                                    // If no subcategory selected, show the main category name
                                                    const mainCat = dbCategories.find((c: any) =>
                                                        category.products?.some((p: any) => p.category_id === c.id)
                                                    );
                                                    if (mainCat) return mainCat.name_en;

                                                    return (category.name === 'Other' ? 'Products' : category.name);
                                                })()}
                                            </h2>
                                        <div className="flex items-center gap-3">
                                            <button className="text-xs font-black text-[#00a082] hover:underline">
                                                Show all
                                            </button>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => scrollProducts(category.id, 'left')}
                                                    className="w-7 h-7 rounded-full border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-55 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-sm"
                                                >
                                                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                                                </button>
                                                <button 
                                                    onClick={() => scrollProducts(category.id, 'right')}
                                                    className="w-7 h-7 rounded-full border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-55 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-sm"
                                                >
                                                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    </div>

                                    {/* Horizontal Carousel */}
                                    <div 
                                        ref={(el) => { if (el) scrollRefs.current[category.id] = el; }}
                                        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth hide-scrollbar snap-x snap-mandatory"
                                    >
                                        {(() => {
                                            const filtered = category.products.filter((product) => {
                                                // Category filters
                                                if (selectedSubcategoryId !== null) {
                                                    if (selectedSubsubcategoryId === null) {
                                                        if (product.subcategory_id !== selectedSubcategoryId) return false;
                                                    } else {
                                                        if (product.subcategory_id !== selectedSubcategoryId || product.subsubcategory_id !== selectedSubsubcategoryId) return false;
                                                    }
                                                }

                                                // Price filter
                                                if (selectedPriceRanges.size > 0) {
                                                    const price = product.price || 0;
                                                    const matchesPrice = Array.from(selectedPriceRanges).some(range => {
                                                        switch(range) {
                                                            case 'under500': return price < 500;
                                                            case '500-1000': return price >= 500 && price <= 1000;
                                                            case '1000-2500': return price > 1000 && price <= 2500;
                                                            case 'above2500': return price > 2500;
                                                            default: return false;
                                                        }
                                                    });
                                                    if (!matchesPrice) return false;
                                                }

                                                // Condition filter
                                                if (selectedConditions.size > 0) {
                                                    if (!selectedConditions.has(product.condition)) return false;
                                                }

                                                // Discount filter (mock based on product id)
                                                if (selectedDiscounts.size > 0) {
                                                    const idNum = typeof product.id === 'number' ? product.id : (parseInt(String(product.id).slice(0, 4), 16) || 123);
                                                    const hasPromo = (idNum % 3) !== 0;
                                                    const discountPercent = 10 + (idNum % 4) * 5;

                                                    const matchesDiscount = Array.from(selectedDiscounts).some(discount => {
                                                        if (discount === 'sale' && hasPromo) return true;
                                                        if (discount === '10off' && hasPromo && discountPercent >= 10) return true;
                                                        if (discount === '20off' && hasPromo && discountPercent >= 20) return true;
                                                        if (discount === '50off' && hasPromo && discountPercent >= 50) return true;
                                                        return false;
                                                    });
                                                    if (!matchesDiscount) return false;
                                                }

                                                // Rating filter (mock based on shop rating)
                                                if (selectedRatings.size > 0) {
                                                    const mockRating = 3.5 + Math.random() * 1.5; // 3.5-5 stars
                                                    const matchesRating = Array.from(selectedRatings).some(rating => {
                                                        if (rating === '4star' && mockRating >= 4) return true;
                                                        if (rating === '3star' && mockRating >= 3) return true;
                                                        return false;
                                                    });
                                                    if (!matchesRating) return false;
                                                }

                                                return true;
                                            });
                                            if (filtered.length < category.products.length) {
                                                console.log(`Filtered ${category.products.length} → ${filtered.length} products`);
                                            }
                                            return filtered;
                                        })()

                                            .map((product) => {
                                            const { hasPromo, originalPrice, promoText } = getMockProductInfo(product);
                                            const cartQty = getCartQuantity(String(product.id));

                                            return (
                                                <div 
                                                    key={product.id} 
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setModalQuantity(cartQty || 1);
                                                    }}
                                                    className="flex-shrink-0 w-44 snap-start cursor-pointer group"
                                                >
                                                    {/* Card Image Container */}
                                                    <div className="relative bg-gray-50 dark:bg-slate-900/60 aspect-square rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800/80 mb-2.5 flex items-center justify-center transition-shadow group-hover:shadow-md">
                                                        {product.images?.[0] ? (
                                                            <img
                                                                src={product.images[0]}
                                                                alt={product.title_en}
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <ShoppingBag className="w-6 h-6" />
                                                            </div>
                                                        )}

                                                        {/* Discount badge on the top-left */}
                                                        {hasPromo && (
                                                            <div className="absolute top-2 left-2 bg-[#e81f44] text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                                                {promoText}
                                                            </div>
                                                        )}

                                                        {/* Favorite Heart Button - Top Right */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                const newFavorites = new Set(favorites);
                                                                if (newFavorites.has(product.id)) {
                                                                    newFavorites.delete(product.id);
                                                                } else {
                                                                    newFavorites.add(product.id);
                                                                }
                                                                setFavorites(newFavorites);
                                                            }}
                                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white dark:bg-slate-900 shadow-md hover:scale-110 active:scale-95 flex items-center justify-center transition-all border border-gray-100 dark:border-slate-800"
                                                        >
                                                            <Heart className={`w-3.5 h-3.5 ${favorites.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                                        </button>

                                                        {/* Circular overlay + button on the bottom-right */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                addItem({
                                                                    owner_id: shopOwnerId,
                                                                    id: String(product.id),
                                                                    title: product.title_en,
                                                                    price: product.price,
                                                                    image: product.images?.[0],
                                                                    quantity: cartQty + 1
                                                                });
                                                            }}
                                                            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 text-[#00a082] shadow-md hover:scale-105 active:scale-95 flex items-center justify-center transition-all border border-gray-100 dark:border-slate-800"
                                                        >
                                                            {cartQty > 0 ? (
                                                                <span className="text-xs font-black text-gray-900 dark:text-white">{cartQty}</span>
                                                            ) : (
                                                                <Plus className="w-4 h-4 stroke-[3]" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Card Title & Prices */}
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-xs leading-normal line-clamp-2 min-h-[32px] group-hover:text-orange-500 transition-colors">
                                                        {product.title_en}
                                                    </h3>
                                                    
                                                    {/* Category Breadcrumb */}
                                                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">
                                                        {getCategoryPath(product.category_id, product.subcategory_id, dbCategories, (product as any).subsubcategory_id)}
                                                    </p>
                                                    
                                                    <div className="mt-2 flex flex-col">
                                                        <span className="text-sm font-black text-gray-900 dark:text-white">
                                                            KSh {product.price.toLocaleString()}
                                                        </span>
                                                        {hasPromo && (
                                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 line-through">
                                                                KSh {originalPrice.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </main>

                        {/* 3. Right Sidebar (Your Order / Cart Summary) */}
                        <aside className="col-span-12 lg:col-span-3 sticky top-28 self-start">
                            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-5 shadow-sm max-h-[75vh] flex flex-col">
                                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-slate-800 mb-4 shrink-0">
                                    <ShoppingBag className="w-4.5 h-4.5 text-gray-500" />
                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Your order</h3>
                                </div>

                                {cartItems.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center shrink-0">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-850 rounded-full flex items-center justify-center mb-4">
                                            <img src="/icons/shelves.png" className="w-8 h-8 object-contain opacity-40" alt="" />
                                        </div>
                                        <p className="font-bold text-gray-800 dark:text-white text-xs leading-tight">Your order is empty</p>
                                        <p className="text-gray-450 dark:text-slate-500 text-[10px] mt-1 max-w-[170px] leading-normal">
                                            When you add products from a store, they will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 min-h-0 hide-scrollbar">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex gap-2 justify-between items-start text-xs">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white truncate" title={item.title}>
                                                        {item.title}
                                                    </p>
                                                    <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] mt-0.5">
                                                        KSh {(item.price * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-gray-100 dark:border-slate-800 shrink-0">
                                                    <button
                                                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                        className="text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="font-bold text-gray-900 dark:text-white text-[11px] px-0.5">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                        className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-auto border-t border-gray-100 dark:border-slate-800 pt-4 space-y-3 shrink-0">
                                    {/* Delivery Threshold Notice */}
                                    <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-2.5 text-[10px] text-amber-800 dark:text-amber-300 leading-normal">
                                        {getTotalPrice() < 500 ? (
                                            <p className="font-medium">
                                                Reach <span className="font-bold">KSh 500.00</span> to avoid an extra fee of <span className="font-bold">KSh 300.00</span>.
                                            </p>
                                        ) : (
                                            <p className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                                <span>✓</span> You qualify for reduced fee checkout!
                                            </p>
                                        )}
                                    </div>

                                    {cartItems.length > 0 && (
                                        <>
                                            <div className="flex justify-between items-center text-xs font-semibold">
                                                <span className="text-gray-500">Subtotal</span>
                                                <span className="font-black text-gray-900 dark:text-white text-sm">KSh {getTotalPrice().toLocaleString()}</span>
                                            </div>
                                            
                                            <button
                                                onClick={() => router.push('/checkout')}
                                                className="w-full bg-[#00a082] hover:bg-[#008f73] text-white font-black py-2.5 px-4 rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-sm text-xs"
                                            >
                                                <span>Checkout</span>
                                                <span>•</span>
                                                <span>KSh {(getTotalPrice() + (getTotalPrice() < 500 ? 300 : 0)).toLocaleString()}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>

            {/* PRODUCT DETAIL MODAL (Overlay) */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="absolute inset-0" onClick={() => setSelectedProduct(null)} />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 z-10 border border-gray-100 dark:border-slate-800"
                        >
                            {/* Close button with circular green/teal outline */}
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full border-2 border-[#00a082] text-white bg-[#00a082] hover:bg-[#008f73] flex items-center justify-center transition-all shadow-lg focus:outline-none hover:scale-110"
                            >
                                <X className="w-6 h-6 stroke-[3]" />
                            </button>

                            {/* Product Image */}
                            <div className="aspect-[4/3] w-full bg-white dark:bg-slate-950 rounded-2xl overflow-hidden mb-5 flex items-center justify-center relative border border-gray-100 dark:border-slate-800/80">
                                {selectedProduct.images?.[0] ? (
                                    <img
                                        src={selectedProduct.images[0]}
                                        alt={selectedProduct.title_en}
                                        className="w-full h-full object-contain p-4"
                                    />
                                ) : (
                                    <ShoppingBag className="w-12 h-12 text-gray-300" />
                                )}

                                {/* Red promo percentage tag on the left */}
                                {getMockProductInfo(selectedProduct).hasPromo && (
                                    <div className="absolute top-4 left-4 bg-[#e81f44] text-white text-xs font-black px-2.5 py-1 rounded">
                                        {getMockProductInfo(selectedProduct).promoText}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                        {selectedProduct.title_en}
                                    </h2>
                                </div>

                                {/* Prices */}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                                        KSh {selectedProduct.price.toLocaleString()}
                                    </span>
                                    {getMockProductInfo(selectedProduct).hasPromo && (
                                        <span className="text-sm text-gray-400 dark:text-slate-500 line-through font-semibold">
                                            KSh {getMockProductInfo(selectedProduct).originalPrice.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {/* Product Description */}
                                {selectedProduct.description_en && (
                                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                        {selectedProduct.description_en}
                                    </p>
                                )}

                                {/* Quantity Selector Counter Pill */}
                                <div className="flex justify-center py-2">
                                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-gray-100 dark:border-slate-800">
                                        <button
                                            onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-slate-400 transition-colors"
                                        >
                                            <Minus className="w-4 h-4 stroke-[2.5]" />
                                        </button>
                                        <span className="text-lg font-black text-gray-900 dark:text-white min-w-[24px] text-center">
                                            {modalQuantity}
                                        </span>
                                        <button
                                            onClick={() => setModalQuantity(q => q + 1)}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-orange-500 dark:text-orange-400 transition-colors"
                                        >
                                            <Plus className="w-4 h-4 stroke-[2.5]" />
                                        </button>
                                    </div>
                                </div>

                                {/* Full-width Add Button */}
                                <button
                                    onClick={() => {
                                        addItem({
                                                                    owner_id: shopOwnerId,
                                            id: String(selectedProduct.id),
                                            title: selectedProduct.title_en,
                                            price: selectedProduct.price,
                                            image: selectedProduct.images?.[0],
                                            quantity: modalQuantity
                                        });
                                        setSelectedProduct(null);
                                    }}
                                    className="w-full bg-[#00a082] hover:bg-[#008f73] text-white font-black py-4 px-6 rounded-full transition-colors flex items-center justify-between text-sm shadow-md mt-4"
                                >
                                    <span>Add {modalQuantity} to order</span>
                                    <span>KSh {(selectedProduct.price * modalQuantity).toLocaleString()}</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <LocationPickerModal
                isOpen={isLocationModalOpen}
                onClose={() => { if (city) setIsLocationModalOpen(false); }}
            />
        </div>
    );
}
