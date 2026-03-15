import React from 'react';
import { Heart, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { formatConvertedPrice } from '../utils/currencyUtils';
import { listingService } from '../services/listingService';

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
                'group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex flex-col',
                className
            )}
            onMouseEnter={prefetch}
            onTouchStart={prefetch}
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 rounded-2xl">
                <img
                    src={getImageUrl(imageUrl)}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badges Overlay */}
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none">
                    {isPromoted && (
                        <div className="bg-secondary-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider w-fit">
                            {t('common.enterprise')}
                        </div>
                    )}
                    {isPopular && !isPromoted && (
                        <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse" />
                            {t('common.popular')}
                        </div>
                    )}
                    {isVerified && (
                        <div className="bg-blue-300 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm w-fit">
                            {t('common.verifiedId')}
                        </div>
                    )}
                </div>

                <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                        }}
                        className="p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition-all shadow-sm"
                    >
                        <Heart className="h-4 w-4" />
                    </button>
                </div>

                {registrationAge && (
                    <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-primary-400" />
                        {registrationAge}
                    </div>
                )}
            </div>

            <div className="p-3 flex flex-col flex-1">
                <p className="text-gray-800 text-sm font-semibold line-clamp-2 mb-1.5 group-hover:text-primary-600 transition-colors leading-snug">
                    {title}
                </p>

                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-secondary-600 font-extrabold text-base leading-tight">
                        {formatConvertedPrice(price, originalCurrency, targetCurrency)}
                    </h3>
                    {rating && (
                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                            ★ {rating.toFixed(1)}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{location}</span>
                </div>

            </div>
        </Link>
    );
};

export { ProductCard };
