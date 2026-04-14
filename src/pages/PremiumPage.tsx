import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Zap, Shield, Target,
    Crown, Star, Check,
    ArrowRight, Sparkles,
    Gem, TrendingUp, Clock, Loader2
} from 'lucide-react';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { useLanguageField } from '../hooks/useLanguageField';
import { listingService } from '../services/listingService';
import { ListingSelectorModal } from '../components/ListingSelectorModal';
import { LipanaPaymentModal } from '../components/LipanaPaymentModal';
import type { Listing } from '../types/listing';
import { useTranslation } from 'react-i18next';

interface PromotionPlan {
    id: number;
    name_en: string;
    name_so?: string;
    price_usd: number;
    duration_days: number;
    description_en?: string;
    description_so?: string;
    [key: string]: any;
}

const PLAN_ICONS = [Target, Gem, Crown];
const KES_RATE = 130; // approximate USD to KES

export const PremiumPage: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState<PromotionPlan | null>(null);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [showListingModal, setShowListingModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const { getField } = useLanguageField();
    const { t } = useTranslation();

    const { data: plans = [], isLoading } = useQuery<PromotionPlan[]>({
        queryKey: ['promotionPlans'],
        queryFn: listingService.getPromotionPlans,
    });

    const handleSelectPlan = (plan: PromotionPlan) => {
        setSelectedPlan(plan);
        setShowListingModal(true);
    };

    const handleListingSelected = (listing: Listing) => {
        setSelectedListing(listing);
        setShowListingModal(false);
        setShowPaymentModal(true);
    };

    const handlePaymentConfirm = async (phone: string): Promise<{ promoId?: number; error?: string }> => {
        if (!selectedPlan || !selectedListing) return { error: 'Missing plan or listing' };
        try {
            const result = await listingService.createPromotionOrder({
                listing_id: selectedListing.id,
                plan_id: selectedPlan.id,
                payment_phone: phone,
            });
            return { promoId: result.id };
        } catch (e: any) {
            return { error: e?.response?.data?.detail || 'Payment initiation failed. Please try again.' };
        }
    };

    const handlePollStatus = async (promoId: number) => {
        const result = await listingService.checkPromotionStatus(promoId);
        return result;
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Hero Section */}
            <div className="relative bg-gray-900 rounded-[2.5rem] p-10 md:p-16 text-white overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>

                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-primary-300 text-xs font-black uppercase tracking-widest mb-6">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t('premium.premiumSolutions', 'Premium Solutions')}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                        {t('premium.heroTitle', 'Reach Millions of')} <span className="text-primary-400">{t('premium.heroTitleHighlight', 'Ready Buyers')}</span>
                    </h1>
                    <p className="text-lg text-gray-400 mb-10 leading-relaxed font-medium">
                        {t('premium.heroDesc', 'Suqafuran premium services give your ads the visibility they deserve. Professional sellers use our boosting plans to sell up to 100x faster.')}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm font-bold border-r border-white/10 pr-6 mr-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <span>{t('premium.boostedAds', '100k+ Boosted Ads')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <span>{t('premium.prioritySupport', '24/7 Priority Support')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-gray-900">{t('premium.chooseBoostPlan', 'Choose Your Boost Plan')}</h2>
                    <p className="text-gray-500 font-medium">{t('premium.payWithMpesa', 'Pay with M-Pesa (Lipana) — Instant activation after payment.')}</p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('premium.loadingPlans', 'Loading Plans...')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {(plans.length > 0 ? plans : []).map((plan, idx) => {
                            const Icon = PLAN_ICONS[idx % PLAN_ICONS.length];
                            const isPopular = idx === 1;
                            const amountKes = Math.round(plan.price_usd * KES_RATE);
                            const features = [
                                `${plan.duration_days}-day visibility boost`,
                                'Priority placement in search',
                                'Highlighted listing badge',
                                idx >= 1 ? 'Featured on homepage' : 'Category top placement',
                                idx >= 2 ? 'Personal account manager' : null,
                            ].filter(Boolean) as string[];

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "group bg-white rounded-[2rem] p-8 border-2 transition-all duration-300 flex flex-col relative",
                                        isPopular
                                            ? "border-primary-500 shadow-2xl shadow-primary-200 scale-105 z-10"
                                            : "border-gray-50 hover:border-gray-200 hover:shadow-xl"
                                    )}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                                            {t('premium.mostPopular', 'Most Popular')}
                                        </div>
                                    )}

                                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8", "bg-primary-50")}>
                                        <Icon className="h-8 w-8 text-primary-600" />
                                    </div>

                                    <h3 className="text-2xl font-black text-gray-900 mb-2">{getField(plan, 'name')}</h3>
                                    <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                                        {getField(plan, 'description') || `Boost your ad for ${plan.duration_days} days for maximum visibility.`}
                                    </p>

                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-gray-900">KSh {amountKes.toLocaleString()}</span>
                                            <span className="text-gray-400 font-bold ml-1 text-sm">/ {plan.duration_days} days</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">≈ ${plan.price_usd} USD</p>
                                    </div>

                                    <ul className="space-y-4 mb-10 flex-1">
                                        {features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                                                <div className="w-5 h-5 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                                    <Check className="h-3 w-3 text-primary-600" />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={cn(
                                            "w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                            isPopular
                                                ? "bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-200"
                                                : "bg-gray-900 hover:bg-black text-white"
                                        )}
                                        onClick={() => handleSelectPlan(plan)}
                                    >
                                        {t('premium.boostWithMpesa', 'Boost with M-Pesa')}
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Why Boost Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12">
                <div className="space-y-6">
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">
                        {t('premium.whyBoost', 'Why Boost on')} <br /><span className="text-primary-600">Suqafuran?</span>
                    </h2>
                    <p className="text-gray-600 font-medium leading-relaxed">
                        {t('premium.whyBoostDesc', 'With millions of users across the Horn of Africa, your listings can get lost among the thousands of ads posted every hour. Boosting puts you in the spotlight.')}
                    </p>
                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{t('premium.instantActivation', 'Instant Activation')}</h4>
                                <p className="text-sm text-gray-500">{t('premium.instantActivationDesc', 'Your boost goes live immediately after M-Pesa payment confirmation.')}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{t('premium.performanceTracking', 'Performance Tracking')}</h4>
                                <p className="text-sm text-gray-500">{t('premium.performanceTrackingDesc', 'See exactly how many more views and clicks your boost generates.')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 rounded-[2.5rem] p-8 flex flex-col justify-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <Shield className="h-64 w-64 text-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-primary-600 font-bold mb-2">
                            <Clock className="h-4 w-4" />
                            {t('premium.realtimeAnalytics', 'Real-time Analytics')}
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-4">{t('premium.averageBoostResults', 'Average Boost Results')}</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Views Increase', value: '450%', width: 'w-full', color: 'bg-primary-500' },
                                { label: 'Call Rate', value: '180%', width: 'w-[40%]', color: 'bg-primary-500' },
                                { label: 'Average Sale Time', value: '-65%', width: 'w-[65%]', color: 'bg-green-500' },
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold text-gray-700">
                                        <span>{stat.label}</span>
                                        <span className={i === 2 ? 'text-green-600' : 'text-primary-600'}>{stat.value}</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all duration-1000", stat.color, stat.width)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Listing Selector Modal */}
            <ListingSelectorModal
                isOpen={showListingModal}
                onClose={() => { setShowListingModal(false); setSelectedPlan(null); }}
                onSelect={handleListingSelected}
                title={selectedPlan ? `Select ad to boost with "${selectedPlan.name}"` : 'Select an Ad'}
            />

            {/* Lipana Payment Modal */}
            <LipanaPaymentModal
                isOpen={showPaymentModal}
                onClose={() => { setShowPaymentModal(false); setSelectedListing(null); setSelectedPlan(null); }}
                onConfirm={handlePaymentConfirm}
                onPollStatus={handlePollStatus}
                amount={selectedPlan ? Math.round(selectedPlan.price_usd * KES_RATE) : 0}
                planName={selectedPlan ? getField(selectedPlan, 'name') : ''}
                listingTitle={selectedListing ? getField(selectedListing, 'title') : undefined}
            />
        </div>
    );
};
