"use client";

import React, { use, useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Star, ShieldCheck, ShoppingBag } from 'lucide-react';
import { listingsService } from '../../../services/listings';
import api, { resolveMediaUrl } from '../../../services/api';
import { useCurrencyStore } from '../../../store/useCurrency';
import { formatConvertedPrice } from '../../../lib/currency';
import { useLocalizedField } from '../../../lib/i18n';
import type { Listing } from '../../../types';
import { CANONICAL_CATEGORIES } from '../../../components/shared/Sidebar';
import { useCart } from '../../../store/useCart';

interface Store {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    image?: string;
    rating: number;
    time: string;
    distance: string;
    isVerified: boolean;
    trust_score: number;
}

interface PageProps {
    params: Promise<{ category: string }>;
}

const FALLBACK: Record<string, string> = {
    'food-groceries':        '/categories/grocery.jpg',
    'beauty-personal-care':  '/categories/skincare.jpg',
    'health-beauty':         '/categories/skincare.jpg',
    'leisure-sports':        '/categories/sport.jpg',
    'clothing-shoes':        '/categories/fashion.jpg',
    'electronics':           '/categories/electronics.jpg',
    'household-items':       '/categories/furniture.jpg',
    'vehicles':              '/categories/vehicles.jpg',
    'livestock':             '/categories/livestock.jpg',
    'property':              '/categories/property.jpg',
    'services':              '/categories/services.jpg',
    'commercial-equipment':  '/categories/commercial.jpg',
    'land-farms':            '/categories/land.jpg',
    'repair-construction':   '/categories/repair.jpg',
    'jobs':                  '/categories/jobs.jpg',
    'agriculture-food':      '/categories/grocery.jpg',
    'phones':                '/categories/electronics.jpg',
    'mobiles':               '/categories/electronics.jpg',
    'babies-kids':           '/categories/babies.jpg',
};

function getFallbackImage(slug: string): string {
    return FALLBACK[slug] || '/categories/grocery.jpg';
}

const categorySlugMap: Record<string, string> = {
    'grocery': 'food-groceries',
    'food-groceries': 'food-groceries',
    'apparel': 'clothing-shoes',
    'clothing-shoes': 'clothing-shoes',
    'household': 'household-items',
    'household-items': 'household-items',
    'electronics': 'electronics',
    'vehicles': 'vehicles',
    'livestock': 'livestock',
    'land': 'land-farms',
    'land-farms': 'land-farms',
    'services': 'services',
    'health-beauty': 'health-beauty',
    'beauty-personal-care': 'health-beauty',
    'property': 'property',
    'jobs': 'jobs',
    'commercial': 'commercial-equipment',
    'commercial-equipment': 'commercial-equipment',
    'leisure': 'leisure-sports',
    'leisure-sports': 'leisure-sports',
    'sports': 'leisure-sports',
    'repair': 'repair-construction',
    'repair-construction': 'repair-construction',
    'agriculture': 'agriculture-food',
    'agriculture-food': 'agriculture-food',
    'phones': 'mobiles',
    'mobiles': 'mobiles',
    'babies': 'babies-kids',
    'babies-kids': 'babies-kids'
};

/* ─────────────────────────────────────────────────────────────────────────────
   STORE CARD — Circular Logo + Delivery Info (Row format)
───────────────────────────────────────────────────────────────────────────── */
function CategoryStoreCard({ store, category }: { store: Store; category: string }) {
    return (
        <Link
            href={`/shop/${store.slug}?category=${encodeURIComponent(category)}`}
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer"
        >
            {/* Circular Logo */}
            <div className="h-12 w-12 rounded-full border border-gray-100 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-950 shrink-0 overflow-hidden shadow-sm">
                <img 
                    src={store.logo_url || store.image} 
                    alt={store.name} 
                    className="h-full w-full object-cover" 
                />
            </div>
            
            {/* Meta details */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate leading-tight">
                        {store.name}
                    </h3>
                    {store.isVerified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {store.time}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                    {store.distance} · Free escrow
                </p>
            </div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PRODUCT CARD — Landscape/Square + Bottom Add Button
───────────────────────────────────────────────────────────────────────────── */
function CategoryProductCard({ listing, onAddToCart }: { listing: Listing; onAddToCart: () => void }) {
    const img = listing.images?.[0] ? resolveMediaUrl(listing.images[0]) || '/categories/grocery.jpg' : '/categories/grocery.jpg';
    const displayCurrency = useCurrencyStore((s) => s.currency);
    const field = useLocalizedField();

    return (
        <Link 
            href={`/listings/${listing.id}`}
            className="shrink-0 w-[140px] sm:w-[150px] group cursor-pointer flex flex-col justify-between"
        >
            <div className="space-y-2">
                {/* Image Box */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 flex items-center justify-center p-2">
                    <img
                        src={img}
                        alt={field(listing.title_en, listing.title_so)}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Add to Cart circle button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAddToCart();
                        }}
                        className="absolute bottom-2.5 right-2.5 h-7 w-7 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 rounded-full flex items-center justify-center font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                    >
                        +
                    </button>
                    
                    {listing.is_negotiable && (
                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                            Negotiable
                        </span>
                    )}
                </div>
                
                {/* Text meta */}
                <div className="space-y-0.5 px-0.5">
                    <span className="text-xs font-extrabold text-gray-900 dark:text-slate-100">
                        {formatConvertedPrice(listing.price, listing.currency, displayCurrency)}
                    </span>
                    <h4 className="text-xs font-semibold text-gray-800 dark:text-slate-200 line-clamp-2 mt-0.5 leading-snug">
                        {field(listing.title_en, listing.title_so)}
                    </h4>
                </div>
            </div>
            
            <div className="px-0.5 mt-1 space-y-1">
                {listing.owner && (
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-0.5 text-[8px] text-gray-600 dark:text-slate-400 font-bold truncate">
                            <span className="truncate">{listing.owner.full_name}</span>
                            {listing.owner.is_verified && (
                                <span className="text-orange-600 dark:text-orange-400">✓</span>
                            )}
                        </div>
                        {listing.owner.rating && (
                            <div className="flex items-center gap-0.5 text-[7px] text-gray-500 dark:text-slate-500">
                                <span>⭐ {listing.owner.rating.toFixed(1)}</span>
                                {listing.owner.reviews_count && <span>({listing.owner.reviews_count})</span>}
                            </div>
                        )}
                    </div>
                )}
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded block w-max">
                    In stock
                </span>
            </div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function CategoryPage({ params }: PageProps) {
    const { category } = use(params);
    const displayCurrency = useCurrencyStore((s) => s.currency);
    const field = useLocalizedField();
    const addItem = useCart((state) => state.addItem);

    const [title, setTitle] = useState('');
    const [stores, setStores] = useState<Store[]>([]);
    const [listingsByStore, setListingsByStore] = useState<{ store: Store; listings: Listing[] }[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const sliderRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const isDealsPage = category === 'deals';
    const LISTINGS_LIMIT = 50;

    const formatCategoryName = (slug: string) => {
        return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    useEffect(() => {
        const targetSlug = categorySlugMap[category] || category;
        const canonicalCat = CANONICAL_CATEGORIES.find(c => c.slug === targetSlug);
        const catName = canonicalCat ? canonicalCat.name : formatCategoryName(category);
        setTitle(catName);

        async function loadCategoryData() {
            try {
                const dbCategorySlug = categorySlugMap[category] || category;
                const rawListings = isDealsPage
                    ? (await listingsService.getListings()).slice(0, LISTINGS_LIMIT)
                    : await listingsService.getListings({ category_id: dbCategorySlug, limit: LISTINGS_LIMIT });

                // Deduplicate listings by ID
                const seenIds = new Set<number>();
                const uniqueListings = rawListings.filter(l => {
                    if (seenIds.has(l.id)) return false;
                    seenIds.add(l.id);
                    return true;
                });

                const fetchedListings = isDealsPage
                    ? uniqueListings.filter(l => l.is_negotiable)
                    : uniqueListings;

                if (fetchedListings && fetchedListings.length > 0) {
                    // Deduplicate by owner_id, then by store name to catch similar names
                    const uniqueSellersMap = new Map<number, Store>();
                    const seenNames = new Set<string>();

                    fetchedListings.forEach(l => {
                        if (l.owner && !uniqueSellersMap.has(l.owner_id)) {
                            const storeName = l.owner.full_name || "Local Seller";
                            const nameKey = storeName.toLowerCase().trim();

                            // Skip if we already have a store with this name
                            if (seenNames.has(nameKey)) {
                                return;
                            }

                            const trustScoreVal = l.owner.trust_score || 95;
                            uniqueSellersMap.set(l.owner_id, {
                                id: l.owner_id.toString(),
                                name: storeName,
                                slug: l.owner_id.toString(),
                                logo_url: l.owner.avatar_url ? resolveMediaUrl(l.owner.avatar_url) || undefined : undefined,
                                image: l.images?.[0]
                                    ? resolveMediaUrl(l.images[0]) || undefined
                                    : resolveMediaUrl(l.owner.avatar_url) || getFallbackImage(dbCategorySlug),
                                rating: trustScoreVal / 200,
                                time: "25-35 min",
                                distance: l.location ? l.location.split(',')[0] : "Nearby",
                                isVerified: l.owner.is_verified || false,
                                trust_score: trustScoreVal
                            });
                            seenNames.add(nameKey);
                        }
                    });

                    const derivedStores = Array.from(uniqueSellersMap.values());
                    setStores(derivedStores);

                    const grouped: { store: Store; listings: Listing[] }[] = [];
                    derivedStores.forEach(store => {
                        const storeListings = fetchedListings
                            .filter(l => l.owner_id.toString() === store.id)
                            .slice(0, 8);

                        // Double-check no duplicates per store
                        const seenInStore = new Set<number>();
                        const dedupedListings = storeListings.filter(l => {
                            if (seenInStore.has(l.id)) return false;
                            seenInStore.add(l.id);
                            return true;
                        });

                        grouped.push({
                            store,
                            listings: dedupedListings
                        });
                    });
                    setListingsByStore(grouped);
                } else {
                    setStores([]);
                    setListingsByStore([]);
                }
            } catch (err) {
                console.error("Failed loading category data:", err);
                setStores([]);
                setListingsByStore([]);
            } finally {
                setLoading(false);
            }
        }

        loadCategoryData();
    }, [category]);

    // ── Filter handling ──────────────────────────────────────────────────────
    const filteredStores = useMemo(() => {
        let results = [...stores];
        if (activeFilters.includes('Over 4.5★')) {
            results = results.filter(s => s.rating >= 4.5);
        }
        if (activeFilters.includes('Verified Only')) {
            results = results.filter(s => s.isVerified);
        }
        return results;
    }, [stores, activeFilters]);

    const filteredListingsByStore = useMemo(() => {
        let results = [...listingsByStore];
        if (activeFilters.includes('Over 4.5★')) {
            results = results.filter(item => item.store.rating >= 4.5);
        }
        if (activeFilters.includes('Verified Only')) {
            results = results.filter(item => item.store.isVerified);
        }
        return results;
    }, [listingsByStore, activeFilters]);

    const scroll = (key: string, dir: 'left' | 'right') => {
        const el = sliderRefs.current.get(key);
        if (el) el.scrollBy({ left: dir === 'left' ? -480 : 480, behavior: 'smooth' });
    };

    const toggleFilter = (filter: string) => {
        setActiveFilters(prev => 
            prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
        );
    };

    if (loading) {
        return (
            <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-10 bg-white dark:bg-slate-900 min-h-screen animate-pulse">
                <div className="h-8 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-10 bg-white dark:bg-slate-900 min-h-screen">
            
            {/* Title Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                    {title} Stores Near You
                </h1>
            </div>

            {/* DoorDash Style Filter Pills */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none hide-scrollbar">
                {['Over 4.5★', 'Verified Only', 'Under 30 min', 'Fastest'].map((filter) => {
                    const active = activeFilters.includes(filter);
                    return (
                        <button
                            key={filter}
                            onClick={() => toggleFilter(filter)}
                            className={`px-4 py-2 rounded-full border text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                                active
                                    ? 'bg-[#FF3008] border-transparent text-white shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                            }`}
                        >
                            {filter === 'Over 4.5★' ? (
                                <span className="flex items-center gap-1">
                                    <Star className={`h-3 w-3 ${active ? 'fill-current' : 'fill-amber-400 text-amber-400'}`} />
                                    {filter}
                                </span>
                            ) : filter}
                        </button>
                    );
                })}
            </div>

            {/* STORES NEAR YOU GRID */}
            {filteredStores.length > 0 ? (
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Stores Near You</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredStores.map(store => (
                            <CategoryStoreCard key={store.id} store={store} category={category} />
                        ))}
                    </div>
                </section>
            ) : (
                <div className="py-14 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-gray-400">
                    No stores found in this category matching your filters.
                </div>
            )}

            {/* PROMO BANNER */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative overflow-hidden">
                <div className="space-y-2 max-w-xl z-10">
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-lg font-black text-xs uppercase tracking-wide">Promo Deal</span>
                    <h3 className="text-lg sm:text-xl font-black font-poppins leading-tight">Secure Trade Escrow Protection enabled for all local purchases.</h3>
                    <p className="text-xs text-amber-50/90 font-medium">Verify your items with the driver before payouts are finalized.</p>
                </div>
                <button className="sm:self-center shrink-0 w-max bg-white text-orange-600 font-extrabold px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm text-xs cursor-pointer z-10">
                    Browse escrow details
                </button>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 translate-x-20 hidden md:block" />
            </div>

            {/* STORE SHOWCASE SLIDERS (Snacks / Items from stores) */}
            {filteredListingsByStore.length > 0 && (
                <div className="space-y-12">
                    {filteredListingsByStore.map(({ store, listings }) => {
                        const sliderKey = `${store.id}-slider`;
                        return (
                            <section key={store.id} className="space-y-4">
                                {/* Header with slider controls */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 leading-tight">
                                            Featured from {store.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            From {store.name} · {store.time}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/shop/${store.slug}?category=${encodeURIComponent(category)}`} className="text-xs font-bold text-[#FF3008] hover:underline mr-2">
                                            See All
                                        </Link>
                                        <button 
                                            onClick={() => scroll(sliderKey, 'left')}
                                            className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => scroll(sliderKey, 'right')}
                                            className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Product slider list */}
                                <div 
                                    ref={el => { sliderRefs.current.set(sliderKey, el); }}
                                    className="flex gap-4 overflow-x-auto pb-2 scrollbar-none hide-scrollbar scroll-smooth"
                                >
                                    {listings.map(listing => (
                                        <CategoryProductCard 
                                            key={listing.id}
                                            listing={listing}
                                            onAddToCart={() => addItem({
                                                id: String(listing.id),
                                                title: field(listing.title_en, listing.title_so) || 'Product',
                                                price: listing.price,
                                                quantity: 1,
                                                image: listing.images?.[0] ? resolveMediaUrl(listing.images[0]) || '/categories/grocery.jpg' : '/categories/grocery.jpg'
                                            })}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}


        </div>
    );
}
