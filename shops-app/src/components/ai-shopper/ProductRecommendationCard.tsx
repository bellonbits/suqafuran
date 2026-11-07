import React, { useState } from 'react';
import { Heart, Star, MapPin, MessageSquare, ShoppingCart, Check, Scale, ShieldCheck, Store } from 'lucide-react';
import { optimizeCloudinaryUrl } from '@/services/api';
import type { ShopperProduct } from '@/services/aiShopperService';

interface ProductRecommendationCardProps {
  product: ShopperProduct;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: number) => void;
  onAddToCart?: (product: ShopperProduct) => void;
  onDirectChat?: (product: ShopperProduct) => void;
  onToggleCompare?: (product: ShopperProduct) => void;
  isComparing?: boolean;
  onSelectProduct?: (product: ShopperProduct) => void;
  className?: string;
}

export const ProductRecommendationCard: React.FC<ProductRecommendationCardProps> = ({
  product,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  onDirectChat,
  onToggleCompare,
  isComparing = false,
  onSelectProduct,
  className = "",
}) => {
  const [added, setAdded] = useState(false);

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDirectChat) onDirectChat(product);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(product.id);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCompare) onToggleCompare(product);
  };

  const imgSrc = optimizeCloudinaryUrl(product.image, 600, 600) || product.image;
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : null;

  return (
    <div
      onClick={() => onSelectProduct?.(product)}
      className={`group relative rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 hover:border-[#00BFFF] dark:hover:border-[#00BFFF] shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${className}`}
    >
      {/* ─── Top Edge-to-Edge Image (Fills card width completely) ─── */}
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-neutral-800 overflow-hidden shrink-0">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Store className="w-10 h-10 opacity-30" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {product.is_verified ? (
            <span className="px-2.5 py-1 rounded-full bg-[#00BFFF] text-white text-[10px] font-extrabold uppercase shadow-sm flex items-center gap-1 tracking-wide">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs text-slate-700 dark:text-neutral-200 text-[10px] font-bold shadow-sm">
              {product.condition}
            </span>
          )}

          {discountPct && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-sm">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs shadow-sm flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:text-rose-500 hover:scale-110 active:scale-90 transition-all cursor-pointer"
          title="Save to favorites"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* ─── Card Content Body ──────────────────────────────────── */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>4.9</span>
            <span className="text-slate-400 font-normal text-[11px]">(Verified)</span>
          </div>

          {/* Product Title */}
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#00BFFF] transition-colors">
            {product.title}
          </h3>

          {/* Seller Name & Location */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
            <span className="truncate font-medium">{product.seller_name}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 shrink-0">
              <MapPin className="w-3 h-3 text-slate-400" />
              {product.location}
            </span>
          </div>
        </div>

        {/* Price & Action Row */}
        <div>
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                KSh {product.price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs line-through text-slate-400">
                  KSh {product.compare_at_price!.toLocaleString()}
                </span>
              )}
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 capitalize">
              {product.condition}
            </span>
          </div>

          {/* ─── Sleek Pill Buttons Row ───────────────────────────── */}
          <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-neutral-800 w-full min-w-0">
            {/* Compare Pill Toggle */}
            <button
              type="button"
              onClick={handleCompareClick}
              className={`h-8 px-2.5 rounded-full text-xs font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 ${
                isComparing
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:border-slate-300'
              }`}
              title={isComparing ? "Remove from comparison" : "Compare with other products"}
            >
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">{isComparing ? 'Comparing' : 'Compare'}</span>
              {isComparing && <span className="xl:hidden w-1.5 h-1.5 rounded-full bg-[#00BFFF]" />}
            </button>

            {/* Inquire Pill */}
            <button
              type="button"
              onClick={handleChatClick}
              className="flex-1 min-w-0 h-8 px-2 sm:px-3 rounded-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 hover:border-[#00BFFF] hover:text-[#00BFFF] flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Inquire directly with seller"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#00BFFF] shrink-0" />
              <span className="truncate">Inquire</span>
            </button>

            {/* Add to Cart Pill */}
            <button
              type="button"
              onClick={handleCartClick}
              className={`flex-1 min-w-0 h-8 px-2 sm:px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs ${
                added
                  ? 'bg-emerald-600 text-white border border-emerald-600'
                  : 'bg-[#00BFFF] hover:bg-[#02CCFE] text-white'
              }`}
              title="Add to cart"
            >
              {added ? <Check className="w-3.5 h-3.5 shrink-0" /> : <ShoppingCart className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{added ? 'Added' : 'Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
