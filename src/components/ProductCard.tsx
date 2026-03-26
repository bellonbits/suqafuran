import React, { useState } from 'react';
import { Heart, MapPin, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { formatConvertedPrice } from '../utils/currencyUtils';
import { listingService } from '../services/listingService';
import { useTranslateSingle } from '../hooks/useTranslateContent';

interface ProductCardProps {
    id: string;
    title: string;
    price: number;
    currency: string;
    location: string;
    imageUrl: string;
    isVerified?: boolean;
    isPromoted?: boolean;
    registrationAge?: string;
    rating?: number;
    isPopular?: boolean;
    className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
    id,
    title,
    price,
    currency: originalCurrency,
    location,
    imageUrl,
    isVerified = false,
    isPromoted = false,
    registrationAge,
    rating,
    isPopular = false,
    className,
}) => {
    const { currency: targetCurrency } = useCurrencyStore();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [liked, setLiked] = useState(false);
    const translatedTitle = useTranslateSingle(title);

    const prefetch = () => {
        queryClient.prefetchQuery({
            queryKey: ['listing', id],
            queryFn: () => listingService.getListing(Number(id)),
            staleTime: 60_000,
        });
    };

    return (
        <Link
            to={`/listing/${id}`}
            className={cn(
                'group bg-white rounded-2xl overflow-hidden active:scale-[0.97] transition-all duration-200 flex flex-col card-shadow',
                className
            )}
            onMouseEnter={prefetch}
            onTouchStart={prefetch}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                    src={getImageUrl(imageUrl)}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                />

                {/* Bottom gradient for readability */}
                <div
                    className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
                />

                {/* Top-left badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                    {isPromoted && (
                        <span className="inline-flex items-center gap-0.5 bg-secondary-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                            <Zap className="w-2.5 h-2.5" />
                            {t('common.enterprise')}
                        </span>
                    )}
                    {isPopular && !isPromoted && (
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-800 text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                            <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse" />
                            {t('common.popular')}
                        </span>
                    )}
                </div>

                {/* Heart button — top right */}
                <button
                    onClick={(e) => { e.preventDefault(); setLiked(l => !l); }}
                    className={cn(
                        'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90',
                        liked
                            ? 'bg-red-500 text-white'
                            : 'bg-white/85 backdrop-blur-sm text-gray-500'
                    )}
                >
                    <Heart className="h-4 w-4" fill={liked ? 'white' : 'none'} />
                </button>

                {/* Bottom-left — verified age */}
                {registrationAge && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded-full pointer-events-none">
                        <ShieldCheck className="w-2.5 h-2.5 text-primary-300" />
                        {registrationAge}
                    </span>
                )}

                {/* Verified badge — bottom right */}
                {isVerified && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-0.5 bg-primary-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-none shadow">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {t('common.verifiedId')}
                    </span>
                )}
            </div>

            {/* Card body */}
            <div className="px-3 pt-2.5 pb-3 flex flex-col flex-1">
                {/* Title */}
                <p className="text-gray-800 text-[13px] font-semibold line-clamp-2 leading-snug mb-2">
                    {translatedTitle}
                </p>

                {/* Price + rating */}
                <div className="flex items-center justify-between">
                    <span className="text-secondary-500 font-extrabold text-[15px] leading-none">
                        {formatConvertedPrice(price, originalCurrency, targetCurrency)}
                    </span>
                    {rating && (
                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                            ★ {rating.toFixed(1)}
                        </span>
                    )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{location}</span>
                </div>
            </div>
        </Link>
    );
};

export { ProductCard };
