import React, { useState } from 'react';
import { MapPin, ChevronDown, ChevronUp, ShieldCheck, ListFilter } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../utils/cn';
import { useQuery } from '@tanstack/react-query';
import { listingService } from '../services/listingService';

interface FilterSidebarProps {
    showFilters: boolean;
    onClose: () => void;
    categoryId?: string;
    location: string;
    setLocation: (loc: string) => void;
    minPrice?: string;
    setMinPrice?: (val: string) => void;
    maxPrice?: string;
    setMaxPrice?: (val: string) => void;
    attributeFilters: Record<string, any>;
    setAttributeFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const PRICE_RANGES = [
    { label: 'Under $10', min: '', max: '10' },
    { label: '$10 – $50', min: '10', max: '50' },
    { label: '$50 – $200', min: '50', max: '200' },
    { label: '$200 – $500', min: '200', max: '500' },
    { label: 'More than $500', min: '500', max: '' },
];

const FilterSidebar: React.FC<FilterSidebarProps> = ({
    showFilters,
    onClose,
    categoryId,
    location,
    setLocation,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    attributeFilters,
    setAttributeFilters
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        categories: true, price: true, verified: false, condition: false,
    });

    const toggleSection = (key: string) =>
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

    const updateFilter = (key: string, value: any) => {
        setAttributeFilters(prev => {
            const next = { ...prev };
            if (value !== undefined && value !== '') next[key] = value;
            else delete next[key];
            return next;
        });
    };

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const category = categories?.find(c => String(c.id) === String(categoryId) || c.slug === categoryId);
    const subcategories: string[] = category?.subcategories?.map((s: any) => s.name || s) || [];

    const activePriceRange = PRICE_RANGES.find(r => r.min === (minPrice ?? '') && r.max === (maxPrice ?? ''));

    const selectPriceRange = (r: typeof PRICE_RANGES[0]) => {
        if (activePriceRange?.label === r.label) {
            setMinPrice?.(''); setMaxPrice?.('');
        } else {
            setMinPrice?.(r.min); setMaxPrice?.(r.max);
        }
    };

    return (
        <aside className={cn(
            "w-full lg:w-60 shrink-0 space-y-0",
            showFilters ? "block" : "hidden lg:block"
        )}>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">

                {/* Categories / Subcategories */}
                {subcategories.length > 0 && (
                    <div>
                        <button
                            onClick={() => toggleSection('categories')}
                            className="w-full flex items-center justify-between px-4 py-3 font-bold text-sm text-gray-900"
                        >
                            <span className="flex items-center gap-2">
                                <ListFilter className="h-4 w-4 text-primary-500" />
                                {category?.name}
                            </span>
                            {expandedSections.categories
                                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                                : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </button>
                        {expandedSections.categories && (
                            <div className="px-4 pb-3 space-y-1">
                                {subcategories.map((sub: string) => (
                                    <button
                                        key={sub}
                                        onClick={() => updateFilter('subcategory', attributeFilters['subcategory'] === sub ? undefined : sub)}
                                        className={cn(
                                            'w-full text-left text-[13px] py-1 px-2 rounded-lg transition-colors',
                                            attributeFilters['subcategory'] === sub
                                                ? 'text-primary-600 font-bold bg-primary-50'
                                                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                                        )}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Location */}
                <div className="px-4 py-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                        <MapPin className="h-4 w-4 text-primary-500" />
                        Location
                    </label>
                    <input
                        type="text"
                        placeholder="Region or City"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-primary-400"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                    />
                </div>

                {/* Price */}
                <div>
                    <button
                        onClick={() => toggleSection('price')}
                        className="w-full flex items-center justify-between px-4 py-3 font-bold text-sm text-gray-900"
                    >
                        Price, $
                        {expandedSections.price
                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                            : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                    {expandedSections.price && (
                        <div className="px-4 pb-3 space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="min"
                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-primary-400"
                                    value={minPrice}
                                    onChange={e => { setMinPrice?.(e.target.value); }}
                                />
                                <span className="text-gray-400 self-center">–</span>
                                <input
                                    type="number"
                                    placeholder="max"
                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-primary-400"
                                    value={maxPrice}
                                    onChange={e => { setMaxPrice?.(e.target.value); }}
                                />
                            </div>
                            <div className="space-y-1 pt-1">
                                {PRICE_RANGES.map(r => (
                                    <label key={r.label} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="price_range"
                                            className="text-primary-500 focus:ring-primary-400"
                                            checked={activePriceRange?.label === r.label}
                                            onChange={() => selectPriceRange(r)}
                                        />
                                        <span className="text-[13px] text-gray-700">{r.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Verified Sellers */}
                <div>
                    <button
                        onClick={() => toggleSection('verified')}
                        className="w-full flex items-center justify-between px-4 py-3 font-bold text-sm text-gray-900"
                    >
                        <span className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary-500" />
                            Verified sellers
                        </span>
                        {expandedSections.verified
                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                            : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                    {expandedSections.verified && (
                        <div className="px-4 pb-3 space-y-1">
                            {[
                                { label: 'Show all', value: '' },
                                { label: 'Verified sellers', value: 'true' },
                                { label: 'Unverified sellers', value: 'false' },
                            ].map(opt => (
                                <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="verified"
                                        className="text-primary-500 focus:ring-primary-400"
                                        checked={(attributeFilters['verified'] ?? '') === opt.value}
                                        onChange={() => updateFilter('verified', opt.value)}
                                    />
                                    <span className="text-[13px] text-gray-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Condition */}
                {category && ['electronics', 'phones', 'cars', 'fashion', 'kids-toys', 'commercial', 'repair-construction', 'animals'].includes(category.slug) && (
                    <div>
                        <button
                            onClick={() => toggleSection('condition')}
                            className="w-full flex items-center justify-between px-4 py-3 font-bold text-sm text-gray-900"
                        >
                            Condition
                            {expandedSections.condition
                                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                                : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </button>
                        {expandedSections.condition && (
                            <div className="px-4 pb-3 space-y-1">
                                {['Brand New', 'Used', 'Refurbished'].map(cond => (
                                    <label key={cond} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-primary-500 focus:ring-primary-400 border-gray-300"
                                            checked={attributeFilters['condition'] === cond}
                                            onChange={e => updateFilter('condition', e.target.checked ? cond : undefined)}
                                        />
                                        <span className="text-[13px] text-gray-700">{cond}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Dynamic category attribute filters */}
                {(() => {
                    if (!category) return null;
                    const attributes = category.attributes_schema?.fields || [];
                    if (attributes.length === 0) return null;
                    return attributes
                        .filter((attr: any) => attr.name !== 'subcategory')
                        .map((attr: any) => {
                            const key = attr.name;
                            return (
                                <div key={key}>
                                    <button
                                        onClick={() => toggleSection(key)}
                                        className="w-full flex items-center justify-between px-4 py-3 font-bold text-sm text-gray-900"
                                    >
                                        {attr.label}
                                        {expandedSections[key]
                                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                                            : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                    </button>
                                    {expandedSections[key] && (
                                        <div className="px-4 pb-3">
                                            {attr.type === 'select' && attr.options ? (
                                                <div className="space-y-1">
                                                    {attr.options.map((opt: string) => (
                                                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={key}
                                                                className="text-primary-500 focus:ring-primary-400"
                                                                checked={attributeFilters[key] === opt}
                                                                onChange={() => updateFilter(key, attributeFilters[key] === opt ? undefined : opt)}
                                                            />
                                                            <span className="text-[13px] text-gray-700">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder={attr.placeholder || `Search ${attr.label}`}
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-primary-400"
                                                    value={attributeFilters[key] || ''}
                                                    onChange={e => updateFilter(key, e.target.value)}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                })()}

                <div className="p-4">
                    <Button
                        className="w-full rounded-xl h-10 font-bold bg-primary-500 hover:bg-primary-600 text-white"
                        onClick={onClose}
                    >
                        Apply Filters
                    </Button>
                </div>
            </div>
        </aside>
    );
};

export { FilterSidebar };
