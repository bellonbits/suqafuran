import React from 'react';
import { Heart, Star, MapPin, MessageSquare, ShoppingCart, Check, Scale } from 'lucide-react';
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
  const [added, setAdded] = React.useState(false);

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

  const imgSrc = optimizeCloudinaryUrl(product.image, { width: 400 }) || product.image || '/icon1.png';

  return (
    <div
      onClick={() => onSelectProduct?.(product)}
      className={`group relative rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-[#00BFFF] dark:hover:border-[#00BFFF] p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${className}`}
    >
      <div>
        {/* Top Image Container */}
        <div className="relative aspect-square w-full rounded-xl bg-slate-50 dark:bg-neutral-800 overflow-hidden flex items-center justify-center mb-3">
          <img
            src={imgSrc}
            alt={product.title}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Badge */}
          {product.is_verified && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#00BFFF] text-white text-[10px] font-bold uppercase shadow-2xs">
              Verified
            </span>
          )}

          {/* Heart Favorite Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-xs flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:text-rose-500 transition-colors cursor-pointer"
            title="Save to favorites"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Rating & Review */}
        <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mb-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>4.9</span>
          <span className="text-slate-400 font-normal text-[11px]">(Verified)</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#00BFFF] transition-colors">
          {product.title}
        </h3>

        {/* Seller & Location */}
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
          <span className="truncate">{product.seller_name}</span>
          <span>•</span>
          <span className="flex items-center gap-0.5 shrink-0">
            <MapPin className="w-3 h-3 text-slate-400" />
            {product.location}
          </span>
        </div>
      </div>

      {/* Price & Action Row */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-neutral-800">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              KSh {product.price.toLocaleString()}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs text-slate-400 line-through">
                KSh {product.compare_at_price.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
            {product.condition}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {/* Compare toggle */}
          <button
            type="button"
            onClick={handleCompareClick}
            className={`py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
              isComparing
                ? 'bg-[#00BFFF] text-white border-[#00BFFF]'
                : 'bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border-slate-200 dark:border-neutral-700 hover:border-[#00BFFF]'
            }`}
            title="Compare with other products"
          >
            <Scale className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isComparing ? 'Comparing' : 'Compare'}</span>
          </button>

          {/* Chat with seller */}
          <button
            type="button"
            onClick={handleChatClick}
            className="py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 hover:border-[#00BFFF] flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="Chat with seller"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#00BFFF]" />
            <span className="hidden sm:inline">Inquire</span>
          </button>

          {/* Add to Cart */}
          <button
            type="button"
            onClick={handleCartClick}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              added
                ? 'bg-emerald-500 text-white border border-emerald-500'
                : 'bg-[#00BFFF] hover:bg-[#02CCFE] text-white shadow-xs'
            }`}
            title="Add to cart"
          >
            {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{added ? 'Added' : 'Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

