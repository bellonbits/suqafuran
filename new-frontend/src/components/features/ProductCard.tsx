"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Heart, ShieldCheck, Star } from 'lucide-react';
import { useFavoritesStore } from '../../store/useFavorites';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';
import { useCurrencyStore } from '../../store/useCurrency';
import { formatConvertedPrice } from '../../lib/currency';
import { useLocalizedField } from '../../lib/i18n';
import { ProductQuickViewModal } from '../ProductQuickViewModal';
import type { Listing } from '../../types';

interface ProductCardProps {
    listing: Listing;
    /** Show the seller/shop this item comes from (e.g. for "Direct from verified local sellers" sections) */
    showSeller?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ listing, showSeller }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isAuthenticated } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const isFavorite = useFavoritesStore((s) => s.isFavorite(listing.id));
    const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
    const displayCurrency = useCurrencyStore((s) => s.currency);
    const field = useLocalizedField();

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            openAuthModal('signin');
            return;
        }
        toggleFavorite(listing.id);
    };

    const handleOpenModal = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('🖱️ Product clicked, opening modal for:', listing.title_en);
        setIsModalOpen(true);
    };

    // Generate fallback visuals if listing images are missing
    const displayImage = (listing.images && listing.images.length > 0)
        ? listing.images[0]
        : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'; // fallback sneaker image

    return (
        <>
            <button
                onClick={handleOpenModal}
                className="block group w-full text-left hover:no-underline"
            >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 cursor-pointer">
                    <img
                        src={displayImage}
                        alt={listing.title_en}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />

                    {listing.condition && listing.condition !== 'New' && (
                        <span className="absolute left-2 top-2 rounded-full bg-slate-900/75 backdrop-blur-md px-2.5 py-1 text-[9px] font-black text-white uppercase tracking-wider">
                            {listing.condition}
                        </span>
                    )}

                    <button
                        onClick={handleToggleFavorite}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 border border-gray-200 shadow-md flex items-center justify-center hover:bg-white active:scale-95 transition-all dark:bg-slate-800/90 dark:border-slate-700 cursor-pointer"
                    >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-slate-200'}`} />
                    </button>
                </div>

                <div className="pt-2.5 space-y-1">
                    <div className="text-base font-black text-gray-900 dark:text-slate-100">
                        {formatConvertedPrice(listing.price, listing.currency, displayCurrency)}
                    </div>

                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-700 dark:text-slate-300 leading-snug">
                        {field(listing.title_en, listing.title_so)}
                    </h3>

                    {showSeller && listing.owner && (
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[11px] text-gray-700 dark:text-slate-300 font-bold truncate">
                                <span className="truncate">{listing.owner.full_name}</span>
                                {listing.owner.is_verified && <ShieldCheck className="h-3 w-3 text-orange-600 dark:text-orange-400 shrink-0" />}
                            </div>
                            {listing.owner.rating && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-slate-400">
                                    <div className="flex items-center gap-0.5">
                                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                        <span className="font-bold">{listing.owner.rating.toFixed(1)}</span>
                                    </div>
                                    {listing.owner.reviews_count && (
                                        <span className="text-gray-500 dark:text-slate-500">({listing.owner.reviews_count} reviews)</span>
                                    )}
                                </div>
                            )}
                            {listing.owner.response_time && (
                                <div className="text-[9px] text-gray-500 dark:text-slate-500 font-medium">
                                    Replies {listing.owner.response_time}
                                </div>
                            )}
                        </div>
                    )}

                    {listing.views !== undefined && listing.views > 0 ? (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500 font-semibold">
                            <Eye className="h-3 w-3" />
                            <span>{listing.views >= 1000 ? `${(listing.views / 1000).toFixed(1)}k+ views` : `${listing.views} views`}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>New listing</span>
                        </div>
                    )}
                </div>
            </button>

            {/* Product Quick View Modal */}
            <ProductQuickViewModal
                isOpen={isModalOpen}
                product={{
                    id: listing.id,
                    name: listing.title_en,
                    category: 'Product',
                    image: displayImage,
                    price: listing.price,
                    originalPrice: listing.price,
                    rating: 4.5,
                    reviews: listing.views || 0,
                    description: `${listing.title_en} - ${listing.description_en || 'High-quality product with excellent features.'}`,
                }}
                onClose={() => setIsModalOpen(false)}
                onAddToCart={(productId) => {
                    // Handle add to cart - could open the listing or add to cart directly
                    console.log(`Added product ${productId} to cart`);
                }}
            />
        </>
    );
};
