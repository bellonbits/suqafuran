import React from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';

interface ShoppingFiltersProps {
  activeFilters: {
    maxPrice?: number;
    location?: string;
    condition?: string;
    verifiedOnly?: boolean;
  };
  onFilterChange: (filters: {
    maxPrice?: number;
    location?: string;
    condition?: string;
    verifiedOnly?: boolean;
  }) => void;
  className?: string;
}

export const ShoppingFilters: React.FC<ShoppingFiltersProps> = ({
  activeFilters,
  onFilterChange,
  className = "",
}) => {
  const FILTER_PILLS = [
    { label: "Under 20k", type: "maxPrice", value: 20000 },
    { label: "Under 50k", type: "maxPrice", value: 50000 },
    { label: "Under 100k", type: "maxPrice", value: 100000 },
    { label: "Nairobi", type: "location", value: "Nairobi" },
    { label: "Eastleigh", type: "location", value: "Eastleigh" },
    { label: "Mombasa", type: "location", value: "Mombasa" },
    { label: "Brand New", type: "condition", value: "Brand New" },
    { label: "Verified Only", type: "verifiedOnly", value: true },
  ];

  const handleToggle = (type: string, value: any) => {
    const updated = { ...activeFilters };
    if (type === 'maxPrice') {
      updated.maxPrice = updated.maxPrice === value ? undefined : value;
    } else if (type === 'location') {
      updated.location = updated.location === value ? undefined : value;
    } else if (type === 'condition') {
      updated.condition = updated.condition === value ? undefined : value;
    } else if (type === 'verifiedOnly') {
      updated.verifiedOnly = !updated.verifiedOnly;
    }
    onFilterChange(updated);
  };

  return (
    <div className={`flex items-center gap-2 overflow-x-auto hide-scrollbar py-1 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 shrink-0 mr-1">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters:</span>
      </div>

      {FILTER_PILLS.map((pill, idx) => {
        let isActive = false;
        if (pill.type === 'maxPrice') isActive = activeFilters.maxPrice === pill.value;
        if (pill.type === 'location') isActive = activeFilters.location === pill.value;
        if (pill.type === 'condition') isActive = activeFilters.condition === pill.value;
        if (pill.type === 'verifiedOnly') isActive = !!activeFilters.verifiedOnly;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleToggle(pill.type, pill.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all cursor-pointer flex items-center gap-1 ${
              isActive
                ? 'bg-[#00BFFF] text-white border-[#00BFFF] shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800 hover:border-[#00BFFF]'
            }`}
          >
            {isActive && <Check className="w-3 h-3 text-white" />}
            <span>{pill.label}</span>
          </button>
        );
      })}
    </div>
  );
};
