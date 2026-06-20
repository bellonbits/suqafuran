"use client";

import React from 'react';
import Link from 'next/link';
import { Eye, Plus } from 'lucide-react';
import { useCartStore } from '../../store/useCart';
import type { Listing } from '../../types';

interface ProductCardProps {
    listing: Listing;
}

export const ProductCard: React.FC<ProductCardProps> = ({ listing }) => {
    const { addToCart } = useCartStore();

    // Generate fallback visuals if listing images are missing
    const displayImage = (listing.images && listing.images.length > 0)
        ? listing.images[0]
        : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'; // fallback sneaker image

    const [dollars, cents] = Number(listing.price).toFixed(2).split('.');

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({ id: listing.id, name: listing.title_en, price: listing.price });
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
                    onClick={handleQuickAdd}
                    aria-label="Quick add to cart"
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-900 hover:bg-slate-50 active:scale-95 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            <div className="pt-2.5 space-y-1">
                <div className="text-base font-black text-gray-900 dark:text-slate-100">
                    <span className="text-sm align-top">{listing.currency === 'USD' ? '$' : `${listing.currency} `}</span>
                    {dollars}
                    <span className="text-xs align-top">{cents}</span>
                </div>

                <h3 className="line-clamp-2 text-sm font-semibold text-gray-700 dark:text-slate-300 leading-snug">
                    {listing.title_en}
                </h3>

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
