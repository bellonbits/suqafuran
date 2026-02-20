import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import { Filter, ChevronDown, ListFilter, Loader2, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { FilterSidebar } from '../components/FilterSidebar';

const CategoryListingPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [searchParams] = useSearchParams();
    const subcategoryParam = searchParams.get('subcategory');
    const [attributeFilters, setAttributeFilters] = useState<Record<string, any>>(() => {
        const filters: Record<string, any> = {};
        if (subcategoryParam) {
            filters['subcategory'] = subcategoryParam;
        }
        return filters;
    });

    // Sync subcategory from URL if it changes
    useEffect(() => {
        setAttributeFilters(prev => {
            const newFilters = { ...prev };
            if (subcategoryParam) {
                newFilters['subcategory'] = subcategoryParam;
            } else {
                delete newFilters['subcategory'];
            }
            return newFilters;
        });
    }, [subcategoryParam]);

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const displayCategories = categories || [];
    const category = displayCategories.find(c => String(c.id) === String(categoryId));

    const [location, setLocation] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const { data: listings, isLoading } = useQuery({
        queryKey: ['listings', categoryId, location, minPrice, maxPrice, attributeFilters],
        queryFn: () => listingService.getListings({
            category_id: categoryId,
            location,
            min_price: minPrice,
            max_price: maxPrice,
            attrs: Object.keys(attributeFilters).length > 0 ? JSON.stringify(attributeFilters) : undefined
        }),
        enabled: !!categoryId,
    });

    return (
        <PublicLayout>
            <div className="p-6 space-y-6">
                {/* Breadcrumbs & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <nav className="text-sm text-gray-500 mb-1">
                            <span className="hover:text-blue-400 cursor-pointer" onClick={() => navigate('/dashboard')}>Dashboard</span>
                            <span className="mx-2">/</span>
                            <Link to="/dashboard" className="hover:text-blue-400">Categories</Link>
                            <span className="mx-2">/</span>
                            <span className="text-gray-900 font-medium">{category?.name}</span>
                        </nav>
                        <h1 className="text-2xl font-bold text-gray-900">{category?.name || 'Products'} <span className="text-gray-400 font-normal text-lg">in Africa</span></h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="md:hidden"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                        <div className="relative group">
                            <Button variant="outline" size="sm" className="gap-2 bg-white">
                                <ListFilter className="h-4 w-4" />
                                Sort: Newest
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Filters */}
                    <FilterSidebar
                        showFilters={showFilters}
                        onClose={() => setShowFilters(false)}
                        categoryId={categoryId}
                        location={location}
                        setLocation={setLocation}
                        minPrice={minPrice}
                        setMinPrice={setMinPrice}
                        maxPrice={maxPrice}
                        setMaxPrice={setMaxPrice}
                        attributeFilters={attributeFilters}
                        setAttributeFilters={setAttributeFilters}
                    />

                    {/* Listings Grid */}
                    <div className="flex-1 min-w-0">
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                                {listings?.length === 0 ? (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Tag className="h-10 w-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                            We couldn't find any items in <span className="font-bold text-gray-700">{category?.name}</span> matching your filters.
                                        </p>
                                        <Button onClick={() => navigate('/post-ad')} className="rounded-xl px-8 shadow-lg shadow-primary-500/20">
                                            Post an Ad in this Category
                                        </Button>
                                    </div>
                                ) : (
                                    listings?.map((ad) => (
                                        <ProductCard
                                            key={ad.id}
                                            id={String(ad.id)}
                                            title={ad.title}
                                            price={ad.price}
                                            currency={ad.currency}
                                            location={ad.location}
                                            imageUrl={ad.images?.[0] || ''}
                                            isVerified={ad.owner?.is_verified}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {listings && listings.length > 0 && (
                            <div className="mt-12 flex justify-center gap-2">
                                <Button variant="outline" size="sm" disabled className="rounded-lg">Previous</Button>
                                {[1, 2, 3].map((page, i) => (
                                    <Button
                                        key={i}
                                        variant={page === 1 ? 'primary' : 'ghost'}
                                        size="sm"
                                        className={cn("w-9 h-9 p-0 rounded-lg", page === 1 && "shadow-md")}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button variant="outline" size="sm" className="rounded-lg">Next</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export { CategoryListingPage };
