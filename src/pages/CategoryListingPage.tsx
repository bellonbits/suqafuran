import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import { Filter, ChevronDown, ListFilter, MapPin, Tag, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { cn } from '../utils/cn';
import { getAttributesForCategory } from '../utils/categoryAttributes';
import { JIJI_CATEGORIES } from '../utils/jijiCategories';

const CategoryListingPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [attributeFilters, setAttributeFilters] = useState<Record<string, any>>({});

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const displayCategories = categories || [];
    const category = displayCategories.find(c => String(c.id) === String(categoryId));

    const [location, setLocation] = useState('');

    const { data: listings, isLoading } = useQuery({
        queryKey: ['listings', categoryId, location, attributeFilters],
        queryFn: () => listingService.getListings({
            category_id: categoryId,
            location,
            attrs: Object.keys(attributeFilters).length > 0 ? JSON.stringify(attributeFilters) : undefined
        }),
        enabled: !!categoryId,
    });

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumbs & Header */}
                <div className="mb-6">
                    <nav className="text-sm text-gray-500 mb-2">
                        <span className="hover:text-primary-600 cursor-pointer">Home</span>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 font-medium">{category?.name || 'Category'}</span>
                    </nav>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold text-gray-900">{category?.name || 'Products'} in Africa</h1>
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
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ListFilter className="h-4 w-4" />
                                    Sort by: Newest
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className={cn(
                        "w-full md:w-64 space-y-8 shrink-0",
                        showFilters ? "block" : "hidden md:block"
                    )}>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary-600" />
                                    Location
                                </h3>
                                <Input
                                    placeholder="Region or City"
                                    className="rounded-lg h-9"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary-600" />
                                    Price Range (KES)
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="Min" type="number" className="rounded-lg h-9" />
                                    <Input placeholder="Max" type="number" className="rounded-lg h-9" />
                                </div>
                            </div>

                            {/* Conditional Filters */}
                            {['electronics', 'phones', 'cars', 'fashion', 'kids-toys', 'commercial', 'repair-construction'].includes(categoryId || '') && (
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <SlidersHorizontal className="h-4 w-4 text-primary-600" />
                                        Condition
                                    </h3>
                                    <div className="space-y-2">
                                        {['New', 'Used', 'Refurbished'].map(cond => (
                                            <label key={cond} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-primary-600">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-primary-600 focus:ring-primary-500"
                                                    checked={attributeFilters['condition'] === cond}
                                                    onChange={(e) => setAttributeFilters(prev => {
                                                        const newFilters = { ...prev };
                                                        if (e.target.checked) {
                                                            newFilters['condition'] = cond;
                                                        } else {
                                                            delete newFilters['condition'];
                                                        }
                                                        return newFilters;
                                                    })}
                                                />
                                                {cond}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dynamic Category Filters */}
                            {(() => {
                                // Try to find in JIJI_CATEGORIES first for subcategories
                                const jijiCategory = JIJI_CATEGORIES.find(c => c.id === categoryId);

                                return (
                                    <>
                                        {jijiCategory && jijiCategory.subcategories.length > 0 && (
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <ListFilter className="h-4 w-4 text-primary-600" />
                                                    Subcategory
                                                </h3>
                                                <select
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-1 focus:ring-primary-600"
                                                    value={attributeFilters['subcategory'] || ''}
                                                    onChange={(e) => setAttributeFilters(prev => ({ ...prev, 'subcategory': e.target.value || undefined }))}
                                                >
                                                    <option value="">All {jijiCategory.label}</option>
                                                    {jijiCategory.subcategories.map(sub => (
                                                        <option key={sub.name} value={sub.name}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Backend Attributes */}
                                        {category && getAttributesForCategory(Number(category.id)).map(attr => (
                                            <div key={attr.name}>
                                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <ChevronDown className="h-4 w-4 text-primary-600" />
                                                    {attr.label}
                                                </h3>
                                                {attr.type === 'select' ? (
                                                    <select
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-1 focus:ring-primary-600"
                                                        value={attributeFilters[attr.name] || ''}
                                                        onChange={(e) => setAttributeFilters(prev => ({ ...prev, [attr.name]: e.target.value || undefined }))}
                                                    >
                                                        <option value="">All {attr.label}s</option>
                                                        {attr.options?.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <Input
                                                        placeholder={`e.g. ${attr.placeholder || ''}`}
                                                        className="rounded-lg h-9"
                                                        value={attributeFilters[attr.name] || ''}
                                                        onChange={(e) => setAttributeFilters(prev => ({ ...prev, [attr.name]: e.target.value || undefined }))}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </>
                                );
                            })()}

                            <Button
                                className="w-full rounded-lg h-10"
                                onClick={() => setShowFilters(false)}
                            >
                                Apply Filters
                            </Button>
                        </div>

                        {/* Safety Tip card */}
                        <div className="bg-primary-50 p-5 rounded-xl border border-primary-100">
                            <h4 className="font-bold text-primary-800 text-sm mb-2">Safety Tips</h4>
                            <p className="text-primary-700 text-xs leading-relaxed">
                                Always meet sellers in public places and never pay before you see the item.
                            </p>
                        </div>
                    </aside>

                    {/* Listings Grid */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {listings?.length === 0 ? (
                                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <p className="text-gray-500">No listings found in this category yet. Be the first to post!</p>
                                        <Button className="mt-4" onClick={() => navigate('/post-ad')}>Post an Ad</Button>
                                    </div>
                                ) : (
                                    listings?.map((ad) => (
                                        <ProductCard
                                            key={ad.id}
                                            id={String(ad.id)}
                                            title={ad.title}
                                            price={ad.price}
                                            location={ad.location}
                                            imageUrl={ad.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400'}
                                            isVerified={ad.owner?.is_verified}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="mt-12 flex justify-center gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            {[1, 2, 3, '...', 10].map((page, i) => (
                                <Button
                                    key={i}
                                    variant={page === 1 ? 'primary' : 'ghost'}
                                    size="sm"
                                    className="w-10 h-10 p-0 rounded-full"
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export { CategoryListingPage };
