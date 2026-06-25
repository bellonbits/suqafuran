"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ChevronRight, ChevronLeft, ShieldCheck, Star,
    Store, Tag, MapPin, ArrowRight,
} from 'lucide-react';
import { listingsService } from '../../../services/listings';
import { businessService } from '../../../services/business';
import { resolveMediaUrl } from '../../../services/api';
import { deriveStoresFromListings } from '../../../lib/deriveStores';
import { StoreListingCard } from '../../../components/shared/StoreListingCard';
import { getCategoryIcon } from '../../../lib/categoryIcons';
import { useLocationStore } from '../../../store/useLocation';
import { useLocalizedField, useT } from '../../../lib/i18n';
import { LocationPickerModal } from '../../../components/shared/LocationPickerModal';
import type { Listing, Category as DbCategory, Business } from '../../../types';

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY GROUP CONFIG
   Maps a group label → { banner image, accent colour, slug for "See All" href }
   The banner images live at /categories/<filename>.jpg — drop them in public/categories/.
   Fallback colour is used if the image hasn't been added yet.
───────────────────────────────────────────────────────────────────────────── */
interface GroupConfig {
    banner: string;
    color: string; // gradient fallback when image missing
    href: string;
}

const GROUP_CONFIG: Record<string, GroupConfig> = {
    'Food & Groceries':  { banner: '/categories/grocery.jpg',     color: 'from-emerald-600 to-green-400',   href: '/food-groceries' },
    'Health & Beauty':   { banner: '/categories/skincare.jpg',    color: 'from-pink-500 to-rose-400',       href: '/health-beauty' },
    'Sports & Fitness':  { banner: '/categories/sport.jpg',       color: 'from-sky-600 to-blue-400',        href: '/sports' },
    'Fashion':           { banner: '/categories/fashion.jpg',     color: 'from-fuchsia-500 to-pink-400',    href: '/clothing-shoes' },
    'Electronics':       { banner: '/categories/electronics.jpg', color: 'from-indigo-600 to-violet-400',  href: '/electronics' },
    'Home & Furniture':  { banner: '/categories/furniture.jpg',   color: 'from-amber-500 to-orange-400',   href: '/household-items' },
    'Vehicles':          { banner: '/categories/vehicles.jpg',    color: 'from-slate-700 to-slate-500',    href: '/vehicles' },
    'Livestock':         { banner: '/categories/livestock.jpg',   color: 'from-lime-600 to-green-400',     href: '/livestock' },
    'Real Estate':       { banner: '/categories/property.jpg',    color: 'from-teal-600 to-cyan-400',      href: '/property' },
    'Services':          { banner: '/categories/services.jpg',    color: 'from-orange-500 to-amber-400',   href: '/services' },
};

function getGroupConfig(key: string): GroupConfig {
    return GROUP_CONFIG[key] ?? {
        banner: '/categories/grocery.jpg',
        color: 'from-sky-500 to-blue-400',
        href: `/search?q=${encodeURIComponent(key)}`,
    };
}

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY NORMALIZER — maps raw business.category → a canonical group label
───────────────────────────────────────────────────────────────────────────── */
function normalizeGroup(category: string): string {
    const lc = (category || '').toLowerCase().trim();
    if (!lc) return 'Other';
    if (lc.includes('food') || lc.includes('grocer') || lc.includes('farm') || lc.includes('agri') || lc.includes('vegetable') || lc.includes('market')) return 'Food & Groceries';
    if (lc.includes('sport') || lc.includes('fitness') || lc.includes('gym')) return 'Sports & Fitness';
    if (lc.includes('beauty') || lc.includes('health') || lc.includes('skin') || lc.includes('cosmet') || lc.includes('personal care')) return 'Health & Beauty';
    if (lc.includes('cloth') || lc.includes('fashion') || lc.includes('shoe') || lc.includes('apparel') || lc.includes('dress')) return 'Fashion';
    if (lc.includes('electron') || lc.includes('tech') || lc.includes('gadget') || lc.includes('phone') || lc.includes('computer')) return 'Electronics';
    if (lc.includes('home') || lc.includes('furniture') || lc.includes('household') || lc.includes('sofa') || lc.includes('decor')) return 'Home & Furniture';
    if (lc.includes('vehicle') || lc.includes('car') || lc.includes('auto') || lc.includes('motor') || lc.includes('bike')) return 'Vehicles';
    if (lc.includes('livestock') || lc.includes('animal') || lc.includes('camel') || lc.includes('goat')) return 'Livestock';
    if (lc.includes('real estate') || lc.includes('property') || lc.includes('land') || lc.includes('house rental')) return 'Real Estate';
    if (lc.includes('service') || lc.includes('consult') || lc.includes('repair') || lc.includes('job')) return 'Services';
    // capitalise raw as catch-all
    return category.charAt(0).toUpperCase() + category.slice(1);
}

/** Preferred display order */
const GROUP_ORDER = [
    'Food & Groceries', 'Health & Beauty', 'Sports & Fitness',
    'Fashion', 'Electronics', 'Home & Furniture',
    'Vehicles', 'Livestock', 'Real Estate', 'Services',
];

function sortGroups(keys: string[]): string[] {
    const ordered = GROUP_ORDER.filter(g => keys.includes(g));
    const rest = keys.filter(g => !GROUP_ORDER.includes(g)).sort();
    return [...ordered, ...rest];
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHOP IMAGE RESOLUTION
   Prefer logo_url; fall back to the category's banner image.
───────────────────────────────────────────────────────────────────────────── */
function shopImage(biz: Business, groupKey: string): string {
    if (biz.logo_url) {
        const resolved = resolveMediaUrl(biz.logo_url);
        if (resolved) return resolved;
    }
    return getGroupConfig(groupKey).banner;
}

/* ─────────────────────────────────────────────────────────────────────────────
   DEAL CARD (negotiable listing)
───────────────────────────────────────────────────────────────────────────── */
function DealCard({ listing }: { listing: Listing }) {
    const img = listing.images?.[0]
        ? resolveMediaUrl(listing.images[0]) || '/categories/grocery.jpg'
        : '/categories/grocery.jpg';
    return (
        <Link
            href={`/listings/${listing.id}`}
            className="w-60 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-md transition-all p-3 group cursor-pointer"
        >
            <div className="h-32 rounded-xl overflow-hidden mb-3 relative bg-slate-100">
                <img src={img} alt={listing.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Negotiable</span>
            </div>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-xs truncate">{listing.title_en}</h3>
            <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-black text-sky-600">{listing.currency} {listing.price.toLocaleString()}</span>
                {listing.owner?.is_verified && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
            </div>
            {listing.location && <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">{listing.location.split(',')[0]}</p>}
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BUSINESS SHOP CARD — DoorDash style
───────────────────────────────────────────────────────────────────────────── */
function ShopCard({ biz, groupKey }: { biz: Business; groupKey: string }) {
    const img = shopImage(biz, groupKey);
    return (
        <Link
            href={`/shop/${biz.slug}`}
            className="w-64 shrink-0 group cursor-pointer"
        >
            {/* Thumbnail */}
            <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 mb-2.5">
                <img
                    src={img}
                    alt={biz.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {biz.is_verified && (
                    <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <ShieldCheck className="h-2.5 w-2.5" /> Verified
                    </span>
                )}
            </div>
            {/* Meta */}
            <div className="space-y-0.5 px-0.5">
                <h3 className="font-black text-sm text-gray-900 dark:text-slate-100 truncate group-hover:text-sky-500 transition-colors">{biz.name}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold">
                    <Star className="h-3 w-3 fill-orange-400 text-orange-400 shrink-0" />
                    <span>{biz.rating ? biz.rating.toFixed(1) : '4.5'}</span>
                    {biz.address && (
                        <>
                            <span className="text-gray-300">·</span>
                            <span className="truncate max-w-[130px]">{biz.address.split(',')[0]}</span>
                        </>
                    )}
                </div>
                {biz.tagline && (
                    <p className="text-[10px] text-gray-400 truncate">{biz.tagline}</p>
                )}
            </div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY SECTION — banner header + horizontal slider of shops
───────────────────────────────────────────────────────────────────────────── */
interface CategorySectionProps {
    groupKey: string;
    businesses: Business[];
    sliderRef: (el: HTMLDivElement | null) => void;
    onLeft: () => void;
    onRight: () => void;
}

function CategorySection({ groupKey, businesses, sliderRef, onLeft, onRight }: CategorySectionProps) {
    const cfg = getGroupConfig(groupKey);
    const [imgError, setImgError] = useState(false);

    return (
        <section className="space-y-4">
            {/* Category Banner Header */}
            <div className="relative h-28 sm:h-32 rounded-2xl overflow-hidden">
                {/* Gradient fallback always rendered under the image */}
                <div className={`absolute inset-0 bg-gradient-to-r ${cfg.color}`} />
                {/* Actual banner image on top; hide on error so gradient shows */}
                {!imgError && (
                    <img
                        src={cfg.banner}
                        alt={groupKey}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                )}
                {/* Dark overlay for text legibility */}
                <div className="absolute inset-0 bg-black/35" />
                {/* Text + See All */}
                <div className="absolute inset-0 flex items-end justify-between px-5 pb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow">{groupKey}</h2>
                        <p className="text-xs text-white/75 font-semibold mt-0.5">{businesses.length} shop{businesses.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={cfg.href}
                            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-black px-3.5 py-1.5 rounded-full transition-colors"
                        >
                            See All <ArrowRight className="h-3 w-3" />
                        </Link>
                        <div className="hidden sm:flex gap-1">
                            <button onClick={onLeft} className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full transition-colors cursor-pointer">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button onClick={onRight} className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full transition-colors cursor-pointer">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal shop slider */}
            <div
                ref={sliderRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-none hide-scrollbar scroll-smooth"
            >
                {businesses.map(biz => (
                    <ShopCard key={biz.id} biz={biz} groupKey={groupKey} />
                ))}
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────────────────────────────────────── */
function Skeleton() {
    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-10 bg-white dark:bg-slate-900 min-h-screen animate-pulse">
            <div className="h-9 w-56 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="flex gap-3 overflow-x-auto pb-2">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 w-28 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0" />)}
            </div>
            {[1,2,3].map(i => (
                <div key={i} className="space-y-4">
                    <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    <div className="flex gap-4 overflow-x-hidden">
                        {[1,2,3,4].map(j => (
                            <div key={j} className="w-64 shrink-0 space-y-2">
                                <div className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                                <div className="h-4 w-40 bg-slate-100 dark:bg-slate-700 rounded-full" />
                                <div className="h-3 w-28 bg-slate-100 dark:bg-slate-700 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN HOME PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
    const router = useRouter();
    const t = useT();
    const field = useLocalizedField();

    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
    const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
    const [dealListings, setDealListings] = useState<Listing[]>([]);
    const [p2pListings, setP2pListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [activeCategorySlug, setActiveCategorySlug] = useState('all');
    const [activeDirectoryTab, setActiveDirectoryTab] = useState<'cities'|'categories'|'stores'>('cities');

    const city = useLocationStore(s => s.city);
    const lat  = useLocationStore(s => s.lat);
    const lng  = useLocationStore(s => s.lng);
    const cityFilter = city?.split(',')[0]?.trim();

    // One ref-map per group key for horizontal scroll
    const sliderRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const dealsSliderRef = useRef<HTMLDivElement>(null);

    // ── Fetch ───────────────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                const [cats, bizzes, listings] = await Promise.all([
                    listingsService.getCategories(),
                    businessService.getNearbyShops(lat && lng ? { lat, lng, limit: 200 } : { limit: 200 }),
                    listingsService.getListings(cityFilter ? { location: cityFilter } : undefined),
                ]);
                setDbCategories(cats || []);
                setAllBusinesses((bizzes || []).filter(b => b.is_active !== false));
                const ls = listings || [];
                setDealListings(ls.filter(l => l.is_negotiable));
                setP2pListings(ls);
            } catch (e) {
                console.error('Home load error:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [cityFilter, lat, lng]);

    // ── Group businesses by category ────────────────────────────────────────
    const categoryGroups = useMemo(() => {
        const map = new Map<string, Business[]>();
        for (const biz of allBusinesses) {
            const key = normalizeGroup(biz.category || '');
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(biz);
        }
        return map;
    }, [allBusinesses]);

    const sortedGroupKeys = sortGroups(Array.from(categoryGroups.keys()));

    // ── Category capsule pills (from DB) ────────────────────────────────────
    const pillCategories = [
        { name: 'All', slug: 'all' },
        ...dbCategories.map(cat => ({
            name: field(cat.name_en, cat.name_so).split(' (')[0],
            slug: cat.slug,
        })),
    ];

    // ── Filtered view when a pill is active ─────────────────────────────────
    const filteredBusinesses = useMemo(() => {
        if (activeCategorySlug === 'all') return [];
        const dbCat = dbCategories.find(c => c.slug === activeCategorySlug);
        if (!dbCat) return [];
        const label = field(dbCat.name_en, dbCat.name_so).split(' (')[0].toLowerCase();
        return allBusinesses.filter(biz => {
            const grp = normalizeGroup(biz.category || '').toLowerCase();
            return grp.includes(label) || label.includes(grp) || (biz.category || '').toLowerCase().includes(label);
        });
    }, [activeCategorySlug, allBusinesses, dbCategories, field]);

    // ── Scroll helpers ───────────────────────────────────────────────────────
    const scrollGroup = (key: string, dir: 'left'|'right') => {
        const el = sliderRefs.current.get(key);
        if (el) el.scrollBy({ left: dir === 'left' ? -480 : 480, behavior: 'smooth' });
    };
    const scrollDeals = (dir: 'left'|'right') => {
        if (dealsSliderRef.current) dealsSliderRef.current.scrollBy({ left: dir === 'left' ? -480 : 480, behavior: 'smooth' });
    };

    // ── P2P derived stores (fallback if no registered businesses) ────────────
    const p2pStores = useMemo(() => deriveStoresFromListings(p2pListings), [p2pListings]);

    // ── Directory data ───────────────────────────────────────────────────────
    const dirCities = ['Nairobi','Mogadishu','Hargeisa','Garowe','Baidoa','Kismayo','Mombasa','Berbera'];

    if (loading) return <Skeleton />;

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-10 bg-white dark:bg-slate-900 min-h-screen">

            {/* ── Category Capsule Pills ──────────────────────────────────── */}
            <section className="space-y-4">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-slate-100 tracking-tight">
                    {cityFilter ? `Shops in ${cityFilter}` : 'All Shops'}
                </h1>
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none hide-scrollbar">
                    {pillCategories.map((cat, idx) => {
                        const Icon = getCategoryIcon(cat.slug);
                        const active = activeCategorySlug === cat.slug;
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveCategorySlug(cat.slug)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer border ${
                                    active
                                        ? 'bg-[#1B1B1B] text-white border-transparent dark:bg-white dark:text-[#1B1B1B]'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── FILTERED VIEW (single category selected) ───────────────── */}
            {activeCategorySlug !== 'all' && (
                <section className="space-y-4">
                    {filteredBusinesses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredBusinesses.map(biz => (
                                <ShopCard key={biz.id} biz={biz} groupKey={normalizeGroup(biz.category || '')} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                            <Store className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                            <p className="text-sm font-semibold text-gray-400">No shops found in this category yet</p>
                        </div>
                    )}
                </section>
            )}

            {/* ── ALL CATEGORIES VIEW ────────────────────────────────────── */}
            {activeCategorySlug === 'all' && (
                <>
                    {sortedGroupKeys.length > 0 ? (
                        sortedGroupKeys.map(groupKey => {
                            const businesses = categoryGroups.get(groupKey) || [];
                            return (
                                <CategorySection
                                    key={groupKey}
                                    groupKey={groupKey}
                                    businesses={businesses}
                                    sliderRef={el => sliderRefs.current.set(groupKey, el)}
                                    onLeft={() => scrollGroup(groupKey, 'left')}
                                    onRight={() => scrollGroup(groupKey, 'right')}
                                />
                            );
                        })
                    ) : (
                        /* ── P2P FALLBACK (no registered Business records yet) ── */
                        p2pStores.length > 0 ? (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-950 dark:text-slate-100">Shops near you</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">{p2pStores.length} active seller{p2pStores.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <Link href="/stores" className="text-xs font-black text-gray-500 hover:text-sky-500">See All</Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {p2pStores.map(store => (
                                        <StoreListingCard key={store.id} store={store} />
                                    ))}
                                </div>
                            </section>
                        ) : (
                            <div className="py-20 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                                <Store className="h-14 w-14 mx-auto text-gray-200 mb-3" />
                                <p className="text-sm font-semibold text-gray-400">No shops yet — be the first to open one!</p>
                                <Link href="/dashboard" className="inline-block mt-4 text-xs font-black text-sky-500 hover:underline">Open a shop →</Link>
                            </div>
                        )
                    )}

                    {/* ── SuqaPass Banner ──────────────────────────────────── */}
                    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 p-8 text-white shadow-xl">
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 translate-x-10 pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full w-max">⚡ SuqaPass</p>
                                <h2 className="text-2xl md:text-3xl font-black leading-tight">Free delivery & priority access</h2>
                                <p className="text-sm opacity-90">Matched delivery, secure escrow, and priority seller verifications.</p>
                            </div>
                            <button className="shrink-0 bg-white text-sky-600 font-black px-6 py-3.5 rounded-full text-sm shadow-lg hover:bg-sky-50 active:scale-95 transition-all cursor-pointer">
                                Start free trial
                            </button>
                        </div>
                    </section>

                    {/* ── Deals for You ────────────────────────────────────── */}
                    {dealListings.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-gray-950 dark:text-slate-100">Deals for you</h2>
                                    <p className="text-xs text-gray-500 font-bold mt-0.5">Listings open to negotiation — make an offer</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link href="/deals" className="text-xs font-black text-gray-600 hover:text-sky-500">See All</Link>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => scrollDeals('left')} className="p-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => scrollDeals('right')} className="p-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div ref={dealsSliderRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-none hide-scrollbar scroll-smooth">
                                {dealListings.slice(0, 20).map(l => <DealCard key={l.id} listing={l} />)}
                            </div>
                        </section>
                    )}
                </>
            )}

            {/* ── Directory ────────────────────────────────────────────────── */}
            <section className="space-y-4 pt-6 border-t border-gray-100 dark:border-slate-800">
                <h2 className="text-lg font-black text-gray-950 dark:text-slate-100">{t('Get more from your neighborhood')}</h2>
                <div className="flex border-b border-gray-200 dark:border-slate-800">
                    {(['cities','categories','stores'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveDirectoryTab(tab)}
                            className={`px-4 py-2 text-xs font-black border-b-2 transition-colors cursor-pointer ${
                                activeDirectoryTab === tab
                                    ? 'border-[#1B1B1B] text-[#1B1B1B] dark:border-sky-400 dark:text-sky-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-700 dark:text-slate-500'
                            }`}
                        >
                            {tab === 'cities' ? 'Top Cities' : tab === 'categories' ? 'Top Categories' : 'Top Stores'}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
                    {activeDirectoryTab === 'cities' && dirCities.map((c, i) => (
                        <button key={i} onClick={() => useLocationStore.getState().setLocation(c, null, null)}
                            className="text-left text-xs font-semibold text-slate-600 hover:text-sky-500 dark:text-slate-300 transition-colors cursor-pointer">
                            {c}
                        </button>
                    ))}
                    {activeDirectoryTab === 'categories' && dbCategories.map((c, i) => (
                        <button key={i} onClick={() => setActiveCategorySlug(c.slug)}
                            className="text-left text-xs font-semibold text-slate-600 hover:text-sky-500 dark:text-slate-300 transition-colors cursor-pointer">
                            {field(c.name_en, c.name_so).split(' (')[0]}
                        </button>
                    ))}
                    {activeDirectoryTab === 'stores' && allBusinesses.slice(0, 12).map((b, i) => (
                        <button key={i} onClick={() => router.push(`/shop/${b.slug}`)}
                            className="text-left text-xs font-semibold text-slate-600 hover:text-sky-500 dark:text-slate-300 transition-colors cursor-pointer truncate">
                            {b.name}
                        </button>
                    ))}
                </div>
            </section>

            <LocationPickerModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
        </div>
    );
}
