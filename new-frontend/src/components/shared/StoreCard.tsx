"use client";

import React from 'react';
import Link from 'next/link';
import { Bike, ShieldCheck, MapPin, Clock } from 'lucide-react';

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
                <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 truncate">{name}</h4>
                    {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />}
                </div>

                {time && (
                    <div className="flex items-center gap-1 text-xs font-bold text-primary dark:text-sky-400">
                        <Bike className="h-3.5 w-3.5" />
                        <span>{time}</span>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
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
