import React, { useState, useEffect } from 'react';
import { Heart, MapPin, ShieldCheck, Zap, MessageCircle, BadgeCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { formatConvertedPrice } from '../utils/currencyUtils';
import { listingService } from '../services/listingService';
import { translateSingle } from '../services/translateService';

interface ProductCardProps {
    id: string;
    ownerId?: string | number;
    title_en: string;
    title_so?: string;
    price: number;
    currency: string;
    location: string;
    imageUrl: string;
    isVerified?: boolean;
    verifiedLevel?: string;
    isPromoted?: boolean;
    registrationAge?: string;
    rating?: number;
    isPopular?: boolean;
    isNegotiable?: boolean;
    hasBulkPrice?: boolean;
    className?: string;
}

const ProductCard = React.memo(function ProductCard({
    id,
    ownerId,
    title_en,
    title_so,
    price,
    currency: originalCurrency,
    location,
    imageUrl,
    isVerified = false,
    verifiedLevel,
    isPromoted = false,
    registrationAge,
    rating,
    isPopular = false,
    isNegotiable = false,
    hasBulkPrice = false,
    className,
}: ProductCardProps) {
    const { currency: targetCurrency } = useCurrencyStore();
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [autoTitle, setAutoTitle] = useState<string | null>(null);

    useEffect(() => {
        if (i18n.language !== 'so' || title_so) {
            setAutoTitle(null);
            return;
        }
        let cancelled = false;
        translateSingle(title_en, 'so')
            .then(result => { if (!cancelled) setAutoTitle(result); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [i18n.language, title_en, title_so]);

    const displayTitle = autoTitle ?? (i18n.language === 'so' ? (title_so || title_en) : title_en);

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
                'group bg-white rounded-xl overflow-hidden active:scale-[0.97] transition-all duration-200 flex flex-col card-shadow',
                className
            )}
            onMouseEnter={prefetch}
            onTouchStart={prefetch}
        >
            {/* Image — shorter aspect ratio */}
            <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                <img
                    src={getImageUrl(imageUrl, { width: 400, quality: 'eco' })}
                    alt={displayTitle}
                    width="400"
                    height="225"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                />

                {/* Top-left badges */}
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none">
                    {isPromoted && (
                        <span className="inline-flex items-center gap-0.5 bg-secondary-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                            <Zap className="w-2 h-2" />
                            {t('common.enterprise')}
                        </span>
                    )}
                    {isPopular && !isPromoted && (
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                            <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse" />
                            {t('common.popular')}
                        </span>
                    )}
                </div>

                {/* Heart button — top right */}
                <button
                    onClick={(e) => { e.preventDefault(); setLiked(l => !l); }}
                    className={cn(
                        'absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90',
                        liked ? 'bg-red-500 text-white' : 'bg-white/85 backdrop-blur-sm text-gray-500'
                    )}
                >
                    <Heart className="h-3 w-3" fill={liked ? 'white' : 'none'} />
                </button>
            </div>

            {/* Card body */}
            <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-1">
                {/* Title */}
                <p className="text-gray-800 text-[12px] font-semibold line-clamp-2 leading-snug">
                    {displayTitle}
                </p>

                {/* Price + Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-secondary-500 font-extrabold text-[14px] leading-none">
                        {formatConvertedPrice(price, originalCurrency, targetCurrency)}
                    </span>
                    {isNegotiable && (
                        <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded uppercase tracking-tighter border border-green-100">
                            {t('common.negotiable')}
                        </span>
                    )}
                    {hasBulkPrice && (
                        <Zap className="w-2.5 h-2.5 text-secondary-500 fill-secondary-500" />
                    )}
                </div>

                {/* Location + verified row */}
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-0.5 text-[10px] text-gray-400 min-w-0">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{location}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {rating && (
                            <span className="text-[9px] font-bold text-amber-500">★ {rating.toFixed(1)}</span>
                        )}
                        {isVerified && (
                            <span 
                                className={cn(
                                    "inline-flex items-center justify-center rounded-full border shadow-sm p-0.5",
                                    verifiedLevel === 'premium' ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"
                                )} 
                                title={verifiedLevel === 'premium' ? 'Premium Trusted Seller' : t('common.verifiedSeller')}
                            >
                                <BadgeCheck className={cn(
                                    "w-3.5 h-3.5 text-white",
                                    verifiedLevel === 'premium' ? "fill-amber-500" : "fill-green-500"
                                )} />
                            </span>
                        )}
                    </div>
                </div>

                {registrationAge && (
                    <div className="flex items-center gap-0.5 text-[9px] text-gray-400">
                        <ShieldCheck className="w-2 h-2 text-primary-400 shrink-0" />
                        {registrationAge}
                    </div>
                )}
                
                {/* Chat Seller Button */}
                {ownerId && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/messages?user=${ownerId}&listing=${id}&msg=${encodeURIComponent(t('common.isAvailableMsg'))}`);
                        }}
                        className="mt-1.5 w-full bg-primary-50 hover:bg-primary-100 text-primary-600 font-bold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-primary-100 shadow-sm active:scale-95"
                    >
                        <MessageCircle size={14} className="fill-primary-100" />
                        {t('common.chatSeller')}
                    </button>
                )}
            </div>
        </Link>
    );
});

export { ProductCard };
