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
  return (
    <div className={`flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-[#00BFFF] transition-all ${className}`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-neutral-700 shrink-0">
          {seller.avatar_url ? (
            <img src={seller.avatar_url} alt={seller.name} className="w-full h-full object-cover" />
          ) : (
            <Store className="w-5 h-5 text-[#00BFFF]" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
              {seller.name}
            </h4>
            {seller.is_verified && (
              <ShieldCheck className="w-4 h-4 text-[#00BFFF] shrink-0" title="Verified Seller" />
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{seller.location}</span>
          </p>
        </div>
      </div>

      <Link
        to={seller.shop_url}
        className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-neutral-800 hover:bg-[#00BFFF] hover:text-white text-xs font-bold text-slate-700 dark:text-neutral-200 transition-colors flex items-center gap-1 shrink-0"
      >
        <span>Shop</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};

