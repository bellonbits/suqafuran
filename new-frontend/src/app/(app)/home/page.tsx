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

    // Filter listings specifically for the Grocery section
    const groceryListings = listings.filter(l => {
        const cat = dbCategories.find(c => c.id === l.category_id);
        return cat?.slug === 'food-groceries' || cat?.slug === 'grocery';
    });

    // Filter listings specifically for the Deals section
    const dealsListings = listings.filter(l => l.is_negotiable);

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

            {/* Section 1: Vibrant Hero Section (DoorDash Layout, Suqafuran Theme) */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-400 via-sky-500 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950/40 p-6 sm:p-12 md:p-16 shadow-xl text-white">
                {/* Visual decorative circles */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-300/10 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                    
                    {/* Left collage: CSS app phone mockup */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-3 shadow-2xl h-[420px] w-[210px] mx-auto overflow-hidden animate-float">
                            {/* Notch */}
                            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                                <div className="w-7 h-1 bg-slate-800 rounded-full mr-2" />
                                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                            </div>
                            {/* Mock App Screen */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] h-full w-full overflow-hidden p-2.5 pt-6 flex flex-col justify-between text-slate-800 dark:text-slate-100">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-1.5">
                                        <span className="text-[10px] font-black text-sky-600 dark:text-sky-400">Suqafuran</span>
                                        <span className="text-[7px] bg-emerald-500 text-white font-black px-1 py-0.5 rounded-full flex items-center gap-0.5">
                                            <ShieldCheck className="h-2 w-2" /> Secure
                                        </span>
                                    </div>
                                    <div className="bg-slate-200/60 dark:bg-slate-800 rounded-full py-1 px-2.5 flex items-center gap-1 text-[8px] text-slate-400">
                                        <Search className="h-2 w-2" />
                                        <span>Search...</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <div className="bg-sky-50 dark:bg-sky-950/20 p-1.5 rounded-lg flex flex-col items-center gap-0.5 border border-sky-100/40">
                                            <span className="text-xs">📱</span>
                                            <span className="text-[6px] font-black">Tech</span>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-950/20 p-1.5 rounded-lg flex flex-col items-center gap-0.5 border border-amber-100/40">
                                            <span className="text-xs">🐫</span>
                                            <span className="text-[6px] font-black">Camel</span>
                                        </div>
                                        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded-lg flex flex-col items-center gap-0.5 border border-emerald-100/40">
                                            <span className="text-xs">🥬</span>
                                            <span className="text-[6px] font-black">Grocery</span>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-1">
                                        <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg relative overflow-hidden">
                                            <div className="absolute top-1 right-1 bg-white/90 backdrop-blur px-1 py-0.5 rounded text-[6px] text-sky-600 font-extrabold shadow">Verified</div>
                                        </div>
                                        <div className="flex justify-between items-center text-[7px]">
                                            <span className="font-black truncate max-w-[70px]">MacBook Air</span>
                                            <span className="font-black text-sky-600 dark:text-sky-400">$899</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
                            </div>
                        </div>
                    </div>

                    {/* Middle: Content and Search Bar */}
                    <div className="col-span-1 lg:col-span-6 text-center space-y-6 max-w-xl mx-auto">
                        <div className="space-y-3.5">
                            <span className="inline-flex items-center gap-1 bg-white/20 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                🌍 PAN-AFRICAN MARKETPLACE
                            </span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-poppins tracking-tight leading-none">
                                {t("Buy, Sell & Trade Securely in Africa")}
                            </h2>
                            <p className="text-sm sm:text-base opacity-95 font-bold max-w-md mx-auto">
                                {t("Find local verified sellers, discover negotiable deals, and trade with secure escrow protection.")}
                            </p>
                        </div>

                        {/* Interactive location search bar */}
                        <form onSubmit={handleHeroSearchSubmit} className="relative flex items-center bg-white dark:bg-slate-900 rounded-full text-slate-800 dark:text-slate-100 p-1 sm:p-1.5 shadow-xl max-w-lg mx-auto border border-white/10">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 shrink-0">
                                <MapPin className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                placeholder={t("Enter your city or neighborhood...")}
                                value={heroSearchQuery}
                                onChange={(e) => setHeroSearchQuery(e.target.value)}
                                className="w-full text-sm font-semibold pl-11 pr-14 py-3 rounded-full outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent"
                            />
                            <button
                                type="submit"
                                aria-label="Search location"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </form>

                        {/* Quick location picker triggers */}
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                            <button
                                onClick={() => isAuthenticated ? setIsLocationModalOpen(true) : openAuthModal('signin')}
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 px-4.5 py-2 rounded-full text-xs font-black transition-all cursor-pointer"
                            >
                                <ShoppingBag className="h-3.5 w-3.5" />
                                <span>{t("Sign in for saved addresses")}</span>
                            </button>
                            <button
                                onClick={handleUseCurrentLocation}
                                disabled={isDetectingLocation}
                                className="flex items-center gap-1.5 bg-white text-slate-900 hover:bg-slate-50 px-4.5 py-2 rounded-full text-xs font-black transition-all cursor-pointer shadow"
                            >
                                <MapPin className="h-3.5 w-3.5 text-sky-500" />
                                <span>{isDetectingLocation ? t("Detecting Location...") : t("Use Current Location")}</span>
                            </button>
                        </div>
                    </div>

                    {/* Right collage: floating category widgets */}
                    <div className="hidden lg:block lg:col-span-3 h-[420px] relative">
                        {/* Widget 1: Laptop */}
                        <div className="absolute top-2 left-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-2.5 rounded-2xl shadow-lg w-40 animate-float hover:scale-105 transition-all text-slate-800 dark:text-slate-100">
                            <div className="flex gap-2 items-center">
                                <span className="p-1.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-500 text-base">💻</span>
                                <div>
                                    <h4 className="text-[9px] font-black truncate max-w-[90px]">MacBook Air</h4>
                                    <span className="text-[9px] font-black text-sky-600 dark:text-sky-400 block">$899</span>
                                </div>
                            </div>
                        </div>

                        {/* Widget 2: Camel */}
                        <div className="absolute top-[140px] right-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-2.5 rounded-2xl shadow-lg w-40 animate-float [animation-delay:1s] hover:scale-105 transition-all text-slate-800 dark:text-slate-100">
                            <div className="flex gap-2 items-center">
                                <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 text-base">🐫</span>
                                <div>
                                    <h4 className="text-[9px] font-black truncate max-w-[90px]">Somali Camel</h4>
                                    <span className="text-[9px] font-black text-emerald-600 block">$1,200</span>
                                </div>
                            </div>
                        </div>

                        {/* Widget 3: Nike Sneaker */}
                        <div className="absolute bottom-6 left-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-2.5 rounded-2xl shadow-lg w-40 animate-float [animation-delay:2s] hover:scale-105 transition-all text-slate-800 dark:text-slate-100">
                            <div className="flex gap-2 items-center">
                                <span className="p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-500 text-base">👟</span>
                                <div>
                                    <h4 className="text-[9px] font-black truncate max-w-[90px]">Nike Jordan</h4>
                                    <span className="text-[9px] font-black text-sky-600 dark:text-sky-400 block">$140</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Escrow Fee Protection Banner */}
            {showAlert && (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/20 rounded-2xl">
                    <div className="flex items-center gap-2.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        <span className="p-1 bg-emerald-100 dark:bg-emerald-950/40 rounded-full">
                            <ShieldCheck className="h-4 w-4" />
                        </span>
                        <span>10% escrow protection fee applies on secure transaction matches (min. applies)</span>
                    </div>
                    <button
                        onClick={() => setShowAlert(false)}
                        className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 font-extrabold text-xs cursor-pointer p-1"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Section 2: Three-Pillar CTA Grid (Become a Seller, Grow Business, Get App) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Pillar 1: Become a Seller */}
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 flex flex-col justify-between items-start space-y-4 hover:shadow-lg transition-all card-shadow">
                    <div className="space-y-2">
                        <span className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-500 rounded-2xl flex items-center justify-center w-max">
                            <ShoppingBag className="h-6 w-6" />
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-poppins">
                            {t("Start Selling & Earn")}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t("Have items to sell? Post ads for free in minutes and reach thousands nearby.")}
                        </p>
                    </div>
                    <button
                        onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signin')}
                        className="flex items-center gap-1 text-xs font-black text-sky-500 hover:text-sky-600 cursor-pointer pt-2 group"
                    >
                        <span>{t("Become a Seller")}</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                </div>

                {/* Pillar 2: Grow Store */}
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 flex flex-col justify-between items-start space-y-4 hover:shadow-lg transition-all card-shadow">
                    <div className="space-y-2">
                        <span className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-2xl flex items-center justify-center w-max">
                            <Store className="h-6 w-6" />
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-poppins">
                            {t("Grow Your Business")}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t("Create a digital storefront, manage products, track orders, and build trust.")}
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1 text-xs font-black text-emerald-500 hover:text-emerald-600 cursor-pointer pt-2 group"
                    >
                        <span>{t("Grow Store")}</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>

                {/* Pillar 3: Get Mobile App */}
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 flex flex-col justify-between items-start space-y-4 hover:shadow-lg transition-all card-shadow">
                    <div className="space-y-2">
                        <span className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center w-max">
                            <Smartphone className="h-6 w-6" />
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-poppins">
                            {t("Get the Mobile App")}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t("Enjoy live chat alerts, precise location matching, and offline sync.")}
                        </p>
                    </div>
                    
                    {/* App store mock badges */}
                    <div className="flex gap-2 w-full pt-1">
                        <button
                            onClick={() => alert("Downloading Suqafuran for iOS...")}
                            className="bg-slate-900 hover:bg-slate-950 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition-all text-left flex-1 border border-slate-750 cursor-pointer"
                        >
                            <span className="text-[14px]"></span>
                            <div className="leading-none shrink-0">
                                <span className="text-[6px] font-bold text-gray-400 block uppercase">Download on</span>
                                <span className="text-[9px] font-black">App Store</span>
                            </div>
                        </button>
                        <button
                            onClick={() => alert("Downloading Suqafuran for Android...")}
                            className="bg-slate-900 hover:bg-slate-950 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition-all text-left flex-1 border border-slate-750 cursor-pointer"
                        >
                            <Download className="h-3 w-3 text-sky-400 shrink-0" />
                            <div className="leading-none shrink-0">
                                <span className="text-[6px] font-bold text-gray-400 block uppercase">Get it on</span>
                                <span className="text-[9px] font-black">Google Play</span>
                            </div>
                        </button>
                    </div>
                </div>

            </section>

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

            {/* Section 7: "Grocery & Essentials" Slider */}
            {groceryListings.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                                Grocery
                            </h2>
                            <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                                Fresh produce, household items, and direct pantry supplies
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/grocery"
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
                        {groceryListings.map((listing) => (
                            <div key={listing.id} className="w-48 shrink-0">
                                <ProductCard listing={listing} showSeller />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Section 8: "Deals for you" (Negotiable items slider) */}
            {dealsListings.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                                Deals for you
                            </h2>
                            <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                                Special negotiable offers direct from verified sellers
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
                        {dealsListings.map((listing) => (
                            <div key={listing.id} className="w-48 shrink-0">
                                <ProductCard listing={listing} showSeller />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Section 9: "Most popular in [City]" (Filtered Grid layout) */}
            <section id="popular-section" className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-black text-gray-950 dark:text-slate-100 font-poppins tracking-tight">
                        Most popular in {cityFilter || 'Nairobi'}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                        Trending items and local offers matching your criteria
                    </p>
                </div>

                {/* Filter chips inside section to refine grid search */}
                <div className="flex gap-2.5">
                    <button
                        onClick={() => setDealsOnly(v => !v)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            dealsOnly ? 'bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900' : 'bg-white border-gray-200 text-gray-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <Tag className="h-3.5 w-3.5" />
                        Negotiable Deals
                    </button>
                    <button
                        onClick={() => setVerifiedOnly(v => !v)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            verifiedOnly ? 'bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900' : 'bg-white border-gray-200 text-gray-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified Sellers
                    </button>
                </div>

                {filteredListings.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 pt-2">
                        {filteredListings.map((listing) => (
                            <ProductCard key={listing.id} listing={listing} showSeller />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                        No active items match these filters yet
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

