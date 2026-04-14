import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { TrendingUp, Eye, MousePointer2, BarChart3, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PerformancePage: React.FC = () => {
    const { t } = useTranslation();
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: dashboardService.getStats
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

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 h-[300px] flex flex-col items-center justify-center text-center">
                <BarChart3 className="h-16 w-16 text-gray-100 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">{t('performance.detailedAnalytics', 'Detailed Analytics')}</h3>
                <p className="text-gray-500 mt-2 max-w-sm">
                    {t('performance.comingSoon', "We're finishing the advanced performance tracking system. Soon you'll be able to see hour-by-hour view trends.")}
                </p>
            </div>
        </div>
    );
};
