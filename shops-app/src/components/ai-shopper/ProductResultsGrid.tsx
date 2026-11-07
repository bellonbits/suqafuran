import React from 'react';
import { ProductRecommendationCard } from './ProductRecommendationCard';
import { ShoppingLoadingState } from './ShoppingLoadingState';
import { Info, Sparkles, Scale } from 'lucide-react';
import type { ShopperProduct } from '@/services/aiShopperService';

interface ProductResultsGridProps {
  products: ShopperProduct[];
  loading?: boolean;
  query?: string;
  isFallback?: boolean;
  favoriteIds?: Record<number, boolean>;
  onToggleFavorite?: (productId: number) => void;
  onAddToCart?: (product: ShopperProduct) => void;
  onDirectChat?: (product: ShopperProduct) => void;
  onToggleCompare?: (product: ShopperProduct) => void;
  comparingIds?: number[];
  onOpenCompareModal?: () => void;
  onSelectProduct?: (product: ShopperProduct) => void;
  className?: string;
}

export const ProductResultsGrid: React.FC<ProductResultsGridProps> = ({
  products,
  loading = false,
  query = "",
  isFallback = false,
  favoriteIds = {},
  onToggleFavorite,
  onAddToCart,
  onDirectChat,
  onToggleCompare,
  comparingIds = [],
  onOpenCompareModal,
  onSelectProduct,
  className = "",
}) => {
  if (loading) {
    return <ShoppingLoadingState />;
  }

  if (!products || products.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-8 text-center">
        <Sparkles className="w-10 h-10 text-[#00BFFF] mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          No direct products found
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
          Try asking Suqafuran AI in the chat to recommend related products, broader categories, or different price ranges.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Fallback Notice Banner */}
      {isFallback && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
          <Info className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            Exact match was not found in current inventory. Showing top recommended alternatives from verified sellers on Suqafuran.
          </span>
        </div>
      )}

      {/* Floating Compare Bar if items are selected */}
      {comparingIds.length >= 2 && (
        <div className="sticky top-2 z-30 flex items-center justify-between p-3 rounded-xl bg-[#00BFFF] text-white shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Scale className="w-4 h-4" />
            <span>{comparingIds.length} products selected for comparison</span>
          </div>
          <button
            type="button"
            onClick={onOpenCompareModal}
            className="px-3 py-1.5 rounded-lg bg-white text-[#00BFFF] text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
          >
            Compare Now
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6 w-full min-w-0">
        {products.map((p) => (
          <ProductRecommendationCard
            key={p.id}
            product={p}
            isFavorite={!!favoriteIds[p.id]}
            onToggleFavorite={onToggleFavorite}
            onAddToCart={onAddToCart}
            onDirectChat={onDirectChat}
            onToggleCompare={onToggleCompare}
            isComparing={comparingIds.includes(p.id)}
            onSelectProduct={onSelectProduct}
          />
        ))}
      </div>
    </div>
  );
};

