"use client";

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useCartStore } from '../../store/useCart';
import { listingsService } from '../../services/listings';
import type { Listing } from '../../types';

interface Store {
    id: string;
    name: string;
    slug: string;
    image: string;
    rating?: string;
    time: string;
    distance?: string;
    tags: string[];
}

interface DealProduct {
    id: number;
    name: string;
    image: string;
    price: number;
    originalPrice: number;
    badge?: string;
    rating?: string;
}

interface PageProps {
    params: Promise<{ category: string }>;
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
    'property': 'property',
    'jobs': 'jobs'
};

export default function CategoryPage({ params }: PageProps) {
    const { category } = use(params);
    const { addToCart } = useCartStore();
    
    const [title, setTitle] = useState('');
    const [popularStores, setPopularStores] = useState<Store[]>([]);
    const [savingsCols, setSavingsCols] = useState<{ name: string; products: DealProduct[] }[]>([]);
    const [topStores, setTopStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Capitalize helper
    const formatCategoryName = (slug: string) => {
        if (slug === 'cbd') return 'CBD/THC';
        if (slug === 'suqamart') return 'SuqaMart';
        return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    useEffect(() => {
        const catName = formatCategoryName(category);
        setTitle(`${catName} Stores Near You`);

        async function loadCategoryData() {
            try {
                const dbCategorySlug = categorySlugMap[category] || category;
                
                // Fetch listings filtered by category
                const fetchedListings = await listingsService.getListings({ category_id: dbCategorySlug });

                // Map listings/products
                if (fetchedListings && fetchedListings.length > 0) {
                    // Extract unique sellers from listings
                    const uniqueSellersMap = new Map<number, any>();
                    fetchedListings.forEach(l => {
                        if (l.owner && !uniqueSellersMap.has(l.owner_id)) {
                            const trustScoreVal = l.owner.trust_score || 95;
                            uniqueSellersMap.set(l.owner_id, {
                                id: l.owner_id.toString(),
                                name: l.owner.full_name || "Local Seller",
                                slug: l.owner_id.toString(),
                                image: l.owner.avatar_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400",
                                rating: `${(trustScoreVal / 20).toFixed(1)}`,
                                time: "25-35 min",
                                distance: l.location ? l.location.split(',')[0] : "Nearby",
                                tags: l.owner.trust_level ? [l.owner.trust_level] : ["Verified Seller"]
                            });
                        }
                    });

                    const derivedStores = Array.from(uniqueSellersMap.values());
                    setPopularStores(derivedStores);
                    setTopStores(derivedStores);

                    // Partition listings into creative categories (e.g. Featured, Hot Savings)
                    const featuredList = fetchedListings.slice(0, 4).map(l => ({
                        id: l.id,
                        name: l.title_en || l.title_so || "Product",
                        image: l.images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200",
                        price: l.price,
                        originalPrice: Math.round(l.price * 1.2),
                        badge: l.condition || "New",
                        rating: "4.8"
                    }));

                    const savingsList = fetchedListings.slice(4, 8).map(l => ({
                        id: l.id,
                        name: l.title_en || l.title_so || "Product",
                        image: l.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200",
                        price: l.price,
                        originalPrice: Math.round(l.price * 1.35),
                        badge: "Hot Deal",
                        rating: "4.5"
                    }));

                    const cols = [];
                    if (featuredList.length > 0) {
                        cols.push({ name: 'Featured Listings', products: featuredList });
                    }
                    if (savingsList.length > 0) {
                        cols.push({ name: 'Special Discounts', products: savingsList });
                    }

                    setSavingsCols(cols);
                } else {
                    setPopularStores([]);
                    setTopStores([]);
                    setSavingsCols([]);
                }

            } catch (err) {
                console.error("Failed loading category data from backend:", err);
                setPopularStores([]);
                setTopStores([]);
                setSavingsCols([]);
            } finally {
                setLoading(false);
            }
        }

        loadCategoryData();
    }, [category]);

    const renderSavingCard = (product: DealProduct) => (
        <div key={product.id} className="p-3 bg-slate-50 border border-gray-100 rounded-2xl flex gap-3 relative dark:bg-slate-950 dark:border-slate-800">
            <div className="h-16 w-16 rounded-xl overflow-hidden relative shrink-0">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                <button
                    onClick={() => addToCart({ id: product.id, name: product.name, price: product.price })}
                    className="absolute bottom-1 right-1 h-6 w-6 bg-white border border-gray-200 text-gray-800 rounded-full flex items-center justify-center font-bold text-sm shadow-md hover:bg-slate-50 active:scale-90 cursor-pointer shrink-0 z-10"
                >
                    +
                </button>
            </div>
            <div className="overflow-hidden flex-1 flex flex-col justify-between py-0.5">
                <div>
                    <h4 className="text-[11px] font-black text-gray-900 dark:text-slate-100 truncate">{product.name}</h4>
                    {product.rating && (
                        <span className="text-[9px] text-amber-500 font-bold block">★ {product.rating}</span>
                    )}
                </div>
                <div className="space-y-0.5">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-red-500">${product.price}</span>
                        <span className="text-[9px] text-gray-400 line-through font-bold">${product.originalPrice}</span>
                    </div>
                    {product.badge && (
                        <span className="text-[9px] font-extrabold text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded block w-max">
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
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-10 w-24 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse shrink-0" />
                    ))}
                </div>
                <div className="space-y-6 animate-pulse">
                    <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="flex gap-5 overflow-x-auto">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-64 h-36 bg-slate-100 dark:bg-slate-800 rounded-3xl shrink-0" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">
            
            {/* Title Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-950 dark:text-slate-100 font-poppins">
                    {title}
                </h1>
            </div>

            {/* Filter Pills row */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none hide-scrollbar">
                {['SNAP', 'HSA/FSA', 'Over 4.5 ★', 'Under 30 min', 'Price', 'SuqaPass'].map((filter, idx) => (
                    <button
                        key={idx}
                        className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 text-xs font-bold shrink-0 transition-all cursor-pointer"
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Banners grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-amber-500 text-white p-6 shadow flex justify-between items-center relative overflow-hidden">
                    <div className="space-y-4 max-w-xs">
                        <span className="h-10 w-24 bg-white/20 rounded-xl flex items-center justify-center font-black text-xs">Coupon</span>
                        <h3 className="text-base font-black font-poppins leading-tight">Apply coupons and enjoy 15% discount.</h3>
                        <button className="btn-premium bg-red-600 text-white px-5 py-2 text-xs hover:bg-red-700">
                            Apply now
                        </button>
                    </div>
                </div>

                <div className="rounded-3xl bg-blue-900 text-white p-6 shadow flex justify-between items-center relative overflow-hidden">
                    <div className="space-y-4 max-w-xs">
                        <span className="h-10 w-20 bg-white/20 rounded-xl flex items-center justify-center font-black text-xs">SuqaPass</span>
                        <h3 className="text-base font-black font-poppins leading-tight">Unlock free delivery and escrow protection.</h3>
                        <button className="btn-premium bg-white text-blue-900 px-5 py-2 text-xs hover:bg-slate-50">
                            Unlock now
                        </button>
                    </div>
                </div>
            </div>

            {/* Popular Near You */}
            {popularStores.length > 0 ? (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-gray-950 dark:text-slate-100 font-poppins">
                            Popular Near You
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-500 hover:text-primary cursor-pointer">See All</span>
                            <div className="flex gap-1">
                                <button className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 dark:border-slate-800 dark:bg-slate-900"><ChevronLeft className="h-4 w-4" /></button>
                                <button className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 dark:border-slate-800 dark:bg-slate-900"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none hide-scrollbar">
                        {popularStores.map((store) => (
                            <Link 
                                key={store.id}
                                href={`/shop/${store.slug}`}
                                className="w-64 shrink-0 space-y-2 group cursor-pointer"
                            >
                                <div className="aspect-video rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 relative bg-slate-50 shadow-sm">
                                    <img src={store.image} alt={store.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300" />
                                </div>
                                <div className="space-y-0.5 px-0.5">
                                    <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{store.name}</h4>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400 font-semibold">
                                        {store.distance && <span>{store.distance}</span>}
                                        {store.distance && <span>•</span>}
                                        <span>{store.time}</span>
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
                </section>
            ) : (
                <div className="py-8 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                    No active seller accounts found in this category
                </div>
            )}

            {/* Savings Columns */}
            {savingsCols.length > 0 ? (
                <section className="space-y-4">
                    <h2 className="text-lg font-black text-gray-950 dark:text-slate-100 font-poppins">
                        Top savings
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {savingsCols.map((col, idx) => (
                            <div key={idx} className="space-y-3">
                                <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                                    <span>{col.name}</span>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </h3>
                                {col.products.map(renderSavingCard)}
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <div className="py-8 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                    No active listings found in this category
                </div>
            )}

            {/* Top Stores List Grid */}
            {topStores.length > 0 && (
                <section className="space-y-6 pt-4">
                    <h2 className="text-lg font-black text-gray-950 dark:text-slate-100 font-poppins">
                        Top Stores
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topStores.map((store) => (
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
                </section>
            )}

        </div>
    );
}
