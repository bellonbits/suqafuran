import React from 'react';
import { MapPin, Tag, SlidersHorizontal, ListFilter, ChevronDown, ShieldCheck } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { cn } from '../utils/cn';
import { getAttributesForCategory } from '../utils/categoryAttributes';
import { JIJI_CATEGORIES } from '../utils/jijiCategories';

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
    // Helper to update filters
    const updateFilter = (key: string, value: any) => {
        setAttributeFilters(prev => {
            const newFilters = { ...prev };
            if (value !== undefined && value !== '') {
                newFilters[key] = value;
            } else {
                delete newFilters[key];
            }
            return newFilters;
        });
    };

    // Find category details if categoryId is present
    const category = categoryId ? {
        slug: categoryId,
        id: categoryId,
        name: JIJI_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId
    } : undefined;

    return (
        <aside className={cn(
            "w-full lg:w-64 space-y-6 shrink-0",
            showFilters ? "block" : "hidden lg:block"
        )}>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-blue-400" />
                        Location
                    </h3>
                    <Input
                        placeholder="Region or City"
                        className="rounded-xl h-9 bg-gray-50 border-gray-200"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>

                <div className="border-t border-gray-50 pt-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4 text-blue-400" />
                        Price Range (KES)
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            placeholder="Min"
                            type="number"
                            className="rounded-xl h-9 bg-gray-50 border-gray-200"
                            value={minPrice}
                            onChange={(e) => setMinPrice && setMinPrice(e.target.value)}
                        />
                        <Input
                            placeholder="Max"
                            type="number"
                            className="rounded-xl h-9 bg-gray-50 border-gray-200"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice && setMaxPrice(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conditional Filters based on Category */}
                {category && ['electronics', 'phones', 'cars', 'fashion', 'kids-toys', 'commercial', 'repair-construction'].includes(category.slug) && (
                    <div className="border-t border-gray-50 pt-4">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                            <SlidersHorizontal className="h-4 w-4 text-blue-400" />
                            Condition
                        </h3>
                        <div className="space-y-2">
                            {['New', 'Used', 'Refurbished'].map(cond => (
                                <label key={cond} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-blue-400">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-400 focus:ring-blue-300 border-gray-300"
                                        checked={attributeFilters['condition'] === cond}
                                        onChange={(e) => updateFilter('condition', e.target.checked ? cond : undefined)}
                                    />
                                    {cond}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dynamic Category Filters */}
                {(() => {
                    if (!category) return null;

                    return (
                        <div className="space-y-4">
                            {getAttributesForCategory(String(category.id)).map(attr => (
                                <div key={attr.name} className="border-t border-gray-50 pt-4">
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                        {attr.name === 'subcategory' ? (
                                            <ListFilter className="h-4 w-4 text-primary-500" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-primary-500" />
                                        )}
                                        {attr.label}
                                    </h3>
                                    {attr.type === 'select' ? (
                                        <select
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-1 focus:ring-primary-400 bg-gray-50"
                                            value={attributeFilters[attr.name] || ''}
                                            onChange={(e) => updateFilter(attr.name, e.target.value)}
                                        >
                                            <option value="">
                                                All {attr.label.endsWith('y')
                                                    ? attr.label.slice(0, -1) + 'ies'
                                                    : attr.label + 's'}
                                            </option>
                                            {attr.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Input
                                            placeholder={attr.placeholder?.startsWith('e.g.')
                                                ? attr.placeholder
                                                : `e.g. ${attr.placeholder || ''}`}
                                            className="rounded-xl h-9 bg-gray-50 border-gray-200"
                                            value={attributeFilters[attr.name] || ''}
                                            onChange={(e) => updateFilter(attr.name, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })()}

                <Button
                    className="w-full rounded-xl h-10 font-bold shadow-sm bg-blue-300 hover:bg-blue-400 text-white"
                    onClick={onClose}
                >
                    Apply Filters
                </Button>
            </div>

            {/* Safety Tip card */}
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Safety Tips
                </h4>
                <p className="text-blue-700 text-xs leading-relaxed">
                    Always meet sellers in public places and never pay before you see the item.
                </p>
            </div>
        </aside >
    );
};

export { FilterSidebar };
