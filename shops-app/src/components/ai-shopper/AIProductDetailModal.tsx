import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, Share2, Star, ShieldCheck, ShoppingCart, 
  MessageSquare, Store, MapPin, Check, Plus, Minus, ExternalLink 
} from 'lucide-react';
import type { ShopperProduct } from '@/services/aiShopperService';
import { optimizeCloudinaryUrl } from '@/services/api';
import { Link } from 'react-router-dom';

interface AIProductDetailModalProps {
  product: ShopperProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ShopperProduct, quantity: number) => void;
  onDirectChat: (product: ShopperProduct) => void;
  onToggleFavorite?: (productId: number) => void;
  isFavorite?: boolean;
}

export const AIProductDetailModal: React.FC<AIProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onDirectChat,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!isOpen || !product) return null;

  // Extract gallery images or fallback to primary image
  const images = (product.attributes?.images && Array.isArray(product.attributes.images) && product.attributes.images.length > 0)
    ? product.attributes.images
    : (product.image ? [product.image] : []);

  const currentImg = images[activeImageIndex] || product.image || '';

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/listing/${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on Suqafuran Marketplace!`,
          url: shareUrl,
        });
      } catch {
        // Fallback
      }
    } else {
      navigator.clipboard?.writeText(shareUrl);
      alert("Product link copied to clipboard!");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg sm:max-w-xl max-h-[92vh] bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 dark:border-neutral-800"
        >
          {/* ─── Top Bar matching Mockup 3 ─────────────────────────── */}
          <div className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-200 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Product Details
            </h3>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleFavorite?.(product.id)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-200 hover:text-rose-500 transition-colors cursor-pointer"
                title="Favorite"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-200 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Scrollable Body ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 hide-scrollbar">
            
            {/* Main Image Hero */}
            <div className="relative w-full rounded-2xl bg-slate-100 dark:bg-neutral-800 overflow-hidden aspect-4/3 sm:aspect-16/10">
              {currentImg ? (
                <img
                  src={optimizeCloudinaryUrl(currentImg, 800, 600)}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Store className="w-12 h-12 opacity-30" />
                </div>
              )}

              {/* Dots Pagination Indicator */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImageIndex === i ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Small Vertical Thumbnails on right if multiple */}
              {images.length > 1 && (
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-black/30 backdrop-blur-xs p-1.5 rounded-xl">
                  {images.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === i ? 'border-[#00BFFF] scale-105' : 'border-white/50 opacity-80'
                      }`}
                    >
                      <img src={optimizeCloudinaryUrl(img, 100, 100)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Ratings */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {product.title}
              </h2>
              
              <div className="mt-2 flex items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>4.8</span>
                  <span className="text-slate-400 font-normal">(Verified)</span>
                </div>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {product.location}
                </span>
                <span>•</span>
                <span className="capitalize">{product.condition}</span>
              </div>
            </div>

            {/* Price Row & Quantity Controls */}
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    KSh {product.price.toLocaleString()}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-sm line-through text-slate-400">
                      KSh {product.compare_at_price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-full px-2 py-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold w-5 text-center text-slate-900 dark:text-white">
                  {quantity < 10 ? `0${quantity}` : quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-full bg-[#00BFFF] text-white flex items-center justify-center hover:bg-[#02CCFE] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* About Section */}
            <div className="space-y-1.5">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                About
              </h4>
              <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {product.attributes?.description ||
                  `Experience authentic quality with ${product.title}. Sourced from verified sellers on Suqafuran, fully inspected and ready for safe delivery.`}
              </p>
            </div>

            {/* Key Features if available */}
            {product.attributes?.specs && (
              <div className="space-y-1.5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Key Features
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(product.attributes.specs).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-800">
                      <span className="text-slate-400 block capitalize">{k}</span>
                      <span className="font-bold text-slate-800 dark:text-neutral-200">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seller Shop Card */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00BFFF]/10 text-[#00BFFF] flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {product.seller_name}
                    </span>
                    {product.is_verified && (
                      <ShieldCheck className="w-4 h-4 text-[#00BFFF]" />
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {product.location} • Verified Merchant
                  </span>
                </div>
              </div>

              <Link
                to={`/listing/${product.id}`}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-[#00BFFF] hover:bg-[#00BFFF]/10 transition-colors inline-flex items-center gap-1"
              >
                <span>View Ad</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* ─── Bottom Action Bar matching Mockup 3 ───────────────── */}
          <div className="sticky bottom-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-neutral-800 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className={`flex-1 py-3 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-neutral-100'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onDirectChat(product)}
              className="flex-1 py-3 px-4 rounded-full font-bold text-sm bg-[#00BFFF] hover:bg-[#02CCFE] text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Inquire / Chat</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

