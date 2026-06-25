"use client";

import React from 'react';
import Link from 'next/link';
import { Eye, Plus, Heart, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/useCart';
import { useFavoritesStore } from '../../store/useFavorites';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';
import { useCurrencyStore } from '../../store/useCurrency';
import { formatConvertedPrice } from '../../lib/currency';
import { useLocalizedField } from '../../lib/i18n';
import type { Listing } from '../../types';

interface ProductCardProps {
    listing: Listing;
    /** Show the seller/shop this item comes from (e.g. for "Direct from verified local sellers" sections) */
    showSeller?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ listing, showSeller }) => {
    const { addToCart } = useCartStore();
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

    // Generate fallback visuals if listing images are missing
    const displayImage = (listing.images && listing.images.length > 0)
        ? listing.images[0]
        : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'; // fallback sneaker image

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({ id: listing.id, name: field(listing.title_en, listing.title_so), price: listing.price, currency: listing.currency, image: displayImage });
    };

    return (
        <Link href={`/listing/${listing.id}`} className="block group w-full">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900">
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

                <button
                    onClick={handleQuickAdd}
                    aria-label="Quick add to cart"
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-900 hover:bg-slate-50 active:scale-95 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
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
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 font-bold truncate">
                        <span className="truncate">{listing.owner.full_name}</span>
                        {listing.owner.is_verified && <ShieldCheck className="h-3 w-3 text-accent shrink-0" />}
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
        </Link>
    );
};
