import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { ShopperProduct } from '@/services/aiShopperService';
import { AIProductCarousel } from './AIProductCarousel';

interface AIResponseProps {
  message: string;
  timestamp?: string;
  products?: ShopperProduct[];
  followups?: string[];
  onSelectProduct?: (product: ShopperProduct) => void;
  onSelectFollowup?: (followup: string) => void;
  onToggleFavorite?: (productId: number) => void;
  favoriteIds?: Record<number, boolean>;
  className?: string;
}

export const AIResponse: React.FC<AIResponseProps> = ({
  message,
  timestamp,
  products = [],
  followups = [],
  onSelectProduct,
  onSelectFollowup,
  onToggleFavorite,
  favoriteIds = {},
  className = "",
}) => {
  return (
    <div className={`flex items-start gap-2.5 max-w-full ${className}`}>
      {/* Suqafuran AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-[#00BFFF]/30 flex items-center justify-center overflow-hidden shrink-0 mt-0.5 shadow-xs p-0.5">
        <img
          src="/ai-shopper-icon.png"
          alt="Suqafuran AI"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex-1 space-y-3 min-w-0">
        {/* Text Message Bubble (clean grey/white bubble like Mock Screen 2) */}
        <div className="inline-block rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 px-4 py-3 shadow-xs">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
          {timestamp && (
            <span className="block mt-1 text-[10px] text-slate-400 text-right">
              {timestamp}
            </span>
          )}
        </div>

        {/* Product Recommendations Carousel right under message */}
        {products && products.length > 0 && onSelectProduct && (
          <div className="w-full pt-1">
            <AIProductCarousel
              products={products}
              onSelectProduct={onSelectProduct}
              onToggleFavorite={onToggleFavorite}
              favoriteIds={favoriteIds}
            />
          </div>
        )}

        {/* Followup suggestion chips */}
        {followups && followups.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {followups.map((f, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectFollowup?.(f)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-neutral-900 hover:bg-[#00BFFF]/10 hover:text-[#00BFFF] text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 hover:border-[#00BFFF] transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <span>{f}</span>
                <ArrowRight className="w-3 h-3 text-[#00BFFF]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
