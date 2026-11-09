import React from 'react';
import { ShieldCheck, MapPin, Store, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ShopperSeller } from '@/services/aiShopperService';

interface SellerRecommendationCardProps {
  seller: ShopperSeller;
  className?: string;
}

export const SellerRecommendationCard: React.FC<SellerRecommendationCardProps> = ({
  seller,
  className = "",
}) => {
  const displayName = seller.name && seller.name.trim().toLowerCase() !== 'shop' && seller.name.trim().toLowerCase() !== 'verified shop'
    ? seller.name
    : `Shop #${seller.id}`;

  return (
    <div className={`flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-[#00BFFF] transition-all ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-neutral-700 shrink-0">
          {seller.avatar_url ? (
            <img src={seller.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <Store className="w-5 h-5 text-[#00BFFF]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </h4>
            {seller.is_verified && (
              <ShieldCheck className="w-4 h-4 text-[#00BFFF] shrink-0" title="Verified Seller" />
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{seller.location || 'Nairobi'}</span>
          </p>
        </div>
      </div>

      <Link
        to={seller.shop_url}
        className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 hover:bg-[#00BFFF] hover:text-white text-xs font-bold text-slate-700 dark:text-neutral-200 transition-colors flex items-center gap-1 shrink-0 ml-2"
      >
        <span>Visit Shop</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};

