"use client";

import React from 'react';
import Link from 'next/link';
import { Bike, ShieldCheck, MapPin, Clock, ChevronRight } from 'lucide-react';

interface StoreCardProps {
    slug: string;
    name: string;
    image?: string | null;
    time?: string;
    distance?: string;
    isVerified?: boolean;
    responseTime?: string;
}

export const StoreCard: React.FC<StoreCardProps> = ({ slug, name, image, time, distance, isVerified, responseTime }) => {
    return (
        <Link
            href={`/shop/${slug}`}
            className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 bg-white hover:bg-slate-50 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/60"
        >
            <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 border border-gray-200 dark:bg-slate-800 dark:border-slate-700 shrink-0 flex items-center justify-center text-sm font-black text-gray-500 dark:text-slate-300">
                {image ? (
                    <img src={image} alt={name} className="h-full w-full object-cover" />
                ) : (
                    name.charAt(0).toUpperCase()
                )}
            </div>

            <div className="min-w-0 space-y-1">
                <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 truncate">{name}</h4>

                {time && (
                    <div className="flex items-center gap-1 text-xs font-bold text-primary dark:text-sky-400">
                        <Bike className="h-3.5 w-3.5" />
                        <span>{time}</span>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                    {isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-slate-900 dark:bg-slate-700 rounded-full px-2 py-0.5">
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                        </span>
                    )}
                    {distance && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-full px-2 py-0.5">
                            <MapPin className="h-3 w-3" />
                            {distance}
                        </span>
                    )}
                    {responseTime && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-full px-2 py-0.5">
                            <Clock className="h-3 w-3" />
                            {responseTime}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export const SeeAllStoresCard: React.FC<{ extraNames?: string[] }> = ({ extraNames }) => {
    return (
        <Link
            href="/stores"
            className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200 bg-white hover:bg-slate-50 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/60"
        >
            <div className="min-w-0 space-y-1">
                <h4 className="text-sm font-black text-gray-900 dark:text-slate-100">See all sellers nearby</h4>
                {extraNames && extraNames.length > 0 && (
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 font-semibold truncate">
                        {extraNames.join(', ')}
                    </p>
                )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        </Link>
    );
};

interface BrandStoreCardProps {
    slug: string;
    name: string;
    image?: string | null;
    bannerUrl?: string | null;
    distance?: string;
    isVerified?: boolean;
    trustScore?: number;
    listingCount?: number;
    brandColor?: string;
}

export const BrandStoreCard: React.FC<BrandStoreCardProps> = ({
    slug,
    name,
    image,
    bannerUrl,
    distance,
    isVerified,
    trustScore,
    listingCount = 1,
    brandColor
}) => {
    const colors = [
        { bg: 'bg-[#FF3008]', text: 'text-white' }, // DoorDash Red
        { bg: 'bg-[#002D62]', text: 'text-white' }, // ALDI Dark Blue
        { bg: 'bg-[#C41230]', text: 'text-white' }, // Cub Red
        { bg: 'bg-[#FF6A00]', text: 'text-white' }, // Speedway Orange
        { bg: 'bg-[#008A22]', text: 'text-white' }, // Dollar Tree Green
        { bg: 'bg-[#185A9D]', text: 'text-white' }, // Soft Teal/Blue
        { bg: 'bg-[#E51B24]', text: 'text-white' }, // Hy-Vee
        { bg: 'bg-[#4B6984]', text: 'text-white' }, // Slate Blue
    ];

    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const presetColor = colors[hash % colors.length];

    // Dynamic Tailwind classes can't be JIT-detected at runtime - use inline style for custom brandColors
    const displayBgClass = brandColor ? '' : presetColor.bg;
    const displayStyle: React.CSSProperties = bannerUrl
        ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : brandColor
            ? { backgroundColor: brandColor }
            : {};
    const rating = trustScore ? (trustScore / 100).toFixed(1) : (4.4 + (hash % 6) * 0.1).toFixed(1);
    const ratingCount = 5 + (hash % 45);

    return (
        <Link
            href={`/shop/${slug}`}
            className="block rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900 shrink-0 w-48 group cursor-pointer"
        >
            {/* Top Brand Banner Header */}
            <div
                className={`relative h-28 flex items-center justify-center ${displayBgClass}`}
                style={displayStyle}
            >
                {/* Overlay for readability if banner exists */}
                {bannerUrl && <div className="absolute inset-0 bg-black/10" />}

                {/* Logo Badge in the Center */}
                <div className="absolute -bottom-6 z-10 h-14 w-14 rounded-full bg-white shadow border-2 border-white dark:bg-slate-800 dark:border-slate-900 flex items-center justify-center overflow-hidden">
                    {image ? (
                        <img src={image} alt={name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                        <span className="text-lg font-black text-gray-700 dark:text-slate-200">
                            {name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="pt-8 p-3 space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 min-w-0">
                    <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 truncate max-w-[90%]">
                        {name}
                    </h4>
                    {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />}
                </div>

                {/* Rating & Distance */}
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-gray-500 dark:text-slate-400">
                    <span className="text-amber-500">★</span>
                    <span>{rating} ({ratingCount})</span>
                    <span>&middot;</span>
                    <span>{distance || 'Nairobi'}</span>
                </div>

                {/* Listing Count & Delivery info */}
                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-semibold">
                    {listingCount} ad{listingCount === 1 ? '' : 's'} &middot; Free Escrow
                </p>

                {/* Promotion badge */}
                <div className="pt-1.5">
                    <span className="inline-block text-[10px] font-black text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                        Epic Deals
                    </span>
                </div>
            </div>
        </Link>
    );
};

