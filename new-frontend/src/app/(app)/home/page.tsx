"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Tag, ShieldCheck, Star, ArrowRight, Search, MapPin, Smartphone, Store, ShoppingBag, Download, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { listingsService } from '../../../services/listings';
import { businessService } from '../../../services/business';
import { resolveMediaUrl } from '../../../services/api';
import { ProductCard } from '../../../components/features/ProductCard';
import { StoreListingCard } from '../../../components/shared/StoreListingCard';
import { BrandStoreCard } from '../../../components/shared/StoreCard';
import { deriveStoresFromListings } from '../../../lib/deriveStores';
import { getCategoryIcon } from '../../../lib/categoryIcons';
import { useLocationStore } from '../../../store/useLocation';
import { useLocalizedField, useT } from '../../../lib/i18n';
import { useAuthStore } from '../../../store/useAuth';
import { useAuthModal } from '../../../store/useAuthModal';
import { LocationPickerModal } from '../../../components/shared/LocationPickerModal';
import type { Listing, Category as DbCategory, Business } from '../../../types';

export default function HomePage() {
    const router = useRouter();
    const t = useT();
    const openAuthModal = useAuthModal((s) => s.open);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [activeCategory, setActiveCategory] = useState('all');
    const [dealsOnly, setDealsOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [listings, setListings] = useState<Listing[]>([]);
    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
    const [nearbyBusinesses, setNearbyBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAlert, setShowAlert] = useState(true);

    // Hero address search and location states
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [activeDirectoryTab, setActiveDirectoryTab] = useState<'cities' | 'categories' | 'stores'>('cities');

    const city = useLocationStore((s) => s.city);
    const lat = useLocationStore((s) => s.lat);
    const lng = useLocationStore((s) => s.lng);
    const cityFilter = city?.split(',')[0]?.trim();
    const field = useLocalizedField();

    // Slider refs
    const sellersSliderRef = useRef<HTMLDivElement>(null);
    const brandsSliderRef = useRef<HTMLDivElement>(null);
    const grocerySliderRef = useRef<HTMLDivElement>(null);
    const dealsSliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [fetchedListings, fetchedCategories] = await Promise.all([
                    listingsService.getListings(cityFilter ? { location: cityFilter } : undefined),
                    listingsService.getCategories()
                ]);
                setListings(fetchedListings || []);
                setDbCategories(fetchedCategories || []);

                // Fetch nearby businesses
                try {
                    const params = lat && lng ? { lat, lng } : undefined;
                    const fetchedBusinesses = await businessService.getNearbyShops(params);
                    setNearbyBusinesses(fetchedBusinesses || []);
                } catch (bizErr) {
                    console.error("Error fetching nearby businesses:", bizErr);
                }
            } catch (error) {
                console.error("Error fetching data from backend:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [cityFilter, lat, lng]);

    const categories = [
        { name: 'All', slug: 'all' },
        ...dbCategories.map(cat => ({
            name: field(cat.name_en, cat.name_so).split(' (')[0],
            slug: cat.slug
        }))
    ];

    // Filter logic for main dashboard grids/sliders
    const activeCategoryId = activeCategory === 'all'
        ? null
        : dbCategories.find(c => c.slug === activeCategory)?.id;

    const filteredListings = listings.filter(l => {
        if (activeCategoryId && l.category_id !== activeCategoryId) return false;
        if (dealsOnly && !l.is_negotiable) return false;
        if (verifiedOnly && !l.owner?.is_verified) return false;
        return true;
    });

    const storeGrid = deriveStoresFromListings(filteredListings);

    // Derived popular stores
    const popularStores = deriveStoresFromListings(filteredListings);

    const filteredPopularStores = popularStores.filter(store => {
        if (verifiedOnly && !store.isVerified) return false;
        return true;
    });

    // Grocery Stores Filter & Mock fallback
    const groceryStores = nearbyBusinesses.length > 0 
        ? nearbyBusinesses.filter(b => b.category?.toLowerCase() === 'grocery' || b.category?.toLowerCase() === 'food' || b.name.toLowerCase().includes('grocery') || b.name.toLowerCase().includes('hub'))
        : storeGrid.filter(s => s.name.toLowerCase().includes('agri') || s.name.toLowerCase().includes('pantry') || s.name.toLowerCase().includes('market'));

    const displayGroceryStores = groceryStores.length > 0 ? groceryStores.map(s => {
        const isBusiness = 'logo_url' in s;
        return {
            id: s.id,
            slug: s.slug || 'grocery-store',
            name: s.name,
            image: isBusiness 
                ? ((s as Business).logo_url ? resolveMediaUrl((s as Business).logo_url!) : '/categories/grocery.jpg')
                : ((s as any).image || '/categories/grocery.jpg'),
            isVerified: isBusiness ? (s as Business).is_verified : (s as any).isVerified,
            trustScore: isBusiness ? (s as Business).trust_score : 500,
            distance: isBusiness ? ((s as Business).address ? (s as Business).address!.split(',')[0] : '0.5 km') : ((s as any).distance || '0.5 km'),
            deliveryFee: '$0.00 delivery fee',
            rating: '4.5 (80+)',
            time: '30-40 min'
        };
    }) : [
        {
            id: 'mock-g1',
            slug: 'mogadishu-fresh',
            name: 'Mogadishu Fresh Food Market',
            image: '/categories/grocery.jpg',
            isVerified: true,
            trustScore: 980,
            distance: '1.2 km',
            deliveryFee: '$0.00 delivery fee',
            rating: '4.8 (120+)',
            time: '25-35 min'
        },
        {
            id: 'mock-g2',
            slug: 'somali-agri-hub',
            name: 'Somali Agriculture Hub',
            image: '/categories/grocery.jpg',
            isVerified: true,
            trustScore: 960,
            distance: '2.4 km',
            deliveryFee: '$1.50 delivery fee',
            rating: '4.6 (90+)',
            time: '35-45 min'
        },
        {
            id: 'mock-g3',
            slug: 'nairobi-greens',
            name: 'Nairobi Green Grocers',
            image: '/categories/grocery.jpg',
            isVerified: true,
            trustScore: 940,
            distance: '3.1 km',
            deliveryFee: '$0.00 delivery fee',
            rating: '4.5 (60+)',
            time: '20-30 min'
        }
    ];

    // Promoted deal stores
    const dealStores = storeGrid.slice(0, 4).map(s => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        image: s.image || '/categories/skincare.jpg',
        promoText: 'Buy 1, get 1 free',
        promoSubtext: 'Selected items'
    }));

    const displayDealStores = dealStores.length > 0 ? dealStores : [
        {
            id: 'deal-1',
            slug: 'amaan-electronics',
            name: 'Amaan Electronics',
            image: '/categories/sport.jpg',
            promoText: 'Buy 1, get 1 free',
            promoSubtext: 'On select accessories'
        },
        {
            id: 'deal-2',
            slug: 'hargeisa-fashion',
            name: 'Hargeisa Fashion Outlet',
            image: '/categories/skincare.jpg',
            promoText: '40% off select items',
            promoSubtext: 'Summer clothing sale'
        }
    ];

    // Determine brands to display in the colored banner store cards (fallback to P2P sellers if DB is empty)
    const displayBrands = nearbyBusinesses.length > 0
        ? nearbyBusinesses.map(b => ({
            id: b.id,
            slug: b.slug,
            name: b.name,
            image: b.logo_url ? resolveMediaUrl(b.logo_url) : null,
            bannerUrl: b.banner_url ? resolveMediaUrl(b.banner_url) : null,
            isVerified: b.is_verified,
            trustScore: b.trust_score,
            distance: b.address ? b.address.split(',')[0] : undefined,
            brandColor: b.brand_color,
            listingCount: 3
        }))
        : storeGrid.slice(0, 8).map(s => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            image: s.image,
            bannerUrl: null,
            isVerified: s.isVerified,
            trustScore: s.responseTime === 'TRUSTED' ? 950 : 500,
            distance: s.distance,
            brandColor: undefined,
            listingCount: s.listingCount
        }));

    // Geolocation and hero actions
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                useLocationStore.getState().setLocation("Current Location", latitude, longitude);
                setIsDetectingLocation(false);
            },
            (error) => {
                console.error("Error getting geolocation:", error);
                setIsDetectingLocation(false);
                setIsLocationModalOpen(true);
            }
        );
    };

    const handleHeroSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (heroSearchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(heroSearchQuery.trim())}`);
        }
    };

    // Smooth horizontal scrolling handler
    const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = 450;
            ref.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Directory list data
    const directoryCities = [
        { name: 'Nairobi', query: 'Nairobi' },
        { name: 'Mogadishu', query: 'Mogadishu' },
        { name: 'Hargeisa', query: 'Hargeisa' },
        { name: 'Garowe', query: 'Garowe' },
        { name: 'Baidoa', query: 'Baidoa' },
        { name: 'Kismayo', query: 'Kismayo' },
        { name: 'Mombasa', query: 'Mombasa' },
        { name: 'Berbera', query: 'Berbera' }
    ];

    const directoryCategories = dbCategories.map(cat => ({
        name: field(cat.name_en, cat.name_so).split(' (')[0],
        slug: cat.slug
    }));

    const directoryStores = nearbyBusinesses.length > 0 
        ? nearbyBusinesses.slice(0, 8).map(b => ({ name: b.name, slug: b.slug }))
        : [
            { name: 'Amaan Electronics', slug: 'amaan-electronics' },
            { name: 'Fast Courier Services', slug: 'fast-courier' },
            { name: 'Somali Agriculture Hub', slug: 'somali-agri' },
            { name: 'Mogadishu Tech Stop', slug: 'muqdisho-tech' },
            { name: 'Hargeisa Fashion Outlet', slug: 'hargeysa-fashion' },
            { name: 'Pantry Essentials Co.', slug: 'pantry-co' }
        ];

    const handleDirectoryCityClick = (cityName: string) => {
        useLocationStore.getState().setLocation(cityName, null, null);
        const popularSection = document.getElementById('popular-section');
        if (popularSection) {
            popularSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDirectoryCategoryClick = (categorySlug: string) => {
        setActiveCategory(categorySlug);
        const categoriesSection = document.getElementById('categories-section');
        if (categoriesSection) {
            categoriesSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDirectoryStoreClick = (slug: string) => {
        router.push(`/shop/${slug}`);
    };

    if (loading) {
        return (
            <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none hide-scrollbar">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-10 w-28 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse shrink-0" />
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-48 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse shrink-0" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">



            {/* Section 3: Mood Category Capsules (Browse anchor) */}
            <section id="categories-section" className="space-y-3 pt-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                    What are you in the mood for?
                </h2>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none hide-scrollbar">
                    {categories.map((cat, idx) => {
                        const Icon = getCategoryIcon(cat.slug);
                        const isActive = activeCategory === cat.slug;
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveCategory(cat.slug)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-black shrink-0 transition-all cursor-pointer ${
                                    isActive
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

            {/* Section 4: "Fans of Suqafuran also like" (Horizontal Sellers Carousel) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                            Fans of Suqafuran also like
                        </h2>
                        <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                            Locals are placing orders at these stores today
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/stores"
                            className="text-xs font-black text-gray-600 hover:text-sky-500 dark:text-slate-400 cursor-pointer"
                        >
                            See All
                        </Link>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => handleScroll(sellersSliderRef, 'left')}
                                className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleScroll(sellersSliderRef, 'right')}
                                className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    ref={sellersSliderRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar scroll-smooth"
                >
                    {storeGrid.length > 0 ? (
                        storeGrid.map((store) => (
                            <div key={store.id} className="w-64 shrink-0">
                                <StoreListingCard store={store} />
                            </div>
                        ))
                    ) : (
                        <div className="w-full py-12 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                            No active stores matches these filters
                        </div>
                    )}
                </div>
            </section>

            {/* Section 5: SuqaPass Premium Split Banner (Suqafuran sky-blue theme) */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 p-8 shadow-lg text-white">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 translate-x-10 pointer-events-none" />
                <div className="absolute right-10 bottom-2 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2.5 text-left flex-1">
                        <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                            ⚡ SUMMER | SUQAPASS
                        </div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-poppins tracking-tight leading-none">
                            Fuel your fandom with SuqaPass
                        </h3>
                        <p className="text-sm opacity-95 font-bold max-w-xl">
                            Enjoy 100% free delivery on grocery matches, secure P2P escrow trades, and priority verifications.
                        </p>
                    </div>
                    <button className="bg-white hover:bg-slate-50 text-sky-600 font-black px-6 py-3.5 rounded-full text-xs shadow-md active:scale-95 transition-all shrink-0 cursor-pointer">
                        Start free trial
                    </button>
                </div>
            </section>

            {/* Section 6: "Quick essentials nearby" (Brand Store Cards) */}
            {displayBrands.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                                Quick essentials nearby
                            </h2>
                            <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                                Top rated local brands and verified businesses
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/stores"
                                className="text-xs font-black text-gray-600 hover:text-sky-500 dark:text-slate-400 cursor-pointer"
                            >
                                See All
                            </Link>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => handleScroll(brandsSliderRef, 'left')}
                                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleScroll(brandsSliderRef, 'right')}
                                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={brandsSliderRef}
                        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar scroll-smooth"
                    >
                        {displayBrands.map((brand) => (
                            <BrandStoreCard
                                key={brand.id}
                                slug={brand.slug}
                                name={brand.name}
                                image={brand.image}
                                bannerUrl={brand.bannerUrl}
                                isVerified={brand.isVerified}
                                trustScore={brand.trustScore}
                                distance={brand.distance}
                                brandColor={brand.brandColor}
                                listingCount={brand.listingCount}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Section 7: "Grocery" Slider (Displays Grocery Stores) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                            Grocery
                        </h2>
                        <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                            Fresh produce, household items, and direct farm storefronts
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/food-groceries"
                            className="text-xs font-black text-gray-600 hover:text-sky-500 dark:text-slate-400 cursor-pointer"
                        >
                            See All
                        </Link>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => handleScroll(grocerySliderRef, 'left')}
                                className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleScroll(grocerySliderRef, 'right')}
                                className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    ref={grocerySliderRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar scroll-smooth"
                >
                    {displayGroceryStores.map((store) => (
                        <Link
                            key={store.id}
                            href={`/shop/${store.slug}`}
                            className="w-80 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="h-40 bg-slate-105 dark:bg-slate-700 relative">
                                <img
                                    src={store.image}
                                    alt={store.name}
                                    className="w-full h-full object-cover"
                                />
                                {store.isVerified && (
                                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                        <ShieldCheck className="h-3 w-3" /> Verified
                                    </span>
                                )}
                            </div>
                            <div className="p-4 space-y-1">
                                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">{store.name}</h3>
                                <div className="flex items-center gap-1 text-[11px] text-gray-500 font-bold">
                                    <Star className="h-3 w-3 text-orange-400 fill-orange-400" />
                                    <span>{store.rating}</span>
                                    <span>·</span>
                                    <span>{store.time}</span>
                                    <span>·</span>
                                    <span>{store.distance}</span>
                                </div>
                                <div className="text-[11px] font-black text-sky-600 dark:text-sky-400 mt-1">
                                    {store.deliveryFee}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Section 8: "Deals for you" (Displays Promoted Deal Stores) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                            Deals for you
                        </h2>
                        <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                            Special promotions direct from storefront partners
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/deals"
                            className="text-xs font-black text-gray-600 hover:text-sky-500 dark:text-slate-400 cursor-pointer"
                        >
                            See All
                        </Link>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => handleScroll(dealsSliderRef, 'left')}
                                className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleScroll(dealsSliderRef, 'right')}
                                className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-500 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    ref={dealsSliderRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar scroll-smooth"
                >
                    {displayDealStores.map((deal) => (
                        <Link
                            key={deal.id}
                            href={`/shop/${deal.slug}`}
                            className="w-64 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-md transition-all p-3"
                        >
                            <div className="h-32 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden mb-3">
                                <img
                                    src={deal.image}
                                    alt={deal.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-white bg-orange-500 px-2 py-0.5 rounded-full">{deal.promoText}</span>
                                <h3 className="font-black text-slate-900 dark:text-slate-100 text-xs truncate mt-1">{deal.name}</h3>
                                <p className="text-[10px] text-gray-500 font-semibold">{deal.promoSubtext}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Section 9: "Most popular in [City]" (Filtered Stores Grid layout) */}
            <section id="popular-section" className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                        Most popular in {cityFilter || 'Nairobi'}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                        Trending local storefronts and brand partners matching your criteria
                    </p>
                </div>

                {/* Filter chips inside section to refine grid search */}
                <div className="flex gap-2.5">
                    <button
                        onClick={() => setVerifiedOnly(v => !v)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            verifiedOnly ? 'bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900' : 'bg-white border-gray-200 text-gray-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified Shops
                    </button>
                </div>

                {filteredPopularStores.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                        {filteredPopularStores.map((store) => (
                            <StoreListingCard key={store.id} store={store} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                        No active shops match these filters yet
                    </div>
                )}
            </section>

            {/* Section 10: "Get more from your neighborhood" Directory Tabs */}
            <section className="space-y-4 pt-8 border-t border-gray-100 dark:border-slate-800/80">
                <div>
                    <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                        {t("Get more from your neighborhood")}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                        Discover top classified hotspots, categories, and storefront partners
                    </p>
                </div>

                <div className="flex border-b border-gray-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveDirectoryTab('cities')}
                        className={`px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                            activeDirectoryTab === 'cities'
                                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400'
                        }`}
                    >
                        {t("Top Cities")}
                    </button>
                    <button
                        onClick={() => setActiveDirectoryTab('categories')}
                        className={`px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                            activeDirectoryTab === 'categories'
                                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400'
                        }`}
                    >
                        {t("Top Categories")}
                    </button>
                    <button
                        onClick={() => setActiveDirectoryTab('stores')}
                        className={`px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                            activeDirectoryTab === 'stores'
                                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400'
                        }`}
                    >
                        {t("Top Storefronts")}
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-3">
                    {activeDirectoryTab === 'cities' && directoryCities.map((c, i) => (
                        <button
                            key={i}
                            onClick={() => handleDirectoryCityClick(c.query)}
                            className="text-left text-xs font-semibold text-slate-700 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400 transition-colors cursor-pointer"
                        >
                            {c.name}
                        </button>
                    ))}
                    {activeDirectoryTab === 'categories' && directoryCategories.map((c, i) => (
                        <button
                            key={i}
                            onClick={() => handleDirectoryCategoryClick(c.slug)}
                            className="text-left text-xs font-semibold text-slate-700 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400 transition-colors cursor-pointer"
                        >
                            {c.name}
                        </button>
                    ))}
                    {activeDirectoryTab === 'stores' && directoryStores.map((st, i) => (
                        <button
                            key={i}
                            onClick={() => handleDirectoryStoreClick(st.slug)}
                            className="text-left text-xs font-semibold text-slate-700 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400 transition-colors cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                        >
                            {st.name}
                        </button>
                    ))}
                </div>
            </section>

            {/* Modals for location selection */}
            <LocationPickerModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />

        </div>
    );
}

