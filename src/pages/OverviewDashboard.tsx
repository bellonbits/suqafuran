import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { PlusCircle, ShoppingBag, MessageCircle, Heart, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import { dashboardService } from '../services/dashboardService';
import { aiService } from '../services/aiService';
import { useQuery } from '@tanstack/react-query';

const OverviewDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const firstName = user?.full_name?.split(' ')[0] || 'User';

    const { data: realStats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: dashboardService.getStats,
    });

    const { data: aiScore } = useQuery({
        queryKey: ['ai-seller-score', user?.id],
        queryFn: () => aiService.getSellerScore(user!.id),
        enabled: !!user?.id,
        staleTime: 300_000,   // score is stable — don't re-fetch on every dashboard visit
        retry: false,
    });

    const stats = [
        { label: t('overview.myListings'), value: realStats?.listings?.toString() || '0', icon: ShoppingBag, color: 'text-primary-600', bg: 'bg-primary-50' },
        { label: t('overview.activeMessages'), value: realStats?.messages?.toString() || '0', icon: MessageCircle, color: 'text-primary-600', bg: 'bg-primary-100' },
        { label: t('overview.savedAds'), value: realStats?.favorites?.toString() || '0', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'AI Trust Score', value: aiScore?.score?.toString() || '...', icon: Zap, color: 'text-secondary-600', bg: 'bg-secondary-50' },
    ];

    const tips = [t('overview.tip1'), t('overview.tip2'), t('overview.tip3'), t('overview.tip4')];

    return (
        <div className="space-y-10">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-gray-900">{t('overview.hello')}, {firstName} 👋</h1>
                        {user?.is_verified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider border border-primary-100">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {t('overview.verified')}
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1 italic">{t('overview.welcomeBack')}</p>
                </div>
                <Link to="/post-ad">
                    <Button className="rounded-xl h-12 px-8 gap-2 shadow-lg shadow-primary-200">
                        <PlusCircle className="h-5 w-5" />
                        {t('dashboard.sellAnItem')}
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-inner", stat.bg)}>
                            <stat.icon className={cn("h-6 w-6", stat.color)} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Action Center */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Verification Card */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 bg-primary-100/50 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck className="h-8 w-8 text-primary-600" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 tracking-tight">{t('overview.becomeVerified')}</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">{t('overview.becomeVerifiedDesc')}</p>
                    </div>
                    {user?.is_verified ? (
                        <div className="bg-primary-50 text-primary-700 px-6 py-3 rounded-xl border border-primary-200 flex items-center justify-center gap-2 font-bold transition-all hover:bg-primary-100 cursor-default shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                            {t('overview.verificationActive')}
                        </div>
                    ) : (
                        <Link to="/dashboard/verify">
                            <Button variant="outline" className="w-fit rounded-xl border-2 font-bold px-8">{t('overview.startVerification')}</Button>
                        </Link>
                    )}
                </div>

                {/* Tips Card */}
                <div className="bg-primary-500 p-8 rounded-3xl text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-3 tracking-tight italic">{t('overview.tipsTitle')}</h3>
                        <ul className="space-y-4 mt-6">
                            {tips.map((tip, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-primary-50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-400"></div>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Link to="/help" className="mt-8 text-xs font-bold uppercase tracking-widest text-primary-200 hover:text-white transition-colors relative z-10">
                        {t('overview.viewSellerGuide')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export { OverviewDashboard };
