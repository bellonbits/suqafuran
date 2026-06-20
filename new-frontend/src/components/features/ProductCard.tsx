"use client";

import React from 'react';
import Link from 'next/link';
import { Eye, MapPin, ShieldCheck, Tag } from 'lucide-react';
import type { Listing } from '../../types';

interface ProductCardProps {
    listing: Listing;
}

export const ProductCard: React.FC<ProductCardProps> = ({ listing }) => {
    // Generate fallback visuals if listing images are missing
    const displayImage = (listing.images && listing.images.length > 0)
        ? listing.images[0]
        : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'; // fallback sneaker image

    return (
        <div className="group overflow-hidden rounded-3xl bg-white border border-gray-100 card-shadow transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:bg-slate-900 dark:border-slate-800 dark:hover:shadow-sky-500/5 flex flex-col justify-between">
            <Link href={`/listing/${listing.id}`} className="block relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-950">
                {/* Product Image */}
                <img
                    src={displayImage}
                    alt={listing.title_en}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Overlays */}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    <span className="rounded-full bg-slate-900/75 backdrop-blur-md px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider">
                        {listing.condition || 'New'}
                    </span>
                    {listing.is_negotiable && (
                        <span className="rounded-full bg-accent/90 px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider">
                            Negotiable
                        </span>
                    )}
                </div>

                {/* View stats overlay */}
                {listing.views !== undefined && (
                    <div className="absolute bottom-3 right-3 rounded-full bg-slate-900/65 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{listing.views}</span>
                    </div>
                )}
            </Link>

            <div className="p-5 flex flex-col flex-1 justify-between">
                <div className="space-y-2">
                    {/* Title */}
                    <Link href={`/listing/${listing.id}`} className="block">
                        <h3 className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-primary transition-colors dark:text-slate-100 dark:group-hover:text-sky-400 leading-snug">
                            {listing.title_en}
                        </h3>
                    </Link>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500 font-semibold">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{listing.location || 'Mogadishu, Somalia'}</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    {/* Price */}
                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Price</span>
                        <span className="text-base font-black text-primary dark:text-sky-400">
                            {listing.currency || 'USD'} {Number(listing.price).toLocaleString()}
                        </span>
                    </div>

                    {/* Seller Trust Badge / Verification Level */}
                    {listing.owner && (
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-gray-200/50 rounded-2xl px-2.5 py-1 dark:bg-slate-950 dark:border-slate-800">
                            <div className="h-5.5 w-5.5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-black uppercase shrink-0">
                                {listing.owner.full_name.charAt(0)}
                            </div>
                            {listing.owner.is_verified && (
                                <span title="Verified Trader">
                                    <ShieldCheck className="h-4 w-4 text-accent" />
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
