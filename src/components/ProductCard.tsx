import React from 'react';
import { Heart, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';

interface ProductCardProps {
    id: string;
    title: string;
    price: number;
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
    location,
    imageUrl,
    isVerified = false,
    isPromoted = false,
    registrationAge,
    rating,
    isPopular = false,
    className,
}) => {
    return (
        <Link
            to={`/ad/${id}`}
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
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none">
                    {isPromoted && (
                        <div className="bg-secondary-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider w-fit">
                            Enterprise
                        </div>
                    )}
                    {isPopular && (
                        <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse" />
                            Popular
                        </div>
                    )}
                    {isVerified && (
                        <div className="bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm w-fit">
                            Verified ID
                        </div>
                    )}
                </div>

                <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    {rating && (
                        <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            {rating} ★
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
                        KES {price.toLocaleString()}
                    </h3>
                </div>

                <p className="text-gray-800 text-sm font-medium line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                    {title}
                </p>

                <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-1 group/loc">
                        <MapPin className="h-3 w-3 shrink-0 group-hover/loc:text-secondary-500 transition-colors" />
                        <span className="truncate">{location}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export { ProductCard };
