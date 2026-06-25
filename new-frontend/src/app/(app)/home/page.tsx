"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ChevronRight, ChevronLeft, ShieldCheck, Star, Store,
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
   CATEGORY → fallback shop thumbnail
   Drop your own into /public/categories/<filename>.jpg whenever ready.
───────────────────────────────────────────────────────────────────────────── */
const FALLBACK: Record<string, string> = {
    'Food & Groceries': '/categories/grocery.jpg',
    'Health & Beauty':  '/categories/skincare.jpg',
    'Sports & Fitness': '/categories/sport.jpg',
    Fashion:            '/categories/fashion.jpg',
    Electronics:        '/categories/electronics.jpg',
    'Home & Furniture': '/categories/furniture.jpg',
    Vehicles:           '/categories/vehicles.jpg',
    Livestock:          '/categories/livestock.jpg',
    'Real Estate':      '/categories/property.jpg',
    Services:           '/categories/services.jpg',
};

function groupFallback(key: string) {
    return FALLBACK[key] ?? '/categories/grocery.jpg';
}

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY NORMALISER
───────────────────────────────────────────────────────────────────────────── */
function normalizeGroup(cat: string): string {
    const lc = (cat || '').toLowerCase().trim();
    if (!lc) return 'Other';
    if (lc.includes('food') || lc.includes('grocer') || lc.includes('farm') || lc.includes('agri') || lc.includes('vegetable') || lc.includes('market')) return 'Food & Groceries';
    if (lc.includes('sport') || lc.includes('fitness') || lc.includes('gym')) return 'Sports & Fitness';
    if (lc.includes('beauty') || lc.includes('health') || lc.includes('skin') || lc.includes('cosmet') || lc.includes('personal care')) return 'Health & Beauty';
    if (lc.includes('cloth') || lc.includes('fashion') || lc.includes('shoe') || lc.includes('apparel') || lc.includes('dress')) return 'Fashion';
    if (lc.includes('electron') || lc.includes('tech') || lc.includes('gadget') || lc.includes('phone') || lc.includes('computer')) return 'Electronics';
    if (lc.includes('home') || lc.includes('furniture') || lc.includes('household') || lc.includes('sofa') || lc.includes('decor')) return 'Home & Furniture';
    if (lc.includes('vehicle') || lc.includes('car') || lc.includes('auto') || lc.includes('motor') || lc.includes('bike')) return 'Vehicles';
    if (lc.includes('livestock') || lc.includes('animal') || lc.includes('camel') || lc.includes('goat')) return 'Livestock';
    if (lc.includes('real estate') || lc.includes('property') || lc.includes('land')) return 'Real Estate';
    if (lc.includes('service') || lc.includes('consult') || lc.includes('repair')) return 'Services';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
}

const GROUP_ORDER = ['Food & Groceries','Health & Beauty','Sports & Fitness','Fashion','Electronics','Home & Furniture','Vehicles','Livestock','Real Estate','Services'];

function sortGroups(keys: string[]) {
    return [...GROUP_ORDER.filter(g => keys.includes(g)), ...keys.filter(g => !GROUP_ORDER.includes(g)).sort()];
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHOP THUMBNAIL — prefer logo, else category fallback
───────────────────────────────────────────────────────────────────────────── */
function shopImg(biz: Business, group: string) {
    if (biz.logo_url) { const r = resolveMediaUrl(biz.logo_url); if (r) return r; }
    if (biz.banner_url) { const r = resolveMediaUrl(biz.banner_url); if (r) return r; }
    return groupFallback(group);
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHOP CARD — exact DoorDash proportions
   Wide image, then name / rating / info below
───────────────────────────────────────────────────────────────────────────── */
function ShopCard({ biz, group }: { biz: Business; group: string }) {
    const img = shopImg(biz, group);
    return (
        <Link href={`/shop/${biz.slug}`} className="shrink-0 w-[220px] sm:w-[240px] group cursor-pointer">
            {/* Image */}
            <div className="relative w-full h-[136px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src={img}
                    alt={biz.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {biz.is_verified && (
                    <span className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                        <ShieldCheck className="h-2.5 w-2.5" /> Verified
                    </span>
                )}
            </div>

            {/* Meta — exactly like DoorDash below the image */}
            <div className="mt-2 space-y-0.5 px-0.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate leading-snug">
                    {biz.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="font-semibold text-gray-700 dark:text-slate-200">{biz.rating ? biz.rating.toFixed(1) : '4.5'}</span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    {biz.address
                        ? <span className="truncate">{biz.address.split(',')[0]}</span>
                        : <span>Nearby</span>
                    }
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                    {biz.trust_score >= 800 ? 'Trusted seller' : 'Free to browse'}
                </p>
            </div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY SECTION — plain text header + horizontal scroll
   This is exactly the DoorDash pattern
───────────────────────────────────────────────────────────────────────────── */
function CategorySection({ group, businesses, seeAllHref, sliderRef, onLeft, onRight }: {
    group: string;
    businesses: Business[];
    seeAllHref: string;
    sliderRef: (el: HTMLDivElement | null) => void;
    onLeft: () => void;
    onRight: () => void;
}) {
    return (
        <section>
            {/* Section header — DoorDash style: bold title left, "See All" + chevrons right */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{group}</h2>
                <div className="flex items-center gap-2">
                    <Link href={seeAllHref} className="text-sm font-semibold text-gray-900 dark:text-slate-100 hover:underline">
                        See All
                    </Link>
                    <button
                        onClick={onLeft}
                        className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onRight}
                        className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Horizontal slider */}
            <div
                ref={sliderRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-none hide-scrollbar scroll-smooth"
            >
                {businesses.map(biz => (
                    <ShopCard key={biz.id} biz={biz} group={group} />
                ))}
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DEAL CARD
───────────────────────────────────────────────────────────────────────────── */
function DealCard({ listing }: { listing: Listing }) {
    const img = listing.images?.[0]
        ? resolveMediaUrl(listing.images[0]) || '/categories/grocery.jpg'
        : '/categories/grocery.jpg';
    return (
        <Link href={`/listings/${listing.id}`} className="shrink-0 w-[220px] sm:w-[240px] group cursor-pointer">
            <div className="relative h-[136px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src={img} alt={listing.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Negotiable</span>
            </div>
            <div className="mt-2 px-0.5 space-y-0.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{listing.title_en}</h3>
                <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">{listing.currency} {listing.price.toLocaleString()}</p>
                {listing.location && <p className="text-xs text-gray-400 truncate">{listing.location.split(',')[0]}</p>}
            </div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────────────────────────── */
function Skeleton() {
    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-10 animate-pulse min-h-screen bg-white dark:bg-slate-900">
            <div className="h-8 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            {/* Pills */}
            <div className="flex gap-2 overflow-hidden">
                {[...Array(8)].map((_, i) => <div key={i} className="h-9 w-24 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-full" />)}
            </div>
            {/* Sections */}
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                        {[...Array(4)].map((_, j) => (
                            <div key={j} className="shrink-0 w-[220px] space-y-2">
                                <div className="h-[136px] rounded-2xl bg-slate-100 dark:bg-slate-800" />
                                <div className="h-4 w-36 bg-slate-100 dark:bg-slate-700 rounded" />
                                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GROUP → ROUTE SLUG
───────────────────────────────────────────────────────────────────────────── */
const GROUP_ROUTES: Record<string, string> = {
    'Food & Groceries': '/food-groceries',
    'Health & Beauty':  '/health-beauty',
    'Sports & Fitness': '/sports',
    Fashion:            '/clothing-shoes',
    Electronics:        '/electronics',
    'Home & Furniture': '/household-items',
    Vehicles:           '/vehicles',
    Livestock:          '/livestock',
    'Real Estate':      '/property',
    Services:           '/services',
};

function groupRoute(key: string) {
    return GROUP_ROUTES[key] ?? `/search?q=${encodeURIComponent(key)}`;
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
    const [activePill, setActivePill] = useState('all');

    const city = useLocationStore(s => s.city);
    const lat  = useLocationStore(s => s.lat);
    const lng  = useLocationStore(s => s.lng);
    const cityLabel = city?.split(',')[0]?.trim() ?? '';

    const sliderRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const dealsRef   = useRef<HTMLDivElement>(null);

    // ── Fetch ────────────────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                const [cats, bizzes, listings] = await Promise.all([
                    listingsService.getCategories(),
                    businessService.getNearbyShops(lat && lng ? { lat, lng, limit: 200 } : { limit: 200 }),
                    listingsService.getListings(cityLabel ? { location: cityLabel } : undefined),
                ]);
                setDbCategories(cats || []);
                setAllBusinesses((bizzes || []).filter(b => b.is_active !== false));
                const ls = listings || [];
                setDealListings(ls.filter(l => l.is_negotiable));
                setP2pListings(ls);
            } catch (e) {
                console.error('Home load error', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [cityLabel, lat, lng]);

    // ── Group businesses ─────────────────────────────────────────────────────
    const groups = useMemo(() => {
        const map = new Map<string, Business[]>();
        for (const biz of allBusinesses) {
            const key = normalizeGroup(biz.category || '');
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(biz);
        }
        return map;
    }, [allBusinesses]);

    const sortedKeys = sortGroups(Array.from(groups.keys()));

    // ── Pill categories ──────────────────────────────────────────────────────
    const pills = [
        { name: 'All', slug: 'all' },
        ...dbCategories.map(c => ({ name: field(c.name_en, c.name_so).split(' (')[0], slug: c.slug })),
    ];

    // ── Filtered businesses for single-pill view ─────────────────────────────
    const pillFiltered = useMemo(() => {
        if (activePill === 'all') return [];
        const dbCat = dbCategories.find(c => c.slug === activePill);
        if (!dbCat) return [];
        const label = field(dbCat.name_en, dbCat.name_so).split(' (')[0].toLowerCase();
        return allBusinesses.filter(biz => {
            const grp = normalizeGroup(biz.category || '').toLowerCase();
            return grp.includes(label) || label.includes(grp) || (biz.category || '').toLowerCase().includes(label);
        });
    }, [activePill, allBusinesses, dbCategories, field]);

    // ── Scroll helpers ───────────────────────────────────────────────────────
    const scroll = (key: string, dir: 'left' | 'right') => {
        const el = sliderRefs.current.get(key);
        if (el) el.scrollBy({ left: dir === 'left' ? -520 : 520, behavior: 'smooth' });
    };
    const scrollDeals = (dir: 'left' | 'right') => {
        if (dealsRef.current) dealsRef.current.scrollBy({ left: dir === 'left' ? -520 : 520, behavior: 'smooth' });
    };

    // ── P2P fallback ─────────────────────────────────────────────────────────
    const p2pStores = useMemo(() => deriveStoresFromListings(p2pListings), [p2pListings]);

    if (loading) return <Skeleton />;

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 min-h-screen space-y-8">

            {/* ── Page title — "Rise and shine!" / "Shops in Nairobi" ───────── */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                {cityLabel ? `Shops in ${cityLabel}` : 'Rise and shine!'}
            </h1>

            {/* ── Category pill row — DoorDash icon + label style ───────────── */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none hide-scrollbar">
                {pills.map((pill, idx) => {
                    const Icon = getCategoryIcon(pill.slug);
                    const active = activePill === pill.slug;
                    return (
                        <button
                            key={idx}
                            onClick={() => setActivePill(pill.slug)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shrink-0 border transition-all cursor-pointer whitespace-nowrap ${
                                active
                                    ? 'bg-[#FF3008] text-white border-transparent shadow-sm'
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-gray-400'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {pill.name}
                        </button>
                    );
                })}
            </div>

            {/* ── SINGLE CATEGORY FILTERED VIEW ────────────────────────────── */}
            {activePill !== 'all' && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                            {pills.find(p => p.slug === activePill)?.name}
                        </h2>
                        <span className="text-sm text-gray-500">{pillFiltered.length} shops</span>
                    </div>
                    {pillFiltered.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {pillFiltered.map(biz => (
                                <ShopCard key={biz.id} biz={biz} group={normalizeGroup(biz.category || '')} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-14 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                            <Store className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                            <p className="text-sm text-gray-400">No shops in this category yet</p>
                        </div>
                    )}
                </section>
            )}

            {/* ── ALL CATEGORIES VIEW ─────────────────────────────────────── */}
            {activePill === 'all' && (
                <>
                    {sortedKeys.length > 0 ? (
                        sortedKeys.map(groupKey => (
                            <CategorySection
                                key={groupKey}
                                group={groupKey}
                                businesses={groups.get(groupKey) || []}
                                seeAllHref={groupRoute(groupKey)}
                                sliderRef={el => sliderRefs.current.set(groupKey, el)}
                                onLeft={() => scroll(groupKey, 'left')}
                                onRight={() => scroll(groupKey, 'right')}
                            />
                        ))
                    ) : (
                        /* ── P2P fallback ── */
                        <>
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Shops near you</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">{p2pStores.length} active seller{p2pStores.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <Link href="/stores" className="text-sm font-semibold text-gray-900 dark:text-slate-100 hover:underline">See All</Link>
                                </div>
                                {p2pStores.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {p2pStores.map(store => (
                                            <StoreListingCard key={store.id} store={store} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-14 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                                        <Store className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                                        <p className="text-sm text-gray-400">No shops yet — be the first!</p>
                                        <Link href="/dashboard" className="inline-block mt-3 text-sm font-semibold text-[#FF3008] hover:underline">Open a shop →</Link>
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* ── Deals for You ─────────────────────────────────── */}
                    {dealListings.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Deals for you</h2>
                                <div className="flex items-center gap-2">
                                    <Link href="/deals" className="text-sm font-semibold text-gray-900 dark:text-slate-100 hover:underline">See All</Link>
                                    <button onClick={() => scrollDeals('left')} className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 hover:bg-gray-50 cursor-pointer">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => scrollDeals('right')} className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 hover:bg-gray-50 cursor-pointer">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div ref={dealsRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-none hide-scrollbar scroll-smooth">
                                {dealListings.slice(0, 20).map(l => <DealCard key={l.id} listing={l} />)}
                            </div>
                        </section>
                    )}

                    {/* ── SuqaPass promo strip ──────────────────────────── */}
                    <div className="flex rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="w-1/3 min-h-[120px] bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white text-4xl">⚡</span>
                        </div>
                        <div className="flex-1 p-5 flex flex-col justify-center gap-1.5">
                            <p className="text-[10px] font-black tracking-widest text-sky-500 uppercase">SuqaPass</p>
                            <p className="text-base font-bold text-gray-900 dark:text-slate-100 leading-snug">Free delivery & priority access</p>
                            <p className="text-xs text-gray-500">Secure escrow · Trusted sellers · Priority support</p>
                            <button className="mt-1 w-max bg-[#FF3008] text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-red-600 active:scale-95 transition-all cursor-pointer">
                                Start free trial
                            </button>
                        </div>
                    </div>
                </>
            )}

            <LocationPickerModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
        </div>
    );
}
