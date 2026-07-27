import React from 'react';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '../layouts/PublicLayout';

import {
    ShieldCheck, Zap, Heart, Globe,
    Star, CheckCircle, ShoppingBag, Smartphone, Lock, Award, Users, TrendingUp
} from 'lucide-react';

import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
    const { t } = useTranslation();

    const STATS = [
        { value: '100k+', label: t('about.activeAds') },
        { value: '50k+',  label: t('about.happySellers') },
        { value: '1M+',   label: t('about.monthlyUsers') },
        { value: '4.8/5', label: t('about.userRating') },
    ];

    const VALUES = [
        {
            icon: ShieldCheck,
            title: t('about.trustTitle'),
            desc: t('about.trustDesc'),
            color: 'bg-emerald-50 text-emerald-600',
        },
        {
            icon: Zap,
            title: t('about.velocityTitle'),
            desc: t('about.velocityDesc'),
            color: 'bg-amber-50 text-amber-600',
        },
        {
            icon: Heart,
            title: t('about.communityTitle'),
            desc: t('about.communityDesc'),
            color: 'bg-rose-50 text-rose-600',
        },
        {
            icon: Globe,
            title: t('about.africaTitle'),
            desc: t('about.teamDesc'),
            color: 'bg-blue-50 text-blue-600',
        },
        {
            icon: Lock,
            title: t('privacy.title'),
            desc: t('privacy.subtitle'),
            color: 'bg-purple-50 text-purple-600',
        },
        {
            icon: Award,
            title: t('listing.verifiedSeller'),
            desc: t('listing.verifiedSellerGuarantee'),
            color: 'bg-teal-50 text-teal-600',
        },
    ];

    const FEATURES = [
        { icon: Smartphone,   text: t('about.mobileOptimized') },
        { icon: ShoppingBag,  text: t('landing.freeToPost') },
        { icon: TrendingUp,   text: t('landing.featuredAds') },
        { icon: CheckCircle,  text: t('listing.verified') },
        { icon: Star,         text: t('listing.viewProfile') },
        { icon: Users,        text: t('about.communityTitle') },
    ];
    return (
        <PublicLayout>

            {/* ── Hero ── */}
            <section
                className="relative overflow-hidden py-24 text-white"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-700, #1a3d1f) 0%, var(--color-primary-500, #2e7d32) 55%, var(--color-primary-400, #43a047) 100%)' }}
            >
                <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
                    <div
                        className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
                    >
                        <Heart className="w-4 h-4 fill-white text-white" />
                        {t('about.storyTitle')}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
                        {t('about.heroTitle')} <br />
                        <span className="text-white/70">{t('about.heroSubtitle')}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                        {t('about.missionDesc')}
                    </p>
                </div>
            </section>

            {/* ── Stats ── */}
            <section
                className="py-12"
                style={{ background: 'linear-gradient(180deg, var(--color-primary-500, #2e7d32) 0%, var(--color-primary-600, #1b5e20) 100%)' }}
            >
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {STATS.map(({ value, label }) => (
                            <div key={label} className="text-center text-white">
                                <p className="text-4xl md:text-5xl font-black mb-1">{value}</p>
                                <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Mission ── */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider"
                                style={{ background: 'var(--color-primary-50, #f1f8e9)', color: 'var(--color-primary-600, #1b5e20)' }}
                            >
                                {t('about.mission')}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-6">
                                {t('about.builtForAfrica')}<br />
                                <span style={{ color: 'var(--color-primary-600, #1b5e20)' }}>{t('about.teamSubtitle')}</span>
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-5 text-base">
                                {t('about.storyPara1')}
                            </p>
                            <p className="text-gray-600 leading-relaxed mb-8 text-base">
                                {t('about.storyPara2')}
                            </p>
                            <div className="space-y-3">
                                {FEATURES.map(({ icon: Icon, text }) => (
                                    <div key={text} className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'var(--color-primary-50, #f1f8e9)', color: 'var(--color-primary-600, #1b5e20)' }}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Photo collage */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-xl">
                                <img src="/hero1.jpg" alt="Bustling Market" className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="aspect-square rounded-3xl overflow-hidden shadow-xl">
                                    <img src="/hero2.jpg" alt="Seller Success" className="w-full h-full object-cover" />
                                </div>
                                <div
                                    className="aspect-square rounded-3xl flex items-center justify-center p-6 text-white text-center font-black text-lg leading-snug shadow-xl"
                                    style={{ background: 'linear-gradient(135deg, var(--color-primary-600, #1b5e20), var(--color-primary-500, #2e7d32))' }}
                                >
                                    "Every deal, backed by trust."
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Core Values ── */}
            <section className="py-20" style={{ background: '#f7faf7' }}>
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-14">
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider"
                            style={{ background: 'var(--color-primary-50, #f1f8e9)', color: 'var(--color-primary-600, #1b5e20)' }}
                        >
                            {t('about.valuesBadge')}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900">{t('about.valuesTitle')}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {VALUES.map(({ icon: Icon, title, desc, color }) => (
                            <div key={title} className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${color}`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-3">{title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section
                className="py-20 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-600, #1b5e20) 0%, var(--color-primary-500, #2e7d32) 100%)' }}
            >
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 skew-x-12 transform origin-top-right pointer-events-none" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{t('landing.ctaTitle')}</h2>
                    <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                        {t('landing.ctaSubtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/signup"
                            className="px-8 py-4 bg-white font-black text-sm rounded-2xl shadow-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
                            style={{ color: 'var(--color-primary-600, #1b5e20)' }}
                        >
                            {t('auth.createAccount')}
                        </Link>
                        <Link
                            to="/download"
                            className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-black text-sm rounded-2xl border border-white/30 hover:bg-white/30 active:scale-[0.98] transition-all"
                        >
                            {t('footer.downloadApp')}
                        </Link>
                    </div>
                </div>
            </section>

        </PublicLayout>
    );
};

export { AboutPage };
