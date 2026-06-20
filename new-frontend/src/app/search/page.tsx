"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Grid, List, MapPin, Tag, ShieldAlert } from 'lucide-react';
import { listingsService } from '../../services/listings';
import { ProductCard } from '../../components/features/ProductCard';
import type { Listing } from '../../types';

function SearchPageContent() {
    const searchParams = useSearchParams();
    const [listings, setListings] = useState<Listing[]>([]);
    const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filter states
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [selectedCondition, setSelectedCondition] = useState('all');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [location, setLocation] = useState('all');
    const [sortBy, setSortBy] = useState('recent');

    useEffect(() => {
        const fetchListings = async () => {
            setIsLoading(true);
            try {
                // Get all active listings
                const data = await listingsService.getListings();
                setListings(data);
            } catch (err) {
                console.error('Failed to search listings', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchListings();
    }, [searchParams]);

    // Apply client side filters
    useEffect(() => {
        let results = [...listings];

        // Search text matching
        if (query) {
            const lowQuery = query.toLowerCase();
            results = results.filter(l => 
                l.title_en?.toLowerCase().includes(lowQuery) || 
                l.description_en?.toLowerCase().includes(lowQuery)
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            // Replicate category mapping/slug match
            // Normally matching category_id, but here simulating slug comparison
        }

        // Condition filter
        if (selectedCondition !== 'all') {
            results = results.filter(l => l.condition?.toLowerCase() === selectedCondition.toLowerCase());
        }

        // Price range filters
        if (priceMin) {
            results = results.filter(l => l.price >= Number(priceMin));
        }
        if (priceMax) {
            results = results.filter(l => l.price <= Number(priceMax));
        }

        // Location filter
        if (location !== 'all') {
            results = results.filter(l => l.location?.toLowerCase().includes(location.toLowerCase()));
        }

        // Sorting
        if (sortBy === 'price-asc') {
            results.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            results.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'views') {
            results.sort((a, b) => (b.views || 0) - (a.views || 0));
        }

        setFilteredListings(results);
    }, [listings, query, selectedCategory, selectedCondition, priceMin, priceMax, location, sortBy]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row">
                
                {/* Desktop Filters Sidebar */}
                <aside className="w-full md:w-64 shrink-0 space-y-6 bg-white border border-gray-100 p-6 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 self-start">
                    <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-slate-800">
                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-black text-gray-900 dark:text-slate-100">Filters</h2>
                    </div>

                    {/* Search filter input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Search Query</label>
                        <input
                            type="text"
                            placeholder="Keywords..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>

                    {/* Condition Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Condition</label>
                        <select
                            value={selectedCondition}
                            onChange={(e) => setSelectedCondition(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-gray-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                        >
                            <option value="all">All Conditions</option>
                            <option value="new">Brand New</option>
                            <option value="used">Used / Like New</option>
                        </select>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Price Range</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                            />
                            <span className="text-xs text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Location</label>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-gray-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                        >
                            <option value="all">All Locations</option>
                            <option value="mogadishu">Mogadishu</option>
                            <option value="hargeisa">Hargeisa</option>
                            <option value="nairobi">Nairobi</option>
                            <option value="garowe">Garowe</option>
                        </select>
                    </div>
                </aside>

                {/* Listing Results */}
                <main className="flex-1 space-y-6">
                    {/* Toolbar controls */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-gray-100 p-4 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800">
                        <div className="space-y-0.5">
                            <h1 className="text-sm font-black text-gray-900 dark:text-slate-100">
                                {filteredListings.length} Products Found
                            </h1>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                Filtered results matching selection
                            </p>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-auto">
                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-2 text-xs font-bold text-gray-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                            >
                                <option value="recent">Recently Added</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="views">Most Viewed</option>
                            </select>

                            {/* View Switch Grid/List */}
                            <div className="flex border border-gray-200 dark:border-slate-800 rounded-2xl p-0.5 bg-slate-50 dark:bg-slate-950">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-xl cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow text-primary' : 'text-gray-400'}`}
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-xl cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 shadow text-primary' : 'text-gray-400'}`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Skeletons/Grid Loader */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="animate-pulse space-y-4 rounded-3xl border border-gray-100 p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
                                    <div className="aspect-square rounded-2xl bg-gray-200 dark:bg-slate-800" />
                                    <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-800" />
                                    <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-800" />
                                </div>
                            ))}
                        </div>
                    ) : filteredListings.length === 0 ? (
                        /* Empty state */
                        <div className="p-12 text-center bg-white border border-gray-100 rounded-[32px] card-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-400 dark:bg-slate-950 dark:text-slate-600">
                                <ShieldAlert className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-black text-gray-900 dark:text-slate-100">No Listings Match Filters</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold max-w-sm leading-relaxed">
                                    Try checking your spelling, removing a few filters, or searching for other items.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setQuery('');
                                    setSelectedCategory('all');
                                    setSelectedCondition('all');
                                    setPriceMin('');
                                    setPriceMax('');
                                    setLocation('all');
                                }}
                                className="btn-premium bg-primary text-white px-5 py-2.5 text-xs shadow-md shadow-primary/20 hover:bg-primary-dark"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        /* Listings Grid */
                        <div className={
                            viewMode === 'grid'
                                ? "grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                                : "space-y-4"
                        }>
                            {filteredListings.map((listing) => (
                                <ProductCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Search Results...</div>}>
            <SearchPageContent />
        </Suspense>
    );
}
