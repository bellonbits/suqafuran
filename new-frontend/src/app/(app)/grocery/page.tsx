"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, ShoppingBag, Star } from 'lucide-react';
import { useCartStore } from '../../../store/useCart';
import { listingsService } from '../../../services/listings';
import { resolveMediaUrl } from '../../../services/api';
import { StoreCard, SeeAllStoresCard } from '../../../components/shared/StoreCard';
import { useCurrencyStore } from '../../../store/useCurrency';
import { formatConvertedPrice } from '../../../lib/currency';
import { useLocalizedField } from '../../../lib/i18n';
import type { Listing, Category as DbCategory } from '../../../types';

interface Store {
    id: string;
    name: string;
    slug: string;
    image: string;
    rating?: string;
    time: string;
    distance?: string;
    tags: string[];
    note?: string;
    isVerified?: boolean;
}

interface DealProduct {
    id: number;
    name: string;
    image: string;
    price: number;
    currency: string;
    badge?: string;
    rating?: string;
}

export default function GroceryPage() {
    const { addToCart } = useCartStore();
    const displayCurrency = useCurrencyStore((s) => s.currency);
    const field = useLocalizedField();
    const [selectedDealStore, setSelectedDealStore] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [groceryListings, setGroceryListings] = useState<Listing[]>([]);
    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);

    const toggleFilter = (filter: string) => {
        setActiveFilters(prev => 
            prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
        );
    };

    const filters = ['SNAP', 'HSA/FSA', 'Over 4.5', 'Under 30 min', 'Price', 'SuqaPass'];

    const getGrocerySubcategoryGroup = (subName: string): string => {
        const lower = subName.toLowerCase();
        if (lower.includes('vegetable') || lower.includes('qudaarta') || lower.includes('fruit') || lower.includes('miraha')) {
            return 'Produce Deals';
        }
        if (lower.includes('milk') || lower.includes('caanaha') || lower.includes('dairy') || lower.includes('egg') || lower.includes('ukunta')) {
            return 'Dairy & Eggs';
        }
        if (lower.includes('meat') || lower.includes('hilibka') || lower.includes('seafood') || lower.includes('kalluun') || lower.includes('fish')) {
            return 'Meat & Seafood';
        }
        if (lower.includes('rice') || lower.includes('bariis') || lower.includes('pasta') || lower.includes('baastada') || lower.includes('pantry') || lower.includes('grains')) {
            return 'Pantry Deals';
        }
        return 'Snacks & Drinks';
    };

    useEffect(() => {
        async function loadGroceryData() {
            try {
                const [fetchedListings, fetchedCategories] = await Promise.all([
                    listingsService.getListings({ category_id: 'food-groceries' }),
                    listingsService.getCategories()
                ]);
                setGroceryListings(fetchedListings || []);
                setDbCategories(fetchedCategories || []);
            } catch (err) {
                console.error("Error loading grocery page backend data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadGroceryData();
    }, []);

    // Map subcategory_id -> real subcategory name, so grouping can match against
    // an actual name instead of a numeric id string (which never matches anything).
    const subcategoryNameMap = React.useMemo(() => {
        const map = new Map<number, string>();
        dbCategories.forEach(cat => {
            cat.subcategories?.forEach(sub => {
                map.set(sub.id, sub.name_en);
            });
        });
        return map;
    }, [dbCategories]);

    // Extract unique sellers from grocery listings
    const uniqueSellersMap = new Map<number, Store>();
    groceryListings.forEach(l => {
        if (l.owner && !uniqueSellersMap.has(l.owner_id)) {
            const trustScoreVal = l.owner.trust_score || 95;
            uniqueSellersMap.set(l.owner_id, {
                id: l.owner_id.toString(),
                name: l.owner.full_name || "Local Seller",
                slug: l.owner_id.toString(),
                image: resolveMediaUrl(l.owner.avatar_url) || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop",
                time: "30-40 min",
                distance: l.location ? l.location.split(',')[0] : "Nearby",
                tags: l.owner.trust_level ? [l.owner.trust_level] : ["In-store prices"],
                isVerified: l.owner.is_verified || false
            });
        }
    });

    const popularStores = Array.from(uniqueSellersMap.values());
    const topStoresList = popularStores;

    // Set selected deal store initially
    useEffect(() => {
        if (popularStores.length > 0 && !selectedDealStore) {
            setSelectedDealStore(popularStores[0].name);
        }
    }, [popularStores, selectedDealStore]);

    // Build dynamic listing products by grouping them
    const produceDeals: DealProduct[] = [];
    const dairyDeals: DealProduct[] = [];
    const meatDeals: DealProduct[] = [];
    const pantryDeals: DealProduct[] = [];
    const snacksDeals: DealProduct[] = [];

    groceryListings.forEach(l => {
        const mappedProduct: DealProduct = {
            id: l.id,
            name: field(l.title_en, l.title_so) || "Grocery Item",
            image: l.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200",
            price: l.price,
            currency: l.currency,
            badge: l.condition || "Fresh"
        };

        const subcategoryName = (l.subcategory_id && subcategoryNameMap.get(l.subcategory_id)) || "";
        const group = getGrocerySubcategoryGroup(subcategoryName);
        if (group === 'Produce Deals') produceDeals.push(mappedProduct);
        else if (group === 'Dairy & Eggs') dairyDeals.push(mappedProduct);
        else if (group === 'Meat & Seafood') meatDeals.push(mappedProduct);
        else if (group === 'Pantry Deals') pantryDeals.push(mappedProduct);
        else snacksDeals.push(mappedProduct);
    });

    const renderSavingCard = (product: DealProduct) => (
        <div key={product.id} className="p-3 bg-slate-50 border border-gray-100 rounded-2xl flex gap-3 relative dark:bg-slate-950 dark:border-slate-800">
            <div className="h-16 w-16 rounded-xl overflow-hidden relative shrink-0">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                <button
                    onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, currency: product.currency, image: product.image })}
                    className="absolute bottom-1 right-1 h-6 w-6 bg-white border border-gray-200 text-gray-800 rounded-full flex items-center justify-center font-bold text-sm shadow-md hover:bg-slate-50 active:scale-90 cursor-pointer shrink-0 z-10"
                >
                    +
                </button>
            </div>
            <div className="overflow-hidden flex-1 flex flex-col justify-between py-0.5">
                <div>
                    <h4 className="text-[11px] font-black text-gray-900 dark:text-slate-100 truncate">{product.name}</h4>
                    {product.rating && (
                        <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            {product.rating}
                        </span>
                    )}
                </div>
                <div className="space-y-0.5">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-gray-900 dark:text-slate-100">{formatConvertedPrice(product.price, product.currency, displayCurrency)}</span>
                    </div>
                    {product.badge && (
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded block w-max">
                            {product.badge}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="flex gap-2.5 overflow-x-auto pb-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-10 w-28 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse shrink-0" />
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-48 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse shrink-0" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const hasAnyDeals = produceDeals.length > 0 || snacksDeals.length > 0 || dairyDeals.length > 0 || meatDeals.length > 0 || pantryDeals.length > 0;

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">
            
            {/* Header Title */}
            <div>
                <h1 className="text-2xl font-black text-gray-950 dark:text-slate-100 font-poppins">
                    Stores Near You
                </h1>
            </div>

            {/* Filter Pills row */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none hide-scrollbar">
                {filters.map((filter, idx) => {
                    const isSelected = activeFilters.includes(filter);
                    return (
                        <button
                            key={idx}
                            onClick={() => toggleFilter(filter)}
                            className={`px-4 py-2 rounded-full border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                                isSelected
                                    ? 'bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200'
                            }`}
                        >
                            {filter === 'Over 4.5' ? (
                                <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-current" />
                                    {filter}
                                </span>
                            ) : filter}
                        </button>
                    );
                })}
            </div>

            {/* Double Promotion banners grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-amber-500 text-white p-6 shadow flex justify-between items-center relative overflow-hidden">
                    <div className="space-y-4 max-w-xs">
                        <span className="h-10 w-24 bg-white/20 rounded-xl flex items-center justify-center font-black text-xs">Escrow</span>
                        <h3 className="text-base font-black font-poppins leading-tight">Secure checkout using our trust system.</h3>
                        <button className="btn-premium bg-red-600 text-white px-5 py-2 text-xs hover:bg-red-700">
                            Learn more
                        </button>
                    </div>
                </div>

                <div className="rounded-3xl bg-blue-900 text-white p-6 shadow flex justify-between items-center relative overflow-hidden">
                    <div className="space-y-4 max-w-xs">
                        <span className="h-10 w-20 bg-white/20 rounded-xl flex items-center justify-center font-black text-xs">SuqaPass</span>
                        <h3 className="text-base font-black font-poppins leading-tight">Verified local delivery options available.</h3>
                        <button className="btn-premium bg-white text-blue-900 px-5 py-2 text-xs hover:bg-slate-50">
                            View details
                        </button>
                    </div>
                </div>
            </div>

            {/* Popular Near You */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-950 dark:text-slate-100 font-poppins">
                        Popular Near You
                    </h2>
                    <div className="flex items-center gap-3">
                        <Link href="/stores" className="text-xs font-bold text-gray-500 hover:text-primary cursor-pointer">See All</Link>
                        <div className="flex gap-1">
                            <button className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 dark:border-slate-800 dark:bg-slate-900"><ChevronLeft className="h-4 w-4" /></button>
                            <button className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 dark:border-slate-800 dark:bg-slate-900"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>

                {popularStores.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none hide-scrollbar">
                        {popularStores.map((store) => (
                            <div key={store.id} className="w-64 shrink-0">
                                <StoreCard
                                    slug={store.slug}
                                    name={store.name}
                                    image={store.image}
                                    time={store.time}
                                    distance={store.distance}
                                    isVerified={store.isVerified}
                                />
                            </div>
                        ))}
                        <div className="w-64 shrink-0">
                            <SeeAllStoresCard />
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                        No active grocery seller accounts found near you in database
                    </div>
                )}
            </section>

            {/* Top Savings grid columns */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-950 dark:text-slate-100 font-poppins">
                        Top savings
                    </h2>
                    <Link href="/search" className="text-xs font-bold text-gray-500 hover:text-primary cursor-pointer">See All</Link>
                </div>

                {/* Savings store selector tabs */}
                {popularStores.length > 0 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none hide-scrollbar">
                        {popularStores.map((st, idx) => (
                            <button
                                key={idx}
                                title={st.name}
                                onClick={() => setSelectedDealStore(st.name)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap max-w-[180px] ${
                                    selectedDealStore === st.name
                                        ? 'bg-slate-900 text-white border-transparent dark:bg-slate-100 dark:text-slate-900'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200'
                                }`}
                            >
                                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{st.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Horizontal scrolling deals panel */}
                {hasAnyDeals ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {/* Produce Column */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                                <span>Produce Deals</span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </h3>
                            {produceDeals.length > 0 ? produceDeals.map(renderSavingCard) : <p className="text-[10px] text-gray-400">No deals</p>}
                        </div>

                        {/* Snacks Column */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                                <span>Snacks Deals</span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </h3>
                            {snacksDeals.length > 0 ? snacksDeals.map(renderSavingCard) : <p className="text-[10px] text-gray-400">No deals</p>}
                        </div>

                        {/* Dairy Column */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                                <span>Dairy & Eggs</span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </h3>
                            {dairyDeals.length > 0 ? dairyDeals.map(renderSavingCard) : <p className="text-[10px] text-gray-400">No deals</p>}
                        </div>

                        {/* Meat Column */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                                <span>Meat & Seafood</span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </h3>
                            {meatDeals.length > 0 ? meatDeals.map(renderSavingCard) : <p className="text-[10px] text-gray-400">No deals</p>}
                        </div>

                        {/* Pantry Column */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                                <span>Pantry Deals</span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </h3>
                            {pantryDeals.length > 0 ? pantryDeals.map(renderSavingCard) : <p className="text-[10px] text-gray-400">No deals</p>}
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                        No active grocery discount items found in database
                    </div>
                )}
            </section>

            {/* Top Stores List Grid */}
            {topStoresList.length > 0 && (
                <section className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-gray-950 dark:text-slate-100 font-poppins">
                            Top Stores
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topStoresList.map((store) => (
                            <Link 
                                key={store.id}
                                href={`/shop/${store.slug}`}
                                className="p-5 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex gap-4 hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center text-white text-base font-black shrink-0 relative overflow-hidden">
                                    {store.name.charAt(0)}
                                </div>
                                <div className="overflow-hidden flex-1 flex flex-col justify-between py-0.5">
                                    <div>
                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{store.name}</h4>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">{store.time}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {store.tags.map((tag, tIdx) => (
                                            <span key={tIdx} className="text-[9px] font-extrabold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* See all stores nearby button */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button className="w-full text-center py-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-gray-200/50 dark:border-slate-800 rounded-3xl font-extrabold text-xs text-gray-700 dark:text-slate-300 cursor-pointer">
                            See all stores nearby
                        </button>
                    </div>
                </section>
            )}

        </div>
    );
}
