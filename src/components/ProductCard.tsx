import React from 'react';
import { Heart, MapPin, ShieldCheck, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import { interactionService, InteractionType } from '../services/interactionService';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { formatConvertedPrice } from '../utils/currencyUtils';

interface ProductCardProps {
    id: string;
    title: string;
    price: number;
    currency: string;
    location: string;
    imageUrl: string;
    isVerified?: boolean;
    isPromoted?: boolean;
    registrationAge?: string; // e.g. "3+ Yrs on Platform"
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

    return (
        <Link
            to={`/listing/${id}`}
            className={cn(
                'group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col',
                className
            )}
        >
            <div className="relative aspect-[4/5] sm:aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                    src={getImageUrl(imageUrl)}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badges Overlay */}
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none">
                    {isPromoted && (
                        <div className="bg-secondary-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider w-fit">
                            Enterprise
                        </div>
                    )}
                    {/* Hide Popular if Enterprise to reduce clutter */}
                    {isPopular && !isPromoted && (
                        <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse" />
                            Popular
                        </div>
                    )}
                    {isVerified && (
                        <div className="bg-blue-300 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm w-fit">
                            Verified ID
                        </div>
                    )}
                </div>

                <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    {rating && (
                        <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            {rating.toFixed(1)} ★
                        </div>
                    )}
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
                <div className="flex items-start justify-between mb-1">
                    <h3 className="text-secondary-600 font-bold text-base sm:text-lg leading-tight truncate">
                        {formatConvertedPrice(price, originalCurrency, targetCurrency)}
                    </h3>
                </div>

                <p className="text-gray-800 text-sm font-medium line-clamp-2 mb-2 group-hover:text-primary-500 transition-colors">
                    {title}
                </p>

                <div className="mt-auto flex items-center justify-between text-[11px] text-gray-500 mb-3">
                    <div className="flex items-center gap-1 group/loc px-3">
                        <MapPin className="h-3 w-3 shrink-0 group-hover/loc:text-secondary-500 transition-colors" />
                        <span className="truncate">{location}</span>
                    </div>
                </div>

                <div className="flex gap-1.5 p-2 mt-auto pt-0">
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (id) {
                                try {
                                    await interactionService.logInteraction(Number(id), InteractionType.CALL);
                                    window.location.href = `tel:${id}`; // Placeholder
                                } catch (err) {
                                    console.error('Failed to log call', err);
                                }
                            }
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold border border-gray-200 rounded-lg py-1.5 text-xs transition-colors px-1"
                    >
                        <Phone className="h-3 w-3" />
                        Call
                    </button>
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (id) {
                                try {
                                    await interactionService.logInteraction(Number(id), InteractionType.WHATSAPP);
                                } catch (err) {
                                    console.error('Failed to log whatsapp', err);
                                }
                            }
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold border border-green-200 rounded-lg py-1.5 text-xs transition-colors px-1"
                    >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-green-500" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        Chat
                    </button>
                </div>
            </div>
        </Link>
    );
};

export { ProductCard };
