import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import {
    Search, MapPin, TrendingUp, ShieldCheck, Loader2,
    ChevronRight, ShoppingBag, ArrowRight, Zap
} from 'lucide-react';
import { Button } from '../components/Button';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { CategoryDirectory } from '../components/CategoryDirectory';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isLocationOpen, setLocationOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
        gcTime: 48 * 60 * 60 * 1000,   // 48 hours
    });

    const { data: featuredAds, isLoading: adsLoading } = useQuery({
        queryKey: ['featured-ads'],
        queryFn: () => listingService.getListings({ limit: 12 }),
    });

    const displayCategories = categories || [];
    const displayAds = featuredAds || [];

    return (
        <PublicLayout>
            {/* ═══════════════════════════════════════════════
                MOBILE LAYOUT
            ═══════════════════════════════════════════════ */}
            <div className="lg:hidden w-full overflow-x-hidden" style={{ background: '#f4f7fa' }}>

                {/* ── Hero banner ── */}
                <div
                    className="relative overflow-hidden px-4 pt-6 pb-6"
                    style={{ background: 'linear-gradient(160deg, var(--color-primary-400) 0%, var(--color-primary-500) 80%, var(--color-primary-200) 100%)' }}
                >
                    {/* decorative circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute top-4 -left-8  w-24 h-24 rounded-full bg-white/08 pointer-events-none" />

                    <h1 className="text-white text-[22px] font-extrabold mb-4 leading-tight tracking-tight relative z-10 break-words">
                        {t('landing.heroTitle')}
                    </h1>

                    {/* Search row */}
                    <div className="flex flex-wrap items-center gap-2 relative z-10">
                        <button
                            onClick={() => setLocationOpen(true)}
                            className="flex items-center gap-1.5 bg-white/95 rounded-2xl px-3 h-11 shadow-md text-gray-700 font-semibold active:scale-98 transition-transform shrink-0 max-w-[140px]"
                        >
                            <MapPin className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                            <span className="truncate flex-1 text-left text-xs font-semibold">
                                {selectedLocation || t('landing.allLocations')}
                            </span>
                            <ChevronRight className="h-3 w-3 text-gray-400 rotate-90 shrink-0" />
                        </button>
                        <button
                            onClick={() => navigate('/search')}
                            className="flex-1 min-w-[120px] flex items-center gap-2 bg-white/95 rounded-2xl px-4 h-11 shadow-md text-gray-400 active:scale-98 transition-transform"
                        >
                            <Search className="h-4 w-4 shrink-0 text-primary-400" />
                            <span className="text-sm truncate">{t('nav.search')}</span>
                        </button>
                    </div>
                </div>

                {/* Category Directory — Now visible as a grid */}
                <div className="bg-white py-4 border-b border-gray-100">
                    <div className="px-4 mb-4">
                        <div className="flex items-center gap-2">
                             <div className="w-1 h-5 rounded-full bg-primary-500" />
                             <h2 className="text-[15px] font-extrabold text-gray-900">{t('listing.category')}</h2>
                        </div>
                    </div>
                    <div className="px-4">
                         <CategoryDirectory categories={displayCategories} />
                    </div>
                </div>

                {/* Sell promo banner */}
                <div className="mx-4 my-4">
                    <div
                        onClick={() => navigate('/post-ad')}
                        className="relative overflow-hidden rounded-3xl p-5 active:scale-[0.98] transition-transform cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-primary-500) 60%, var(--color-primary-200) 100%)' }}
                    >
                        <div className="relative z-10">
                            <span className="inline-flex items-center gap-1 bg-white/30 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2.5 uppercase tracking-widest backdrop-blur-sm">
                                <Zap className="h-3 w-3" /> {t('landing.sellBannerBadge')}
                            </span>
                            <h3 className="text-white font-extrabold text-[20px] leading-tight mb-1.5">
                                {t('landing.sellBannerTitle')}
                            </h3>
                            <p className="text-white/80 text-xs mb-4 leading-relaxed">{t('landing.sellBannerDesc')}</p>
                            <div className="inline-flex items-center gap-1.5 bg-secondary-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">
                                {t('landing.sellBannerBtn')} <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
                        <div className="absolute right-4 bottom-0 w-20 h-20 rounded-full bg-white/08 pointer-events-none" />
                    </div>
                </div>

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
                        {displayAds.map((ad, idx) => (
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

                {/* Sell CTA card */}
                <div className="mx-4 mb-4">
                    <div
                        onClick={() => navigate('/post-ad')}
                        className="bg-white rounded-3xl p-4 card-shadow flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                    >
                        <div>
                            <h4 className="font-extrabold text-gray-900 text-sm">{t('listing.postAd')}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">{t('landing.sellBannerDesc')}</p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-500))' }}>
                            <ShoppingBag className="h-5 w-5 text-white" />
                        </div>
                    </div>
                </div>

                {/* Safety banner */}
                <div className="mx-4 mb-8">
                    <div
                        onClick={() => navigate('/safety')}
                        className="bg-white rounded-3xl p-4 card-shadow flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm">{t('footer.safetyTips')}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">{t('landing.staySafe')}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                DESKTOP LAYOUT
            ═══════════════════════════════════════════════ */}
            <div className="hidden lg:block">
                {/* Hero */}
                <section className="relative bg-primary-500 pt-14 pb-24">
                    <div className="container mx-auto px-4 flex flex-col items-center">
                        <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight">
                            {t('landing.heroTitle')}
                        </h1>
                        <div className="max-w-4xl w-full flex shadow-2xl rounded-2xl overflow-hidden border border-white/10">
                            <div className="relative bg-white w-1/3 border-r border-gray-100">
                                <button
                                    onClick={() => setLocationOpen(true)}
                                    className="w-full h-14 pl-4 pr-10 text-gray-700 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span className="truncate font-medium">{selectedLocation || t('landing.allLocations')}</span>
                                    <MapPin className="ml-2 w-4 h-4 text-primary-500" />
                                </button>
                            </div>
                            <div className="flex-1 relative bg-white">
                                <input
                                    type="text"
                                    placeholder={t('landing.searchPlaceholder')}
                                    className="w-full h-14 pl-4 pr-14 text-gray-900 focus:outline-none placeholder:text-gray-400 font-medium"
                                />
                                <div className="absolute right-0 top-0 h-14 w-14 flex items-center justify-center text-gray-400">
                                    <Search className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main content — sidebar + feed */}
                <section className="py-8 bg-[#f0f3f8]">
                    <div className="container mx-auto px-4">
                        <div className="flex gap-0 items-start">

                            {/* ── LEFT: Category Directory sidebar ── */}
                            <div className="w-[300px] shrink-0">
                                <CategoryDirectory categories={displayCategories} />
                            </div>

                            {/* ── RIGHT: Banners + Featured Ads ── */}
                            <div className="flex-1 min-w-0 space-y-6 pl-6">

                                {/* Action banners */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => navigate('/post-ad')}
                                        className="bg-[#ebf9eb] border border-[#d3f0d3] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between min-h-[100px]"
                                    >
                                        <div>
                                            <h4 className="font-bold text-[#2d3a2d] text-base">{t('listing.postAd')}</h4>
                                            <p className="text-sm text-[#5a705a] mt-0.5">{t('landing.sellBannerDesc')}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                            <ShoppingBag className="w-6 h-6 text-[var(--color-primary-500)]" />
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate('/safety')}
                                        className="bg-[#f0f0ff] border border-[#e0e0ff] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between min-h-[100px]"
                                    >
                                        <div>
                                            <h4 className="font-bold text-[#2e2e4e] text-base">{t('footer.safetyTips')}</h4>
                                            <p className="text-sm text-[#62628e] mt-0.5">{t('landing.learnToSell')}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-6 h-6 text-[#5151d5]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Featured Ads */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-primary-500" />
                                            <h2 className="text-lg font-bold text-gray-900">{t('landing.featuredAds')}</h2>
                                        </div>
                                        <Button variant="ghost" className="text-primary-600 text-sm" onClick={() => navigate('/search')}>{t('landing.seeAll')}</Button>
                                    </div>
                                    {adsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                                            {displayAds.map((ad, idx) => (
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
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Desktop CTA */}
                <section className="py-12 bg-primary-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 skew-x-12 transform origin-top-right" />
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-3xl">
                            <h2 className="text-4xl font-bold mb-4 text-black">{t('landing.ctaTitle')}</h2>
                            <p className="text-lg text-black/80 mb-8">{t('landing.ctaSubtitle')}</p>
                            <div className="flex gap-4">
                                <Link to="/post-ad"><Button size="lg" className="rounded-full px-10 bg-white text-primary-600 hover:bg-gray-50 border-none shadow-xl">{t('landing.postAdNow')}</Button></Link>
                                <Link to="/help"><Button size="lg" variant="outline" className="rounded-full px-10 border-white/40 text-black hover:bg-white/10">{t('landing.learnToSell')}</Button></Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <LocationPickerModal
                isOpen={isLocationOpen}
                onClose={() => setLocationOpen(false)}
                onSelect={(location) => setSelectedLocation(location === 'All Locations' ? '' : location.split(',')[0])}
            />
        </PublicLayout>
    );
};

export { LandingPage };
