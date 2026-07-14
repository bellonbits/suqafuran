"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Grid, List, ChevronDown } from 'lucide-react';
import { listingsService } from '../../../services/listings';
import { ProductCard } from '../../../components/features/ProductCard';
import type { Listing } from '../../../types';

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
    const [openFilter, setOpenFilter] = useState<string | null>(null);

    useEffect(() => {
        const fetchListings = async () => {
            setIsLoading(true);
            try {
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

        if (query) {
            const lowQuery = query.toLowerCase();
            results = results.filter(l =>
                l.title_en?.toLowerCase().includes(lowQuery) ||
                l.description_en?.toLowerCase().includes(lowQuery)
            );
        }

        if (selectedCondition !== 'all') {
            results = results.filter(l => l.condition?.toLowerCase() === selectedCondition.toLowerCase());
        }

        if (priceMin) {
            results = results.filter(l => l.price >= Number(priceMin));
        }
        if (priceMax) {
            results = results.filter(l => l.price <= Number(priceMax));
        }

        if (location !== 'all') {
            results = results.filter(l => l.location?.toLowerCase().includes(location.toLowerCase()));
        }

        if (sortBy === 'price-asc') {
            results.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            results.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'views') {
            results.sort((a, b) => (b.views || 0) - (a.views || 0));
        }

        setFilteredListings(results);
    }, [listings, query, selectedCategory, selectedCondition, priceMin, priceMax, location, sortBy]);

    const getSortLabel = () => {
        switch(sortBy) {
            case 'price-asc': return 'Price: Low to High';
            case 'price-desc': return 'Price: High to Low';
            case 'views': return 'Most Viewed';
            default: return 'Recently Added';
        }
    };

    return (
        <div className="w-full">
            {/* Filter Pills Bar */}
            <div className="sticky top-16 z-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col gap-4">
                        {/* Results Count */}
                        <div className="space-y-0.5">
                            <h1 className="text-base font-bold text-gray-900 dark:text-slate-100">
                                {filteredListings.length} Products Found
                            </h1>
                        </div>

                        {/* Filter Pills */}
                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Sort Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenFilter(openFilter === 'sort' ? null : 'sort')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-full text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {getSortLabel()}
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                {openFilter === 'sort' && (
                                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-20">
                                        <button onClick={() => { setSortBy('recent'); setOpenFilter(null); }} className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Recently Added</button>
                                        <button onClick={() => { setSortBy('price-asc'); setOpenFilter(null); }} className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Price: Low to High</button>
                                        <button onClick={() => { setSortBy('price-desc'); setOpenFilter(null); }} className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Price: High to Low</button>
                                        <button onClick={() => { setSortBy('views'); setOpenFilter(null); }} className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Most Viewed</button>
                                    </div>
                                )}
                            </div>

                            {/* Condition Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenFilter(openFilter === 'condition' ? null : 'condition')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-full text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {selectedCondition === 'all' ? 'Condition' : selectedCondition === 'new' ? 'Brand New' : 'Used / Like New'}
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                {openFilter === 'condition' && (
                                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-20">
                                        <button onClick={() => { setSelectedCondition('all'); setOpenFilter(null); }} className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">All Conditions</button>
                                        <button onClick={() => { setSelectedCondition('new'); setOpenFilter(null); }} className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Brand New</button>
                                        <button onClick={() => { setSelectedCondition('used'); setOpenFilter(null); }} className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Used / Like New</button>
                                    </div>
                                )}
                            </div>

                            {/* Price Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenFilter(openFilter === 'price' ? null : 'price')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-full text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Price {priceMin || priceMax ? '✓' : ''}
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                {openFilter === 'price' && (
                                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-20 p-4 w-64">
                                        <div className="space-y-3">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={priceMin}
                                                onChange={(e) => setPriceMin(e.target.value)}
                                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 outline-none focus:border-blue-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={priceMax}
                                                onChange={(e) => setPriceMax(e.target.value)}
                                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 outline-none focus:border-blue-500"
                                            />
                                            <button
                                                onClick={() => setOpenFilter(null)}
                                                className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-[#5bc0e8] transition-colors text-sm"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* View Mode Toggle */}
                            <div className="ml-auto flex border border-gray-200 dark:border-slate-800 rounded-full p-1 bg-gray-100 dark:bg-slate-800">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-full cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-full cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {isLoading ? (
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="animate-pulse space-y-4">
                                <div className="aspect-square rounded-lg bg-gray-200 dark:bg-slate-800" />
                                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-800" />
                                <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-800" />
                            </div>
                        ))}
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">No Results Found</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Try adjusting your filters or search query</p>
                    </div>
                ) : (
                    <div className={
                        viewMode === 'grid'
                            ? "grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4"
                            : "space-y-4"
                    }>
                        {filteredListings.map((listing) => (
                            <ProductCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-12">Loading Search Results...</div>}>
            <SearchPageContent />
        </Suspense>
    );
}
