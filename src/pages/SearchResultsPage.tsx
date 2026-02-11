import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import { Search, SlidersHorizontal, Info, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const { data: results = [], isLoading } = useQuery({
        queryKey: ['listings', 'search', query],
        queryFn: () => listingService.getListings({ q: query }),
    });

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {query ? `Search results for "${query}"` : "All Listings"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">{results.length} items found</p>
                    </div>
                    <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {results.map((ad) => (
                            <ProductCard
                                key={ad.id}
                                id={String(ad.id)}
                                title={ad.title}
                                price={ad.price}
                                location={ad.location}
                                imageUrl={ad.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400'}
                                isVerified={ad.owner?.is_verified}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
                        <p className="text-gray-500 max-w-sm text-center">
                            We couldn't find anything matching your search. Try different keywords or browse categories.
                        </p>
                        <Button className="mt-6 rounded-full px-8">Browse All Categories</Button>
                    </div>
                )}

                {/* Pro tip */}
                <div className="mt-12 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-800 leading-normal">
                        <strong>Tip:</strong> Be specific. Instead of "car", try "Toyota Corolla 2015" for better results.
                    </p>
                </div>
            </div>
        </PublicLayout>
    );
};

export { SearchResultsPage };
