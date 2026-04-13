import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLanguageField } from '../hooks/useLanguageField';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import { Filter, ChevronDown, ListFilter, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { FilterSidebar } from '../components/FilterSidebar';
// Skeleton card shown while listings load
const SkeletonCard = () => (
    <div className="bg-white rounded-xl overflow-hidden card-shadow animate-pulse">
        <div className="aspect-[16/9] bg-gray-200" />
        <div className="px-2.5 pt-2 pb-2.5 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-4/5" />
            <div className="h-3 bg-gray-200 rounded w-3/5" />
            <div className="h-3 bg-gray-100 rounded w-2/5" />
        </div>
    </div>
);

const SKELETON_COUNT = 8;

// Debounce hook — delays queryKey update until user stops typing/clicking
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

const CategoryListingPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getField } = useLanguageField();
    const [showFilters, setShowFilters] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const subcategoryParam = searchParams.get('subcategory');
    const subsubcategoryParam = searchParams.get('subsubcategory');

    const [attributeFilters, setAttributeFilters] = useState<Record<string, any>>(() => {
        const filters: Record<string, any> = {};
        if (subcategoryParam) filters['subcategory'] = subcategoryParam;
        if (subsubcategoryParam) filters['subsubcategory'] = subsubcategoryParam;
        return filters;
    });

    // Sync subcategory from URL
    useEffect(() => {
        setAttributeFilters(prev => {
            const next = { ...prev };
            if (subcategoryParam) next['subcategory'] = subcategoryParam;
            else delete next['subcategory'];
            
            if (subsubcategoryParam) next['subsubcategory'] = subsubcategoryParam;
            else delete next['subsubcategory'];
            
            return next;
        });
    }, [subcategoryParam, subsubcategoryParam]);

    const [location, setLocation] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Debounce all filter inputs — 350ms means no API call while user is typing
    const debouncedLocation = useDebounce(location, 350);
    const debouncedMin = useDebounce(minPrice, 350);
    const debouncedMax = useDebounce(maxPrice, 350);
    const debouncedFilters = useDebounce(attributeFilters, 350);

    // Stable serialisation to avoid unnecessary query key changes
    const attrsParam = useMemo(
        () => Object.keys(debouncedFilters).length > 0 ? JSON.stringify(debouncedFilters) : undefined,
        [debouncedFilters]
    );

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
        staleTime: 10 * 60_000, // categories change rarely — cache 10 min
    });

    const category = useMemo(
        () => categories?.find(c => String(c.id) === String(categoryId) || c.slug === categoryId),
        [categories, categoryId]
    );
    const categoryName = category ? getField(category, 'name') : '';

    const subcategories = (category?.subcategories || []).map((s: any) => ({
        id: s.id,
        name: getField(s, 'name'),
        slug: s.slug,
        image_url: s.image_url
    }));

    const activeSubcategory = subcategoryParam || attributeFilters['subcategory'] || null;

    const selectSubcategory = useCallback((slug: string | null) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (slug) {
                next.set('subcategory', slug);
                next.delete('subsubcategory'); // clear sub-sub when sub changes
            } else {
                next.delete('subcategory');
                next.delete('subsubcategory');
            }
            return next;
        });
    }, [setSearchParams]);

    const selectSubSubcategory = useCallback((slug: string | null) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (slug) next.set('subsubcategory', slug);
            else next.delete('subsubcategory');
            return next;
        });
    }, [setSearchParams]);

    const { data: listings, isLoading, isFetching } = useQuery({
        queryKey: ['listings', categoryId, debouncedLocation, debouncedMin, debouncedMax, attrsParam],
        queryFn: () => listingService.getListings({
            category_id: categoryId,
            ...(debouncedLocation ? { location: debouncedLocation } : {}),
            ...(debouncedMin !== '' ? { min_price: debouncedMin } : {}),
            ...(debouncedMax !== '' ? { max_price: debouncedMax } : {}),
            ...(attrsParam ? { attrs: attrsParam } : {}),
            limit: 40,
        }),
        enabled: !!categoryId,
        placeholderData: (prev) => prev, // keep old data visible while refetching
    });

    const onCloseFilters = useCallback(() => setShowFilters(false), []);
    const onToggleFilters = useCallback(() => setShowFilters(v => !v), []);

    return (
        <PublicLayout>
            <div className="p-6 space-y-6">
                {/* Breadcrumbs & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <nav className="text-sm text-gray-500 mb-1">
                            <span className="hover:text-primary-400 cursor-pointer" onClick={() => navigate('/dashboard')}>{t('category.dashboard')}</span>
                            <span className="mx-2">/</span>
                            <Link to="/dashboard" className="hover:text-primary-400">{t('category.categories')}</Link>
                            <span className="mx-2">/</span>
                            <span className="text-gray-900 font-medium">{categoryName}</span>
                        </nav>
                        <h1 className="text-2xl font-black text-gray-900">
                            {categoryName || 'Products'}{' '}
                            <span className="text-gray-400 font-normal text-lg">{t('listing.inAfrica')}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="md:hidden" onClick={onToggleFilters}>
                            <Filter className="h-4 w-4 mr-2" />
                            {t('category.filters')}
                        </Button>
                        <div className="relative group">
                            <Button variant="outline" size="sm" className="gap-2 bg-white">
                                <ListFilter className="h-4 w-4" />
                                {t('category.sortNewest')}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Subcategory chips */}
                {subcategories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        <button
                            onClick={() => selectSubcategory(null)}
                            className={cn(
                                'shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors',
                                !activeSubcategory
                                    ? 'bg-primary-500 text-white border-primary-500'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                            )}
                        >
                            {t('category.all', 'All')}
                        </button>
                        {subcategories.map((sub, idx) => {
                            const label = (t(`categories.${sub.name}`, sub.name as any) as string).replace(/^\d+\s/, '');
                            const value = sub.name;
                            const isActive = activeSubcategory === value;
                            return (
                                <button
                                    key={sub.id ?? idx}
                                    onClick={() => selectSubcategory(isActive ? null : value)}
                                    className={cn(
                                        'shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors',
                                        isActive
                                            ? 'bg-primary-500 text-white border-primary-500'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                    )}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Sub-subcategory chips (if a subcategory is active) */}
                {(() => {
                    const activeSub = (category?.subcategories || []).find((s: any) => getField(s, 'name') === activeSubcategory);
                    const subSubs = activeSub?.subsubcategories || [];
                    if (subSubs.length === 0) return null;

                    return (
                        <div className="flex gap-2 overflow-x-auto pb-1 mt-2 hide-scrollbar animate-in fade-in slide-in-from-left-2 transition-all">
                             <div className="shrink-0 flex items-center pr-2 border-r border-gray-200">
                                 <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mr-2" />
                             </div>
                             {subSubs.map((ss: any, idx: number) => {
                                 const label = getField(ss, 'name');
                                 const isActive = subsubcategoryParam === label;
                                 return (
                                     <button
                                         key={ss.id ?? idx}
                                         onClick={() => selectSubSubcategory(isActive ? null : label)}
                                         className={cn(
                                             'shrink-0 px-4 py-1.5 rounded-xl text-[13px] font-bold border transition-all whitespace-nowrap',
                                             isActive
                                                 ? 'bg-secondary-500 text-white border-secondary-500 shadow-sm'
                                                 : 'bg-white text-gray-500 border-gray-100 hover:border-secondary-100 hover:text-secondary-600'
                                         )}
                                     >
                                         {label}
                                     </button>
                                 );
                             })}
                        </div>
                    );
                })()}

                <div className="flex flex-col lg:flex-row gap-6">
                    <FilterSidebar
                        showFilters={showFilters}
                        onClose={onCloseFilters}
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
                        {/* Subtle top bar shows background refetch without blocking UI */}
                        {isFetching && !isLoading && (
                            <div className="h-0.5 bg-primary-500 animate-pulse rounded mb-2" />
                        )}

                        {isLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                                {listings?.length === 0 ? (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Tag className="h-10 w-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('category.noListings')}</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto mb-8">{t('category.noListingsDesc')}</p>
                                        <Button onClick={() => navigate('/post-ad')} className="rounded-xl px-8 shadow-lg shadow-primary-500/20">
                                            {t('category.postInCategory')}
                                        </Button>
                                    </div>
                                ) : (
                                    listings?.map((ad) => (
                                        <ProductCard
                                            key={ad.id}
                                            id={String(ad.id)}
                                            title_en={ad.title_en}
                                            title_so={ad.title_so}
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

                        {listings && listings.length > 0 && (
                            <div className="mt-12 flex justify-center gap-2">
                                <Button variant="outline" size="sm" disabled className="rounded-lg">{t('category.previous')}</Button>
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
                                <Button variant="outline" size="sm" className="rounded-lg">{t('category.next')}</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export { CategoryListingPage };
