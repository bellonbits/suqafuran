import React from 'react';
import { SlidersHorizontal, Check, X } from 'lucide-react';

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

  const handleClearAll = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== undefined && v !== false);

  return (
    <div className={`w-full min-w-0 flex items-center gap-2 overflow-x-auto hide-scrollbar py-2 px-1 ${className}`}>
      {/* Filters Label Pill */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/80 dark:bg-neutral-800 text-xs font-bold text-slate-700 dark:text-neutral-200 shrink-0 select-none">
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#00BFFF]" />
        <span>Filters</span>
      </div>

      {/* Filter Pill Buttons */}
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 border transition-all cursor-pointer inline-flex items-center gap-1.5 select-none active:scale-95 ${
              isActive
                ? 'bg-[#00BFFF] hover:bg-[#02CCFE] text-white border-[#00BFFF] font-bold shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 border-slate-200/70 dark:border-neutral-700/70 hover:border-[#00BFFF]/50'
            }`}
          >
            {isActive && <Check className="w-3 h-3 text-white stroke-[2.5]" />}
            <span>{pill.label}</span>
          </button>
        );
      })}

      {/* Clear Filters Reset Pill */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearAll}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/80 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-auto"
        >
          <X className="w-3 h-3 stroke-[2.5]" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
