import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import {
    MapPin, TrendingUp, ShieldCheck, Loader2,
    ChevronRight, ShoppingBag, ArrowRight, Zap, ChevronDown, Sparkles
} from 'lucide-react';
import { Button } from '../components/Button';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { CategoryDirectory } from '../components/CategoryDirectory';
import { SearchBar } from '../components/SearchBar';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getImageUrl } from '../utils/imageUtils';
import { useLanguageField } from '../hooks/useLanguageField';
import { aiService } from '../services/api';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getField } = useLanguageField();
    const [isLocationOpen, setLocationOpen] = useState(false);

    const { data: ads, isLoading: adsLoading } = useQuery({
        queryKey: ['featured-ads'],
        queryFn: () => listingService.getListings({ limit: 12 }),
    });

    const { data: recAds = [], isLoading: recLoading } = useQuery({
        queryKey: ['recommended-ads'],
        queryFn: () => listingService.getListings({ limit: 6 }),
    });

    const displayAds = ads || [];

    return (
        <PublicLayout>
            <div className="bg-gray-50 min-h-screen pb-20">
                {/* Hero / Header Area */}
                <div className="bg-white px-4 pt-6 pb-4 shadow-sm border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{t('landing.welcome')}</span>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">Suqafuran Market</h1>
                        </div>
                        <button 
                            onClick={() => setLocationOpen(true)}
                            className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 active:scale-95 transition-all"
                        >
                            <MapPin className="h-4 w-4 text-primary-500" />
                            <span className="text-xs font-bold text-gray-700">Mogadishu</span>
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                        </button>
                    </div>

                    <SearchBar variant="mobile" />
                </div>

                {/* Categories Horizontal */}
                <CategoryDirectory variant="horizontal" className="my-4" />

                {/* Smart Shop Recommendations — Mobile */}
                {recAds.length > 0 && (
                    <div className="bg-white py-6 mb-4 border-b border-gray-100">
                        <div className="px-4 flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary-500 animate-pulse" />
                                <h2 className="text-[15px] font-extrabold text-gray-900">Smart Shop Choice</h2>
                            </div>
                        </div>
                        <div className="overflow-x-auto pb-2 no-scrollbar">
                            <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
                                {recAds.map((ad: any) => (
                                    <div key={ad.id} className="w-[180px]">
                                        <ProductCard
                                            id={String(ad.id)}
                                            title_en={ad.title_en || ''}
                                            title_so={ad.title_so}
                                            price={ad.price || 0}
                                            currency={ad.currency || 'USD'}
                                            location={ad.location || ''}
                                            imageUrl={ad.images?.[0] || ''}
                                            isVerified={ad.owner?.is_verified}
                                            registrationAge="Smart Verified"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Section header — Featured */}
                <div className="px-4 flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-5 rounded-full bg-primary-500" />
                        <h2 className="text-[15px] font-extrabold text-gray-900">{t('landing.featuredAds')}</h2>
                    </div>
                    <button
                        onClick={() => navigate('/search')}
                        className="text-primary-500 text-xs font-bold flex items-center gap-0.5 active:opacity-70"
                    >
                        {t('landing.seeAll')} <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Product grid */}
                {adsLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-7 h-7 animate-spin text-primary-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                        {displayAds.map((ad: any, idx: number) => (
                            <ProductCard
                                key={ad.id}
                                id={String(ad.id)}
                                title_en={ad.title_en || ''}
                                title_so={ad.title_so}
                                price={ad.price || 0}
                                currency={ad.currency || 'USD'}
                                location={ad.location || ''}
                                imageUrl={ad.images?.[0] || ''}
                                isVerified={ad.owner?.is_verified}
                                isPromoted={(ad.boost_level ?? 0) > 0}
                                isPopular={idx < 2}
                                rating={4.8 + (idx / 10)}
                                registrationAge={idx % 2 === 0 ? t('common.yearsPlus') : t('common.verifiedId')}
                            />
                        ))}
                    </div>
                )}

                {/* Sell Banner Mobile */}
                <div className="px-4 py-6">
                    <div className="relative bg-gray-900 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl border border-white/5 group active:scale-[0.98] transition-all"
                         onClick={() => navigate('/post-ad')}>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em]">Smart Shop Listing</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 leading-tight tracking-tight">
                                Turn your items into <span className="text-primary-400">Cash</span> today.
                            </h3>
                            <p className="text-gray-400 text-sm mb-6 font-medium leading-relaxed max-w-[80%]">
                                Join 10k+ sellers. Our Smart Shop handles the details for you.
                            </p>
                            <div className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl group-hover:bg-primary-400 transition-colors">
                                <Zap className="h-4 w-4 fill-current" />
                                START SELLING NOW
                            </div>
                        </div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
                        <div className="absolute right-4 bottom-0 w-20 h-20 rounded-full bg-white/08 pointer-events-none" />
                    </div>
                </div>

            </div>

            <LocationPickerModal
                isOpen={isLocationOpen}
                onClose={() => setLocationOpen(false)}
                onSelect={(loc) => {
                    console.log('Selected loc:', loc);
                    setLocationOpen(false);
                }}
            />
        </PublicLayout>
    );
};

export default LandingPage;
