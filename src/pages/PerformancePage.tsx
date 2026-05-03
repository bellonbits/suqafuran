import React from 'react';
import { TrendingUp, Eye, MousePointer2, BarChart3, Calendar, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { aiService } from '../services/aiService';
import { dashboardService } from '../services/dashboardService';

export const PerformancePage: React.FC = () => {
    const { t } = useTranslation();
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: dashboardService.getStats
    });

    const { data: insights } = useQuery({
        queryKey: ['ai-demand-insights'],
        queryFn: () => aiService.getDemandInsights({ location: 'Mogadishu' }), // Pass object as expected
        staleTime: 600_000,
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('performance.title', 'Marketplace Performance')}</h1>
                    <p className="text-gray-500 mt-1">{t('performance.subtitle', 'Analyze how your listings and profile are performing.')}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-sm font-semibold text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {t('performance.last30Days', 'Last 30 Days')}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{t('performance.totalImpressions', 'Total Impressions')}</p>
                    <p className="text-3xl font-black text-gray-900">{stats?.views || '0'}</p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                        <Eye className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{t('performance.listingViews', 'Listing Views')}</p>
                    <p className="text-3xl font-black text-gray-900">{stats?.views || '0'}</p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                        <MousePointer2 className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{t('performance.totalClicks', 'Total Clicks')}</p>
                    <p className="text-3xl font-black text-gray-900">0</p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">CTR</p>
                    <p className="text-3xl font-black text-gray-900">0.0%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Demand Insights */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <Sparkles className="absolute top-4 right-4 text-primary-400 opacity-20 w-32 h-32 rotate-12" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-primary-400" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-primary-400">AI Market Insights</span>
                        </div>
                        
                        <div className="flex items-end gap-4 mb-8">
                            <h2 className="text-5xl font-black">{insights?.demand_score || 0}%</h2>
                            <div className="pb-2">
                                <p className="text-sm font-bold text-green-400 flex items-center gap-1">
                                    <TrendingUp size={14} />
                                    +{insights?.growth || '0%'}
                                </p>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Demand Growth</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Trending Keywords</p>
                                <div className="flex flex-wrap gap-2">
                                    {insights?.trending_keywords.map((k: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm">
                                            #{k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-sm italic text-gray-300 leading-relaxed">
                                    " {insights?.advice || 'Loading insights...'} "
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                    <BarChart3 className="h-16 w-16 text-gray-100 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">{t('performance.detailedAnalytics', 'Detailed Analytics')}</h3>
                    <p className="text-gray-500 mt-2 max-w-sm">
                        {t('performance.comingSoon', "We're finishing the advanced performance tracking system. Soon you'll be able to see hour-by-hour view trends.")}
                    </p>
                </div>
            </div>
        </div>
    );
};
