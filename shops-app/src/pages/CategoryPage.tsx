"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'react-router-dom';
import { ChevronRight, Star, ShieldCheck, ShoppingBag } from 'lucide-react';
import { listingsService } from '@/services/listings';
import api, { resolveMediaUrl } from '@/services/api';
import type { Listing } from '@/types';
import { CANONICAL_CATEGORIES } from '@/components/shared/Sidebar';
import { ProductCard } from '@/components/features/ProductCard';
import { ProductCarouselSection } from '@/components/shared/ProductCarouselSection';
import { getMockProductInfo } from '@/lib/mockProductInfo';

interface Store {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    image?: string;
    rating: number;
    distance: string;
    isVerified: boolean;
    trust_score: number;
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
                <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {Math.round(store.rating * 20)}%
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                    {store.distance}
                </p>
            </div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function CategoryPage() {
    const { category = '' } = useParams<{ category: string }>();

    const [title, setTitle] = useState('');
    const [stores, setStores] = useState<Store[]>([]);
    const [listingsByStore, setListingsByStore] = useState<{ store: Store; listings: Listing[] }[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

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
                            const storeName = l.owner.business_name || l.owner.full_name || "Local Seller";
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

    const toggleFilter = (filter: string) => {
        setActiveFilters(prev => 
            prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
        );
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 min-h-screen">
                <div className="max-w-[1440px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-10 animate-pulse">
                    <div className="h-8 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen">
            <div className="max-w-[1440px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-10">

            {/* Title Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                    {title} Stores Near You
                </h1>
            </div>

            {/* DoorDash Style Filter Pills */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none hide-scrollbar">
                {['Over 4.5★', 'Verified Only'].map((filter) => {
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

            {/* STORES NEAR YOU */}
            {filteredStores.length > 0 ? (
                <ProductCarouselSection title="Stores Near You">
                    {filteredStores.map(store => (
                        <div key={store.id} className="w-[280px] sm:w-[320px] shrink-0">
                            <CategoryStoreCard store={store} category={category} />
                        </div>
                    ))}
                </ProductCarouselSection>
            ) : (
                <div className="py-14 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-gray-400">
                    No stores found in this category matching your filters.
                </div>
            )}

            {/* STORE SHOWCASE SLIDERS (Snacks / Items from stores) */}
            {filteredListingsByStore.length > 0 && (
                <div>
                    {filteredListingsByStore.map(({ store, listings }) => (
                        <ProductCarouselSection
                            key={store.id}
                            title={`Featured from ${store.name}`}
                            subtitle={`${Math.round(store.rating * 20)}% rating`}
                            viewAllHref={`/shop/${store.slug}?category=${encodeURIComponent(category)}`}
                        >
                            {listings.map((listing) => {
                                const { discountPercent, originalPrice } = getMockProductInfo(listing);
                                return (
                                    <div key={listing.id} className="w-[160px] sm:w-[190px] shrink-0">
                                        <ProductCard
                                            listing={listing}
                                            categoryName={title}
                                            discountPercent={discountPercent}
                                            originalPrice={originalPrice}
                                        />
                                    </div>
                                );
                            })}
                        </ProductCarouselSection>
                    ))}
                </div>
            )}

            </div>
        </div>
    );
}

