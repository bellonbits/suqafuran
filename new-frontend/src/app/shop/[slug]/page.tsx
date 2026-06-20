"use client";

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ListFilter, ArrowRight, ChevronRight, ChevronLeft, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../../../store/useCart';
import { listingsService } from '../../../services/listings';
import api from '../../../services/api';
import type { Listing, Category as DbCategory } from '../../../types';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default function ShopProfilePage({ params }: PageProps) {
    const { slug } = use(params);
    const { addToCart } = useCartStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [loading, setLoading] = useState(true);
    
    const [shopDetails, setShopDetails] = useState<any | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [ownerAvatar, setOwnerAvatar] = useState<string | null>(null);
    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);

    useEffect(() => {
        async function loadShopProfile() {
            try {
                // Fetch categories
                const categoriesData = await listingsService.getCategories();
                setDbCategories(categoriesData || []);

                // Fetch owner listings
                const ownerId = parseInt(slug, 10);
                const fetchedListings = await listingsService.getListings({ owner_id: ownerId });
                setListings(fetchedListings || []);

                // Fetch public user details
                const userRes = await api.get(`/users/public/${slug}`);
                if (userRes.data) {
                    setShopDetails(userRes.data);
                    setOwnerAvatar(userRes.data.avatar_url || null);
                } else if (fetchedListings.length > 0 && fetchedListings[0].owner) {
                    const owner = fetchedListings[0].owner;
                    setShopDetails({
                        id: owner.id,
                        full_name: owner.full_name,
                        email: owner.email || '',
                        phone: owner.phone || '',
                        is_verified: owner.is_verified,
                        verified_level: owner.verified_level || 'guest',
                        avatar_url: owner.avatar_url,
                        trust_score: owner.trust_score || 95,
                        trust_level: owner.trust_level || 'NEW'
                    });
                    setOwnerAvatar(owner.avatar_url || null);
                }
            } catch (err) {
                console.error("Error loading shop profile from backend:", err);
            } finally {
                setLoading(false);
            }
        }
        loadShopProfile();
    }, [slug]);

    // category map for quick lookup
    const categoryMap = React.useMemo(() => {
        const catMap = new Map<number, DbCategory>();
        dbCategories.forEach(cat => {
            catMap.set(cat.id, cat);
        });
        return catMap;
    }, [dbCategories]);

    const subcategoryMap = React.useMemo(() => {
        const subMap = new Map<number, any>();
        dbCategories.forEach(cat => {
            cat.subcategories?.forEach(sub => {
                subMap.set(sub.id, { ...sub, categorySlug: cat.slug });
            });
        });
        return subMap;
    }, [dbCategories]);

    const isGroceryStore = React.useMemo(() => {
        if (listings.length === 0) return false;
        const groceryCount = listings.filter(l => {
            const cat = categoryMap.get(l.category_id);
            return cat?.slug === 'food-groceries';
        }).length;
        return groceryCount / listings.length > 0.5;
    }, [listings, categoryMap]);

    const dynamicTabs = React.useMemo(() => {
        const tabsSet = new Set<string>();
        tabsSet.add('All');

        listings.forEach(l => {
            if (isGroceryStore) {
                if (l.subcategory_id) {
                    const sub = subcategoryMap.get(l.subcategory_id);
                    if (sub) {
                        tabsSet.add(sub.name_en.split(' (')[0]);
                    }
                }
            } else {
                const cat = categoryMap.get(l.category_id);
                if (cat) {
                    tabsSet.add(cat.name_en.split(' (')[0]);
                }
            }
        });

        // Add Deals if there are negotiable listings
        const hasDeals = listings.some(l => l.is_negotiable);
        if (hasDeals) {
            tabsSet.add('Deals');
        }

        return Array.from(tabsSet);
    }, [listings, isGroceryStore, categoryMap, subcategoryMap]);

    const getTabIconAndColor = (tabName: string) => {
        const lower = tabName.toLowerCase();
        if (lower === 'all') return { icon: '✨', color: 'bg-indigo-500 text-white' };
        if (lower === 'deals') return { icon: '🏷️', color: 'bg-red-500 text-white' };
        
        if (lower.includes('vegetable') || lower.includes('fruit') || lower.includes('produce')) 
            return { icon: '🥦', color: 'bg-green-500 text-white' };
        if (lower.includes('dairy') || lower.includes('egg') || lower.includes('milk')) 
            return { icon: '🥛', color: 'bg-blue-500 text-white' };
        if (lower.includes('meat') || lower.includes('seafood') || lower.includes('fish')) 
            return { icon: '🥩', color: 'bg-amber-600 text-white' };
        if (lower.includes('pantry') || lower.includes('dry') || lower.includes('grain')) 
            return { icon: '🥫', color: 'bg-amber-500 text-white' };
        if (lower.includes('snack') || lower.includes('sweet') || lower.includes('candy')) 
            return { icon: '🍿', color: 'bg-pink-500 text-white' };
        if (lower.includes('beverage') || lower.includes('drink')) 
            return { icon: '🥤', color: 'bg-red-500 text-white' };
        if (lower.includes('bakery') || lower.includes('breakfast') || lower.includes('bread')) 
            return { icon: '🍞', color: 'bg-yellow-600 text-white' };
        if (lower.includes('frozen')) 
            return { icon: '🍦', color: 'bg-cyan-400 text-white' };
        
        if (lower.includes('food') || lower.includes('grocery')) 
            return { icon: '🍎', color: 'bg-green-500 text-white' };
        if (lower.includes('cloth') || lower.includes('shoe') || lower.includes('apparel')) 
            return { icon: '👕', color: 'bg-violet-500 text-white' };
        if (lower.includes('house') || lower.includes('home')) 
            return { icon: '🛋️', color: 'bg-emerald-500 text-white' };
        if (lower.includes('electronics') || lower.includes('tech') || lower.includes('appliance')) 
            return { icon: '💻', color: 'bg-slate-700 text-white' };
        if (lower.includes('vehicle') || lower.includes('car')) 
            return { icon: '🚗', color: 'bg-blue-600 text-white' };
        if (lower.includes('live') || lower.includes('animal')) 
            return { icon: '🐪', color: 'bg-orange-500 text-white' };
        if (lower.includes('land') || lower.includes('farm')) 
            return { icon: '🌾', color: 'bg-emerald-600 text-white' };
        if (lower.includes('service')) 
            return { icon: '💼', color: 'bg-gray-600 text-white' };
        if (lower.includes('beauty') || lower.includes('health') || lower.includes('personal')) 
            return { icon: '🧴', color: 'bg-rose-400 text-white' };
        if (lower.includes('estate') || lower.includes('property') || lower.includes('rent')) 
            return { icon: '🏢', color: 'bg-teal-500 text-white' };
        
        return { icon: '📦', color: 'bg-slate-500 text-white' };
    };

    const storeCategories = dynamicTabs.map(tab => {
        const { icon, color } = getTabIconAndColor(tab);
        return { name: tab, icon, color };
    });

    const filteredListings = React.useMemo(() => {
        let items = listings;

        if (activeTab !== 'All') {
            if (activeTab === 'Deals') {
                items = items.filter(l => l.is_negotiable);
            } else if (isGroceryStore) {
                items = items.filter(l => {
                    if (!l.subcategory_id) return false;
                    const sub = subcategoryMap.get(l.subcategory_id);
                    if (!sub) return false;
                    return sub.name_en.split(' (')[0] === activeTab;
                });
            } else {
                items = items.filter(l => {
                    const cat = categoryMap.get(l.category_id);
                    if (!cat) return false;
                    return cat.name_en.split(' (')[0] === activeTab;
                });
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(l => 
                (l.title_en || '').toLowerCase().includes(query) || 
                (l.title_so || '').toLowerCase().includes(query) ||
                (l.description_en || '').toLowerCase().includes(query)
            );
        }

        return items;
    }, [listings, activeTab, searchQuery, isGroceryStore, categoryMap, subcategoryMap]);

    const groupedListings = React.useMemo(() => {
        const groups: { [key: string]: Listing[] } = {};
        listings.forEach(l => {
            let key = 'Other Items';
            if (isGroceryStore) {
                if (l.subcategory_id) {
                    const sub = subcategoryMap.get(l.subcategory_id);
                    if (sub) {
                        key = sub.name_en.split(' (')[0];
                    }
                }
            } else {
                const cat = categoryMap.get(l.category_id);
                if (cat) {
                    key = cat.name_en.split(' (')[0];
                }
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(l);
        });
        return groups;
    }, [listings, isGroceryStore, categoryMap, subcategoryMap]);

    // Shop/Owner details
    const storeName = shopDetails?.business?.name || shopDetails?.full_name || "Market Shop";
    const storeBrandColor = shopDetails?.business?.brand_color || '#ef4444';
    const isVerified = shopDetails?.business?.is_verified || shopDetails?.is_verified || false;
    const storeLogo = shopDetails?.business?.logo_url || ownerAvatar || '';
    const storeAddress = shopDetails?.business?.address || shopDetails?.location || "Mogadishu Central";
    const storeTagline = shopDetails?.business?.tagline || shopDetails?.business?.description || shopDetails?.response_time || "High quality local goods listed directly";
    const storeRating = shopDetails?.business?.rating || (shopDetails?.trust_score ? (shopDetails.trust_score / 20).toFixed(1) : '4.5');

    const renderListingCard = (l: Listing, showGrid: boolean = false) => {
        const name = l.title_en || l.title_so || "Product";
        const image = l.images?.[0] || "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=300";
        const price = l.price;
        const size = l.condition || "Market Listing";
        const stockStatus = l.status === "active" ? "Active ad" : "Sold";
        
        return (
            <div 
                key={l.id}
                className={`${showGrid ? 'w-full' : 'w-40 shrink-0'} space-y-2 group relative`}
            >
                <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-gray-100 dark:border-slate-800 relative">
                    <Link href={`/listing/${l.id}`} className="block w-full h-full">
                        <img
                            src={image}
                            alt={name}
                            className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                    </Link>
                    <button
                        onClick={() => addToCart({ id: l.id, name: name, price: price })}
                        className="absolute bottom-2 right-2 h-8 w-8 bg-white border border-gray-200 text-gray-800 rounded-full flex items-center justify-center font-bold text-lg shadow-md hover:bg-slate-50 active:scale-90 cursor-pointer shrink-0 z-10"
                        title="Add to cart"
                    >
                        +
                    </button>
                </div>

                <div className="space-y-0.5 px-0.5">
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-gray-900 dark:text-slate-100">
                            ${price}
                        </span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {size}
                    </div>
                    <Link href={`/listing/${l.id}`} className="block">
                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate line-clamp-1 leading-snug hover:text-red-500 transition-colors">
                            {name}
                        </h4>
                    </Link>
                    {stockStatus && (
                        <div className="flex items-center gap-1.5 pt-0.5 text-[9px] text-green-600 font-extrabold uppercase tracking-wide">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                            <span>{stockStatus}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full" />
                            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-full" />
                        </div>
                    </div>
                    <div className="h-10 w-64 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                </div>
                <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="space-y-4">
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-40 h-56 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!shopDetails) {
        return (
            <div className="py-12 px-4 sm:px-6 lg:px-8 text-center bg-white dark:bg-slate-900 min-h-screen flex flex-col items-center justify-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h1 className="text-xl font-black text-gray-900 dark:text-slate-100">Seller Profile Not Found</h1>
                <p className="text-sm text-gray-500">This user profile does not exist in the database or has no active listings.</p>
                <Link href="/" className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 px-6 py-2.5 rounded-full text-xs font-extrabold transition-all shadow-md">
                    Return to Homepage
                </Link>
            </div>
        );
    }

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8 bg-white dark:bg-slate-900 min-h-screen">
            
            {/* Store details row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    {/* Logo/Avatar */}
                    {storeLogo ? (
                        <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 shadow">
                            <img src={storeLogo} alt={storeName} className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-black font-poppins shadow shrink-0" style={{ backgroundColor: storeBrandColor }}>
                            {storeName.charAt(0)}
                        </div>
                    )}
                    
                    {/* Meta info */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 font-poppins">
                                {storeName}
                            </h1>
                            {isVerified && <CheckCircle2 className="h-5 w-5 text-blue-500 fill-blue-50" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500 dark:text-slate-400">
                            <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full shrink-0">Active</span>
                            <span>•</span>
                            <span>Trust Score: {storeRating} ★</span>
                            <span>•</span>
                            <span>{storeAddress}</span>
                            <span>•</span>
                            <span className="underline hover:text-gray-700 cursor-pointer">Pricing & Fees</span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-50 font-semibold flex items-center gap-1">
                            {storeTagline}
                            <AlertCircle className="h-3.5 w-3.5" />
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search ${storeName}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-full border border-gray-200 bg-slate-100 py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                </div>
            </div>

            {/* Horizontal Categories selector row */}
            {storeCategories.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none hide-scrollbar">
                    {storeCategories.map((cat, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveTab(cat.name)}
                            className="flex flex-col items-center gap-2 group shrink-0"
                        >
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl shadow-md transition-transform duration-300 group-hover:scale-110 ${cat.color} ${activeTab === cat.name ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}>
                                {cat.icon}
                            </div>
                            <span className={`text-[10px] font-black group-hover:text-gray-900 dark:group-hover:text-slate-100 ${activeTab === cat.name ? 'text-gray-900 dark:text-slate-100 font-black' : 'text-gray-600 dark:text-slate-300'}`}>
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Blue Coupon Banner */}
            <div className="rounded-3xl bg-blue-900 text-white p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-1 flex-1">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-[9px] font-black uppercase tracking-wider">Store Pass</span>
                    <h2 className="text-lg font-black font-poppins leading-tight">
                        Enjoy free delivery and direct support for {storeName}.
                    </h2>
                    <p className="text-xs opacity-90 font-medium">Use code SUQAPASS for direct-to-home secure delivery.</p>
                </div>
                <button className="btn-premium bg-white text-blue-900 text-xs font-extrabold px-6 py-2.5 rounded-full hover:bg-slate-50 shadow-md shrink-0 cursor-pointer flex items-center gap-1">
                    <span>Apply Coupon</span>
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>

            {/* Main Content Sections */}
            {activeTab === 'All' ? (
                <div className="space-y-8">
                    {Object.entries(groupedListings).map(([groupName, groupItems]) => {
                        const filteredGroupItems = groupItems.filter(item => 
                            !searchQuery || 
                            (item.title_en || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.title_so || '').toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        if (filteredGroupItems.length === 0) return null;
                        return (
                            <section key={groupName} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black text-gray-950 dark:text-slate-100 font-poppins">
                                        {groupName}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-extrabold text-gray-500 hover:text-primary cursor-pointer" onClick={() => setActiveTab(groupName)}>See All</span>
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

                                <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none hide-scrollbar">
                                    {filteredGroupItems.map((item) => renderListingCard(item))}
                                </div>
                            </section>
                        );
                    })}
                    {listings.length === 0 && (
                        <div className="py-12 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                            No listings registered under this seller.
                        </div>
                    )}
                </div>
            ) : (
                <section className="space-y-4">
                    <h2 className="text-lg font-black text-gray-950 dark:text-slate-100 font-poppins">
                        {activeTab} ({filteredListings.length})
                    </h2>
                    {filteredListings.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {filteredListings.map((item) => renderListingCard(item, true))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                            No items found matching this category
                        </div>
                    )}
                </section>
            )}

        </div>
    );
}
