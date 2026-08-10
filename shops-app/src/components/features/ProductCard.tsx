"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, Star, Plus } from 'lucide-react';
import { useFavoritesStore } from '../../store/useFavorites';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';
import { useCurrencyStore } from '../../store/useCurrency';
import { useCart } from '../../store/useCart';
import { formatConvertedPrice } from '../../lib/currency';
import { useLocalizedField } from '../../lib/i18n';
import { ProductQuickViewModal } from '../ProductQuickViewModal';
import { FeaturedBadge } from '../ads/FeaturedBadge';
import { advertisingService } from '@/services/advertising';
import type { Listing } from '../../types';

interface ProductCardProps {
    listing: Listing;
    /** Show the seller/shop this item comes from (e.g. for "Direct from verified local sellers" sections) */
    showSeller?: boolean;
    /** Optional deal badge -- e.g. a "Today's Deals" carousel showing a discount + struck-through original price. Omit for the normal (no discount) card. */
    discountPercent?: number;
    originalPrice?: number;
    /** Category label shown under the title, e.g. "Fashion" */
    categoryName?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ listing, showSeller, discountPercent, originalPrice, categoryName }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false);
    const { isAuthenticated } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const isFavorite = useFavoritesStore((s) => s.isFavorite(listing.id));
    const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
    const displayCurrency = useCurrencyStore((s) => s.currency);
    const addItem = useCart((s) => s.addItem);
    const field = useLocalizedField();

    // Check if listing is featured
    useEffect(() => {
        const checkFeatured = async () => {
            const featured = await advertisingService.isListingFeatured(listing.id);
            setIsFeatured(featured);
            // Track impression
            if (featured) {
                await advertisingService.trackListingImpression(listing.id);
            }
        };
        checkFeatured();
    }, [listing.id]);

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

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({
            id: String(listing.id),
            title: field(listing.title_en, listing.title_so) || listing.title_en,
            price: listing?.price ?? 0,
            quantity: 1,
            image: displayImage,
            owner_id: listing.owner_id,
        });
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
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 cursor-pointer">
                    <img
                        src={displayImage}
                        alt={listing.title_en}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />

                    {!!discountPercent && (
                        <div className="absolute top-2 left-2 z-10 rounded bg-[#e81f44] px-2 py-1 text-[10px] font-extrabold text-white">
                            -{discountPercent}%
                        </div>
                    )}

                    {isFeatured && (
                        <div className={`absolute top-2 left-2 z-10 ${discountPercent ? 'mt-7' : ''}`}>
                            <FeaturedBadge size="sm" />
                        </div>
                    )}

                    {listing.condition && listing.condition !== 'New' && (
                        <span className={`absolute left-2 top-2 rounded-full bg-slate-900/75 backdrop-blur-md px-2.5 py-1 text-[9px] font-black text-white uppercase tracking-wider ${isFeatured ? 'mt-6' : ''} ${discountPercent && !isFeatured ? 'mt-7' : ''}`}>
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

                    <button
                        onClick={handleAddToCart}
                        aria-label="Add to cart"
                        className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-full bg-[#00a082] hover:bg-[#008f73] shadow-md flex items-center justify-center active:scale-95 transition-all cursor-pointer z-10"
                    >
                        <Plus className="h-4 w-4 text-white stroke-[3]" />
                    </button>
                </div>

                <div className="pt-2.5 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-slate-100 leading-snug">
                        {field(listing.title_en, listing.title_so)}
                    </h3>

                    {categoryName && (
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                            {categoryName}
                        </div>
                    )}

                    <div className="flex items-baseline gap-1.5">
                        <div className="text-base font-black text-gray-900 dark:text-slate-100">
                            {formatConvertedPrice(listing?.price ?? 0, listing.currency, displayCurrency)}
                        </div>
                        {!!originalPrice && originalPrice > (listing?.price ?? 0) && (
                            <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 line-through">
                                {formatConvertedPrice(originalPrice, listing.currency, displayCurrency)}
                            </div>
                        )}
                    </div>

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
                    images: listing.images && listing.images.length > 0 ? listing.images : undefined,
                    price: listing?.price ?? 0,
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
