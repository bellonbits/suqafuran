"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { listingsService } from '../services/listings';
import type { Listing, Category as DbCategory } from '../types';

interface DealCard {
    id: number;
    name: string;
    image: string;
    rating: string;
    time: string;
    deliveryFee: string;
    promo?: string;
    slug?: string;
    isListing?: boolean;
}

export default function HomePage() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [listings, setListings] = useState<Listing[]>([]);
    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const getCategoryEmoji = (slug: string) => {
        if (slug.includes('food') || slug.includes('grocery')) return '🍎';
        if (slug.includes('cloth') || slug.includes('shoe') || slug.includes('apparel')) return '👕';
        if (slug.includes('house') || slug.includes('home')) return '🛋️';
        if (slug.includes('electronics') || slug.includes('tech')) return '💻';
        if (slug.includes('vehicle') || slug.includes('car')) return '🚗';
        if (slug.includes('live') || slug.includes('animal')) return '🐪';
        if (slug.includes('land') || slug.includes('farm') || slug.includes('agriculture')) return '🌾';
        if (slug.includes('service')) return '💼';
        if (slug.includes('beauty') || slug.includes('health') || slug.includes('personal')) return '🧴';
        if (slug.includes('property') || slug.includes('estate') || slug.includes('house')) return '🏢';
        if (slug.includes('job') || slug.includes('work')) return '👔';
        return '📦';
    };

    useEffect(() => {
        async function loadData() {
            try {
                const [fetchedListings, fetchedCategories] = await Promise.all([
                    listingsService.getListings(),
                    listingsService.getCategories()
                ]);
                setListings(fetchedListings || []);
                setDbCategories(fetchedCategories || []);
            } catch (error) {
                console.error("Error fetching data from backend:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const categories = [
        { name: 'All', slug: 'all', icon: '✨' },
        ...dbCategories.map(cat => ({
            name: cat.name_en.split(' (')[0], // Extract clean English name
            slug: cat.slug,
            icon: getCategoryEmoji(cat.slug)
        }))
    ];

    const weeklyDeals: DealCard[] = listings.slice(0, 8).map(l => ({
        id: l.id,
        name: l.title_en || l.title_so || "Product",
        image: l.images?.[0] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop",
        rating: "4.5",
        time: "15 min",
        deliveryFee: `${l.currency === 'USD' ? '$' : ''}${l.price}`,
        promo: l.condition ? `Condition: ${l.condition}` : undefined,
        slug: l.id.toString(),
        isListing: true
    }));

    // Extract unique sellers from listings
    const uniqueSellersMap = new Map<number, any>();
    listings.forEach(l => {
        if (l.owner && !uniqueSellersMap.has(l.owner_id)) {
            const trustScoreVal = l.owner.trust_score || 95;
            uniqueSellersMap.set(l.owner_id, {
                id: l.owner.id,
                name: l.owner.full_name || "Local Seller",
                image: l.owner.avatar_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop",
                rating: `${(trustScoreVal / 20).toFixed(1)} (${trustScoreVal}%)`,
                dist: l.location ? l.location.split(',')[0] : "Nearby",
                time: "20-30 min",
                note: l.owner.trust_level || "Verified Seller",
                slug: l.owner_id.toString()
            });
        }
    });
    const fastestList = Array.from(uniqueSellersMap.values());

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

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">
            
            {/* Top Greeting */}
            <div className="space-y-4">
                <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 font-poppins md:text-3xl animate-fade-in">
                    Happy Saturday! Discover shops & listings
                </h1>

                {/* Categories scrolling pills */}
                {categories.length > 1 ? (
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none hide-scrollbar">
                        {categories.map((cat, idx) => (
                            <Link
                                key={idx}
                                href={cat.slug === 'all' ? '/' : (cat.slug === 'food-groceries' ? '/grocery' : `/${cat.slug}`)}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full border text-sm font-extrabold shrink-0 transition-all cursor-pointer ${
                                    activeCategory === cat.name
                                        ? 'bg-slate-100 border-gray-300 dark:bg-slate-800 dark:border-slate-700'
                                        : 'bg-white border-gray-200 dark:bg-slate-900 dark:border-slate-800 text-gray-700 dark:text-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 font-semibold">No categories registered in database</p>
                )}
            </div>

            {/* Weekly Deals Panel */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-red-500 font-poppins tracking-tighter uppercase">
                            FEATURED MARKET ITEMS
                        </h2>
                        <p className="text-sm text-gray-500 font-bold dark:text-slate-400 mt-0.5">
                            Direct from verified local sellers
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/search" 
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-extrabold shadow shadow-red-500/10 cursor-pointer"
                        >
                            See All
                        </Link>
                        <div className="flex gap-1">
                            <button className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Horizontal slider list */}
                {weeklyDeals.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none hide-scrollbar">
                        {weeklyDeals.map((deal) => (
                            <Link
                                href={deal.isListing ? `/listing/${deal.id}` : `/shop/${deal.slug}`}
                                key={deal.id}
                                className="w-48 shrink-0 space-y-2 group cursor-pointer block"
                            >
                                <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-gray-100 dark:border-slate-800 relative">
                                    <img
                                        src={deal.image}
                                        alt={deal.name}
                                        className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300"
                                    />
                                </div>
                                <div className="space-y-0.5 px-0.5">
                                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-slate-100 truncate line-clamp-1">
                                        {deal.name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400 font-bold">
                                        <span>{deal.rating} ★</span>
                                        <span>•</span>
                                        <span>{deal.time}</span>
                                    </div>
                                    <div className="text-[11px] font-extrabold text-red-500">
                                        {deal.deliveryFee}
                                    </div>
                                    {deal.promo && (
                                        <div className="text-[11px] font-extrabold text-red-500">
                                            {deal.promo}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                        No active items posted in database
                    </div>
                )}
            </section>

            {/* Summer of DashPass Promo Banner */}
            <section className="rounded-3xl border border-gray-100 shadow-md p-6 bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                {/* Visual badge element */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="h-16 w-36 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-700 flex flex-col items-center justify-center text-white shrink-0 shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--color-primary)_1px,transparent_1px)] bg-[size:8px_8px]" />
                        <span className="text-[9px] font-black tracking-widest opacity-80">SUMMER | SUQAPASS</span>
                        <span className="text-xs font-black tracking-tight mt-0.5">PLUS UNLOCK</span>
                        <span className="text-[11px] font-black text-emerald-400">$0 DELIVERY FEES</span>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">
                            Summer of SuqaPass is on
                        </h3>
                         <p className="text-sm text-gray-400 dark:text-slate-500 font-semibold">
                             Enjoy exclusive local savings and secure escrow trades.
                         </p>
                     </div>
                 </div>
                 
                 <button className="btn-premium bg-slate-900 text-white text-sm font-extrabold px-6 py-3 rounded-full hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-md shrink-0 cursor-pointer">
                     Start free trial
                 </button>
            </section>

            {/* Nearby Seller Stores */}
            <section className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-black text-gray-950 dark:text-slate-100 font-poppins">
                         Nearby Seller Stores
                     </h2>
                     <div className="flex items-center gap-3">
                         <Link 
                             href="/search" 
                             className="text-sm font-extrabold text-gray-600 hover:text-primary dark:text-slate-400"
                         >
                            See All
                        </Link>
                        <div className="flex gap-1">
                            <button className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {fastestList.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {fastestList.map((shop) => (
                            <Link 
                                href={`/shop/${shop.slug}`}
                                key={shop.id} 
                                className="space-y-2 group cursor-pointer block"
                            >
                                <div className="aspect-video rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 relative bg-slate-50">
                                    <img
                                        src={shop.image}
                                        alt={shop.name}
                                        className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300"
                                    />
                                </div>
                                <div className="space-y-0.5 px-0.5">
                                     <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 truncate line-clamp-1">
                                         {shop.name}
                                     </h4>
                                     <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400 font-semibold">
                                         <span>{shop.rating}</span>
                                         <span>•</span>
                                         <span>{shop.dist}</span>
                                         <span>•</span>
                                         <span>{shop.time}</span>
                                     </div>
                                     <div className="text-[11px] font-extrabold text-red-500">
                                         Lower fees
                                     </div>
                                     <div className="text-[11px] font-black text-red-500">
                                         {shop.note}
                                     </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                        No registered seller accounts found in database
                    </div>
                )}
            </section>

        </div>
    );
}
