import React from 'react';
import { Heart, ShieldCheck, ChevronRight, Store } from 'lucide-react';
import type { ShopperProduct } from '@/services/aiShopperService';
import { optimizeCloudinaryUrl } from '@/services/api';

interface AIProductCarouselProps {
  products: ShopperProduct[];
  onSelectProduct: (product: ShopperProduct) => void;
  onToggleFavorite?: (productId: number) => void;
  favoriteIds?: Record<number, boolean>;
  className?: string;
}

export const AIProductCarousel: React.FC<AIProductCarouselProps> = ({
  products,
  onSelectProduct,
  onToggleFavorite,
  favoriteIds = {},
  className = "",
}) => {
  if (!products || products.length === 0) return null;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {/* Horizontal scroll container with snap */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scroll-smooth hide-scrollbar snap-x snap-mandatory">
        {products.map((product) => {
          const isFav = !!favoriteIds[product.id];
          const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
          const discountPct = hasDiscount
            ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
            : null;

          return (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="snap-start shrink-0 w-[170px] sm:w-[195px] bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col group active:scale-[0.98]"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-square bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                {product.image ? (
                  <img
                    src={optimizeCloudinaryUrl(product.image, 400, 400)}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-neutral-600">
                    <Store className="w-8 h-8 opacity-40" />
                  </div>
                )}

                {/* Top Badge (Discount or Verified) */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {discountPct ? (
                    <span className="px-2 py-0.5 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs text-[10px] font-black text-rose-600 dark:text-rose-400 shadow-xs">
                      {discountPct}% OFF
                    </span>
                  ) : product.is_verified ? (
                    <span className="px-2 py-0.5 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs text-[10px] font-bold text-[#00BFFF] shadow-xs flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs text-[10px] font-bold text-slate-600 dark:text-neutral-300 shadow-xs">
                      {product.condition}
                    </span>
                  )}
                </div>

                {/* Heart wishlist toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(product.id);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:text-rose-500 shadow-xs transition-colors cursor-pointer"
                  title="Save to wishlist"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Card Meta Content */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#00BFFF] transition-colors">
                    {product.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate mt-0.5">
                    {product.seller_name} • {product.location}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-baseline justify-between gap-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      KSh {product.price.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] line-through text-slate-400 dark:text-neutral-500">
                        KSh {product.compare_at_price!.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00BFFF] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

