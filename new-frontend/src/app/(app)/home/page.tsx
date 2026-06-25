"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ChevronRight, ChevronLeft, ShieldCheck, Star,
    Search, MapPin, Tag, Store,
} from 'lucide-react';
import { listingsService } from '../../../services/listings';
import { businessService } from '../../../services/business';
import { resolveMediaUrl } from '../../../services/api';
import { StoreListingCard } from '../../../components/shared/StoreListingCard';
import { deriveStoresFromListings } from '../../../lib/deriveStores';
import { getCategoryIcon } from '../../../lib/categoryIcons';
import { useLocationStore } from '../../../store/useLocation';
import { useLocalizedField, useT } from '../../../lib/i18n';
import { useAuthModal } from '../../../store/useAuthModal';
import { LocationPickerModal } from '../../../components/shared/LocationPickerModal';
import type { Listing, Category as DbCategory, Business } from '../../../types';

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY → FALLBACK IMAGE MAP
   When a business has no logo, we pick the best category thumbnail we have.
   More keys will be added as the user uploads more category images.
───────────────────────────────────────────────────────────────────────────── */
const CATEGORY_FALLBACK: Record<string, string> = {
    // Food / Grocery
    grocery: '/categories/grocery.jpg',
    'food-groceries': '/categories/grocery.jpg',
    food: '/categories/grocery.jpg',
    'food & groceries': '/categories/grocery.jpg',
    vegetable: '/categories/grocery.jpg',
    market: '/categories/grocery.jpg',
    farm: '/categories/grocery.jpg',
    // Sports
    sport: '/categories/sport.jpg',
    sports: '/categories/sport.jpg',
    fitness: '/categories/sport.jpg',
    'sports & fitness': '/categories/sport.jpg',
    gym: '/categories/sport.jpg',
    // Beauty / Health
    beauty: '/categories/skincare.jpg',
    skincare: '/categories/skincare.jpg',
    health: '/categories/skincare.jpg',
    cosmetics: '/categories/skincare.jpg',
    'health-beauty': '/categories/skincare.jpg',
    'health & beauty': '/categories/skincare.jpg',
    'personal care': '/categories/skincare.jpg',
};

/** Return the best fallback image for a given business category string */
function getCategoryFallback(category: string): string {
    if (!category) return '/categories/skincare.jpg';
    const lower = category.toLowerCase();
    // exact match first
    if (CATEGORY_FALLBACK[lower]) return CATEGORY_FALLBACK[lower];
    // partial match
    for (const [key, url] of Object.entries(CATEGORY_FALLBACK)) {
        if (lower.includes(key) || key.includes(lower)) return url;
    }
    // generic fallback by keyword
    if (lower.includes('food') || lower.includes('grocer') || lower.includes('farm') || lower.includes('agri')) return '/categories/grocery.jpg';
    if (lower.includes('sport') || lower.includes('fitness') || lower.includes('gym')) return '/categories/sport.jpg';
    if (lower.includes('beauty') || lower.includes('health') || lower.includes('skin') || lower.includes('cosmet')) return '/categories/skincare.jpg';
    return '/categories/skincare.jpg';
}

/** Get a display image for a business: prefer logo_url, then category fallback */
function getBusinessImage(biz: Business): string {
    if (biz.logo_url) return resolveMediaUrl(biz.logo_url) || getCategoryFallback(biz.category);
    return getCategoryFallback(biz.category);
}

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY GROUPING HELPERS
───────────────────────────────────────────────────────────────────────────── */
/** Normalize a business category string into a canonical group key */
function normalizeCategoryKey(category: string): string {
    const lower = (category || '').toLowerCase().trim();
    if (!lower) return 'Other';
    if (lower.includes('food') || lower.includes('grocer') || lower.includes('farm') || lower.includes('agri')) return 'Food & Groceries';
    if (lower.includes('sport') || lower.includes('fitness') || lower.includes('gym')) return 'Sports & Fitness';
    if (lower.includes('beauty') || lower.includes('health') || lower.includes('skin') || lower.includes('cosmet')) return 'Health & Beauty';
    if (lower.includes('electron') || lower.includes('tech') || lower.includes('gadget')) return 'Electronics';
    if (lower.includes('cloth') || lower.includes('fashion') || lower.includes('shoe') || lower.includes('apparel')) return 'Fashion';
    if (lower.includes('home') || lower.includes('furniture') || lower.includes('household')) return 'Home & Furniture';
    if (lower.includes('vehicle') || lower.includes('car') || lower.includes('auto')) return 'Vehicles';
    if (lower.includes('service') || lower.includes('consult') || lower.includes('repair')) return 'Services';
    if (lower.includes('livestock') || lower.includes('animal')) return 'Livestock';
    if (lower.includes('real estate') || lower.includes('property')) return 'Real Estate';
    // Capitalize the raw value as a catch-all
    return category.charAt(0).toUpperCase() + category.slice(1);
}

/** Preferred display order for category groups */
const CATEGORY_ORDER = [
    'Food & Groceries',
    'Health & Beauty',
    'Sports & Fitness',
    'Fashion',
    'Electronics',
    'Home & Furniture',
    'Vehicles',
    'Services',
    'Livestock',
    'Real Estate',
];

function sortCategoryGroups(groups: string[]): string[] {
    const ordered = CATEGORY_ORDER.filter(g => groups.includes(g));
    const rest = groups.filter(g => !CATEGORY_ORDER.includes(g)).sort();
    return [...ordered, ...rest];
}

/* ─────────────────────────────────────────────────────────────────────────────
   REUSABLE HORIZONTAL SLIDER SECTION
───────────────────────────────────────────────────────────────────────────── */
interface SliderSectionProps {
    title: string;
    subtitle?: string;
    seeAllHref?: string;
    children: React.ReactNode;
    sliderRef: React.RefObject<HTMLDivElement | null>;
    onScrollLeft: () => void;
    onScrollRight: () => void;
}

function SliderSection({ title, subtitle, seeAllHref, children, sliderRef, onScrollLeft, onScrollRight }: SliderSectionProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">{title}</h2>
                    {subtitle && <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-3">
                    {seeAllHref && (
                        <Link href={seeAllHref} className="text-xs font-black text-gray-600 hover:text-sky-500 dark:text-slate-400 cursor-pointer">
                            See All
                        </Link>
                    )}
                    <div className="flex gap-1.5">
                        <button onClick={onScrollLeft} className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button onClick={onScrollRight} className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
            <div ref={sliderRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar scroll-smooth">
                {children}
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BUSINESS STORE CARD
───────────────────────────────────────────────────────────────────────────── */
function BusinessStoreCard({ biz }: { biz: Business }) {
    const image = getBusinessImage(biz);
    return (
        <Link
            href={`/shop/${biz.slug}`}
            className="w-72 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
        >
            <div className="h-40 bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                <img
                    src={image}
                    alt={biz.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {biz.is_verified && (
                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                )}
                {biz.tagline && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                        <p className="text-white text-[10px] font-bold truncate">{biz.tagline}</p>
                    </div>
                )}
            </div>
            <div className="p-4 space-y-1.5">
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">{biz.name}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
                    <Star className="h-3 w-3 text-orange-400 fill-orange-400" />
                    <span>{biz.rating?.toFixed(1) || '4.5'}</span>
                    <span>·</span>
                    {biz.address && <span className="truncate max-w-[120px]">{biz.address.split(',')[0]}</span>}
                    {biz.trust_score > 800 && (
                        <>
                            <span>·</span>
                            <span className="text-sky-500">Trusted</span>
                        </>
                    )}
                </div>
                {biz.category && (
                    <span className="inline-block text-[10px] font-bold text-gray-400 dark:text-slate-500 capitalize">
                        {biz.category}
                    </span>
                )}
            </div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DEALS CARD (negotiable listing)
───────────────────────────────────────────────────────────────────────────── */
function DealCard({ listing }: { listing: Listing }) {
    const image = listing.images?.[0]
        ? resolveMediaUrl(listing.images[0]) || getCategoryFallback('')
        : getCategoryFallback('');

    return (
        <Link
            href={`/listings/${listing.id}`}
            className="w-64 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-md transition-all p-3 cursor-pointer group"
        >
            <div className="h-32 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden mb-3 relative">
                <img src={image} alt={listing.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Negotiable</span>
            </div>
            <div className="space-y-1">
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-xs truncate">{listing.title_en}</h3>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                        {listing.currency} {listing.price.toLocaleString()}
                    </span>
                    {listing.owner?.is_verified && (
                        <span className="text-[9px] font-black text-emerald-500 flex items-center gap-0.5">
                            <ShieldCheck className="h-2.5 w-2.5" /> Verified
                        </span>
                    )}
                </div>
                {listing.location && (
                    <p className="text-[10px] text-gray-400 font-semibold truncate">{listing.location.split(',')[0]}</p>
                )}
            </div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN HOME PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
    const router = useRouter();
    const t = useT();
    const openAuthModal = useAuthModal((s) => s.open);

    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
    const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
    const [dealListings, setDealListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [activeDirectoryTab, setActiveDirectoryTab] = useState<'cities' | 'categories' | 'stores'>('cities');

    const city = useLocationStore((s) => s.city);
    const lat = useLocationStore((s) => s.lat);
    const lng = useLocationStore((s) => s.lng);
    const cityFilter = city?.split(',')[0]?.trim();
    const field = useLocalizedField();

    // Map of category group → ref for slider
    const sliderRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const dealsSliderRef = useRef<HTMLDivElement>(null);
    const popularSliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [fetchedCategories, fetchedBusinesses, fetchedListings] = await Promise.all([
                    listingsService.getCategories(),
                    businessService.getNearbyShops(lat && lng ? { lat, lng, limit: 100 } : { limit: 100 }),
                    listingsService.getListings(),
                ]);

                setDbCategories(fetchedCategories || []);
                setAllBusinesses(fetchedBusinesses || []);
                // deals = negotiable listings
                setDealListings((fetchedListings || []).filter(l => l.is_negotiable));
            } catch (err) {
                console.error('Error loading home data:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [cityFilter, lat, lng]);

    // ── Group businesses by category ──────────────────────────────────────────
    const categoryGroups = React.useMemo<Map<string, Business[]>>(() => {
        const map = new Map<string, Business[]>();
        for (const biz of allBusinesses) {
            if (!biz.is_active) continue;
            const key = normalizeCategoryKey(biz.category || '');
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(biz);
        }
        return map;
    }, [allBusinesses]);

    const sortedGroupKeys = sortCategoryGroups(Array.from(categoryGroups.keys()));

    // ── Category pill filter (uses DB categories from API) ────────────────────
    const categories = [
        { name: 'All', slug: 'all' },
        ...dbCategories.map(cat => ({
            name: field(cat.name_en, cat.name_so).split(' (')[0],
            slug: cat.slug,
        })),
    ];

    // ── Filter businesses for "Most popular" grid by capsule selection ─────────
    const filteredAllBusiness = React.useMemo(() => {
        return allBusinesses.filter(biz => {
            if (!biz.is_active) return false;
            if (verifiedOnly && !biz.is_verified) return false;
            if (activeCategory !== 'all') {
                const key = normalizeCategoryKey(biz.category || '');
                // match by db slug or group label
                const dbCat = dbCategories.find(c => c.slug === activeCategory);
                const targetLabel = dbCat ? field(dbCat.name_en, dbCat.name_so).split(' (')[0] : activeCategory;
                if (!key.toLowerCase().includes(targetLabel.toLowerCase()) && !targetLabel.toLowerCase().includes(key.toLowerCase())) return false;
            }
            return true;
        });
    }, [allBusinesses, activeCategory, verifiedOnly, dbCategories, field]);

    // ── Scroll helpers ────────────────────────────────────────────────────────
    const scrollSlider = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
        if (ref.current) ref.current.scrollBy({ left: dir === 'left' ? -450 : 450, behavior: 'smooth' });
    };

    const scrollGroupSlider = (key: string, dir: 'left' | 'right') => {
        const el = sliderRefs.current.get(key);
        if (el) el.scrollBy({ left: dir === 'left' ? -450 : 450, behavior: 'smooth' });
    };

    // ── Directory data ────────────────────────────────────────────────────────
    const directoryCities = [
        { name: 'Nairobi', query: 'Nairobi' },
        { name: 'Mogadishu', query: 'Mogadishu' },
        { name: 'Hargeisa', query: 'Hargeisa' },
        { name: 'Garowe', query: 'Garowe' },
        { name: 'Baidoa', query: 'Baidoa' },
        { name: 'Kismayo', query: 'Kismayo' },
        { name: 'Mombasa', query: 'Mombasa' },
        { name: 'Berbera', query: 'Berbera' },
    ];

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none hide-scrollbar">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-10 w-28 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse shrink-0" />
                    ))}
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-4">
                        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar">
                            {[1, 2, 3, 4].map(j => (
                                <div key={j} className="w-72 h-60 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse shrink-0" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">

            {/* ── Category Capsule Pills ──────────────────────────────────────── */}
            <section id="categories-section" className="space-y-3 pt-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                    What are you looking for?
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none hide-scrollbar">
                    {categories.map((cat, idx) => {
                        const Icon = getCategoryIcon(cat.slug);
                        const isActive = activeCategory === cat.slug;
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveCategory(cat.slug)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-black shrink-0 transition-all cursor-pointer ${isActive
                                    ? 'bg-sky-500 text-white border-transparent shadow shadow-sky-500/25'
                                    : 'bg-slate-100 hover:bg-slate-200 text-gray-700 border-transparent dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <span className={`p-1 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-700 dark:bg-slate-900 dark:text-slate-200'} flex items-center justify-center shrink-0`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </span>
                                <span>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── Category-grouped shop sliders ───────────────────────────────── */}
            {activeCategory === 'all' ? (
                sortedGroupKeys.length > 0 ? (
                    sortedGroupKeys.map(groupKey => {
                        const businesses = categoryGroups.get(groupKey) || [];
                        // Build the slug for "See All" – map group label back to a useful route
                        const seeAllSlug = groupKey.toLowerCase().replace(/\s+/g, '-').replace(/[&]/g, '').replace(/--/g, '-');
                        return (
                            <section key={groupKey} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">{groupKey}</h2>
                                        <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                                            {businesses.length} shop{businesses.length !== 1 ? 's' : ''} available
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link href={`/${seeAllSlug}`} className="text-xs font-black text-gray-600 hover:text-sky-500 dark:text-slate-400 cursor-pointer">
                                            See All
                                        </Link>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => scrollGroupSlider(groupKey, 'left')} className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => scrollGroupSlider(groupKey, 'right')} className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    ref={el => { sliderRefs.current.set(groupKey, el); }}
                                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar scroll-smooth"
                                >
                                    {businesses.map(biz => <BusinessStoreCard key={biz.id} biz={biz} />)}
                                </div>
                            </section>
                        );
                    })
                ) : (
                    /* No businesses from API yet — show derived stores from listings */
                    <NoBusinessFallback />
                )
            ) : (
                /* Filtered view */
                <section id="popular-section" className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                                {categories.find(c => c.slug === activeCategory)?.name || 'Shops'}
                            </h2>
                            <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                                {filteredAllBusiness.length} shop{filteredAllBusiness.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        <button
                            onClick={() => setVerifiedOnly(v => !v)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold shrink-0 transition-all cursor-pointer ${verifiedOnly ? 'bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900' : 'bg-white border-gray-200 text-gray-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50'}`}
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified
                        </button>
                    </div>

                    {filteredAllBusiness.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredAllBusiness.map(biz => <BusinessStoreCard key={biz.id} biz={biz} />)}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                            <Store className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                            No shops found in this category yet
                        </div>
                    )}
                </section>
            )}

            {/* ── SuqaPass Banner ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 p-8 shadow-lg text-white">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 translate-x-10 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2.5 text-left flex-1">
                        <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                            ⚡ SUQAPASS
                        </div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-poppins tracking-tight leading-none">
                            Unlock free delivery & priority
                        </h3>
                        <p className="text-sm opacity-95 font-bold max-w-xl">
                            Get free delivery on matched orders, priority verification badges, and secure P2P escrow trading.
                        </p>
                    </div>
                    <button className="bg-white hover:bg-slate-50 text-sky-600 font-black px-6 py-3.5 rounded-full text-xs shadow-md active:scale-95 transition-all shrink-0 cursor-pointer">
                        Start free trial
                    </button>
                </div>
            </section>

            {/* ── Deals for You (negotiable listings) ─────────────────────────── */}
            {dealListings.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">Deals for you</h2>
                            <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">Listings open to negotiation — make an offer</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/deals" className="text-xs font-black text-gray-600 hover:text-sky-500 dark:text-slate-400 cursor-pointer">
                                See All
                            </Link>
                            <div className="flex gap-1.5">
                                <button onClick={() => scrollSlider(dealsSliderRef, 'left')} className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button onClick={() => scrollSlider(dealsSliderRef, 'right')} className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div ref={dealsSliderRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar scroll-smooth">
                        {dealListings.slice(0, 20).map(listing => <DealCard key={listing.id} listing={listing} />)}
                    </div>
                </section>
            )}

            {/* ── Directory section ────────────────────────────────────────────── */}
            <section className="space-y-4 pt-8 border-t border-gray-100 dark:border-slate-800/80">
                <div>
                    <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                        {t("Get more from your neighborhood")}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                        Discover top shops and categories near you
                    </p>
                </div>

                <div className="flex border-b border-gray-200 dark:border-slate-800">
                    {(['cities', 'categories', 'stores'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveDirectoryTab(tab)}
                            className={`px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${activeDirectoryTab === tab
                                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400'
                                }`}
                        >
                            {tab === 'cities' ? t("Top Cities") : tab === 'categories' ? t("Top Categories") : t("Top Storefronts")}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-3">
                    {activeDirectoryTab === 'cities' && directoryCities.map((c, i) => (
                        <button key={i} onClick={() => useLocationStore.getState().setLocation(c.query, null, null)} className="text-left text-xs font-semibold text-slate-700 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400 transition-colors cursor-pointer">
                            {c.name}
                        </button>
                    ))}
                    {activeDirectoryTab === 'categories' && dbCategories.map((c, i) => (
                        <button key={i} onClick={() => setActiveCategory(c.slug)} className="text-left text-xs font-semibold text-slate-700 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400 transition-colors cursor-pointer">
                            {field(c.name_en, c.name_so).split(' (')[0]}
                        </button>
                    ))}
                    {activeDirectoryTab === 'stores' && allBusinesses.slice(0, 12).map((b, i) => (
                        <button key={i} onClick={() => router.push(`/shop/${b.slug}`)} className="text-left text-xs font-semibold text-slate-700 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400 transition-colors cursor-pointer truncate">
                            {b.name}
                        </button>
                    ))}
                </div>
            </section>

            <LocationPickerModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FALLBACK: No registered businesses yet → derive P2P seller stores from listings
───────────────────────────────────────────────────────────────────────────── */
function NoBusinessFallback() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        listingsService.getListings().then(data => { setListings(data || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const stores = deriveStoresFromListings(listings);

    if (loading) return null;
    if (stores.length === 0) {
        return (
            <div className="py-16 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                <Store className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                No shops available yet. Be the first to open a store!
            </div>
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">Shops near you</h2>
                    <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">Active sellers in your area</p>
                </div>
                <Link href="/stores" className="text-xs font-black text-gray-600 hover:text-sky-500 dark:text-slate-400">See All</Link>
            </div>
            <div ref={sliderRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar scroll-smooth">
                {stores.map(store => (
                    <div key={store.id} className="w-64 shrink-0">
                        <StoreListingCard store={store} />
                    </div>
                ))}
            </div>
        </section>
    );
}
