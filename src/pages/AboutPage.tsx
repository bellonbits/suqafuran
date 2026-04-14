import React from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import { ShieldCheck, Zap, Heart, Globe, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <PublicLayout>
            <div className="bg-primary-600 text-white py-20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 italic tracking-tight">{t('about.mission', 'Our Mission is to Connect Africa through Commerce')}</h1>
                    <p className="text-lg text-primary-100 max-w-2xl mx-auto backdrop-blur-sm">
                        {t('about.missionDesc', "Suqafuran is more than just a marketplace. It's a community where trust and technology meet.")}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-20 flex flex-col gap-24">
                {/* Core Values */}
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('about.trustTitle', 'Trust Above All')}</h3>
                        <p className="text-gray-600 leading-relaxed">{t('about.trustDesc', 'We invest heavily in safety and verification to ensure every transaction is secure.')}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-secondary-50 text-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Zap className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('about.velocityTitle', 'Velocity')}</h3>
                        <p className="text-gray-600 leading-relaxed">{t('about.velocityDesc', 'Our platform is optimized for speed, helping you sell your items in record time.')}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Heart className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('about.communityTitle', 'Community')}</h3>
                        <p className="text-gray-600 leading-relaxed">{t('about.communityDesc', 'We empower local businesses and individuals to reach more customers daily.')}</p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="bg-gray-900 rounded-3xl p-12 text-white grid md:grid-cols-4 gap-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary-600/5 mix-blend-overlay"></div>
                    <div>
                        <p className="text-4xl font-bold mb-2">100k+</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('about.activeAds', 'Active Ads')}</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold mb-2">50k+</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('about.happySellers', 'Happy Sellers')}</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold mb-2">1M+</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('about.monthlyUsers', 'Monthly Users')}</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold mb-2">4.8/5</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('about.userRating', 'User Rating')}</p>
                    </div>
                </div>

                {/* Team / Culture */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">{t('about.builtForAfrica', 'Built for Africa, by people who care')}</h2>
                        <p className="text-gray-600 mb-8 leading-relaxed text-lg italic">
                            {t('about.teamDesc', 'Our team consists of engineers, designers, and customer support specialists dedicated to solving the unique challenges of the African marketplace.')}
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Globe className="h-6 w-6 text-gray-400" />
                                </div>
                                <span>{t('about.operatingAcross', 'Operating across the continent')}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Target className="h-6 w-6 text-gray-400" />
                                </div>
                                <span>{t('about.mobileOptimized', '100% Mobile Optimized')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
                            <img src="/hero1.jpg" className="w-full h-full object-cover" alt="Bustling African Market" />
                        </div>
                        <div className="space-y-4 pt-8">
                            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                                <img src="/hero2.jpg" className="w-full h-full object-cover" alt="African Crafts" />
                            </div>
                            <div className="aspect-square bg-primary-600 rounded-2xl flex items-center justify-center p-6 text-white text-center italic font-bold">
                                {t('about.innovation', 'Innovation drives us forward.')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export { AboutPage };
