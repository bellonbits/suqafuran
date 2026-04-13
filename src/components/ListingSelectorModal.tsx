import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { X, Search, ChevronRight, Zap } from 'lucide-react';
import { listingService } from '../services/listingService';
import { Button } from './Button';
import type { Listing } from '../types/listing';

interface ListingSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (listing: Listing) => void;
    title?: string;
}

export const ListingSelectorModal: React.FC<ListingSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    title,
}) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = React.useState('');

    const { data: listings, isLoading } = useQuery({
        queryKey: ['myListings'],
        queryFn: () => listingService.getMyListings(),
        enabled: isOpen,
    });

    if (!isOpen) return null;

    const filteredListings = listings?.filter(listing => 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-primary-50/50">
                    <h2 className="text-xl font-black text-gray-900">{title || t('boost.selectAd')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('search.placeholder')}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 transition-all outline-none text-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('common.loading')}</p>
                        </div>
                    ) : filteredListings.length > 0 ? (
                        filteredListings.map((listing) => (
                            <button
                                key={listing.id}
                                onClick={() => onSelect(listing)}
                                className="w-full group p-3 rounded-2xl border-2 border-gray-50 hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center gap-4 text-left"
                            >
                                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                    {listing.images?.[0] ? (
                                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 uppercase text-[10px] font-black text-gray-300">
                                            No Img
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate group-hover:text-primary-700">{listing.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-primary-600 font-black text-sm">
                                            {listing.currency} {listing.price.toLocaleString()}
                                        </span>
                                        {(listing.boost_level ?? 0) > 0 && (
                                            <span className="flex items-center gap-0.5 px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                                <Zap className="w-2.5 h-2.5 fill-secondary-500" />
                                                Boosted
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-transform group-hover:translate-x-1" />
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-12 px-6">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{t('search.noResults')}</h3>
                            <p className="text-sm text-gray-500">{t('boost.noAdsFound')}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        className="w-full text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900"
                        onClick={onClose}
                    >
                        {t('common.cancel')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
