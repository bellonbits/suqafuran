import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { followsService } from '../services/followsService';
import { Users, Search } from 'lucide-react';
import { Button } from '../components/Button';
import { getAvatarUrl } from '../utils/imageUtils';
import { useTranslation } from 'react-i18next';

export const FollowersPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: followers, isLoading } = useQuery({
        queryKey: ['my-followers'],
        queryFn: followsService.getMyFollowers
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('followers.title', 'Followers')}</h1>
                    <p className="text-gray-500 mt-1">{t('followers.subtitle', 'Manage users who follow your marketplace updates.')}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">{t('followers.totalFollowers', 'Total Followers')} ({followers?.length || 0})</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('followers.findFollower', 'Find a follower...')}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center text-gray-400">{t('followers.loading', 'Loading followers...')}</div>
                    ) : !followers || followers.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <Users className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">{t('followers.noFollowersTitle', 'No followers yet')}</h3>
                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">{t('followers.noFollowersDesc', 'Build your audience by posting great ads and being active.')}</p>
                        </div>
                    ) : (
                        followers.map((f) => (
                            <div key={f.id} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group hover:border-primary-200 transition-all">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                    <img src={getAvatarUrl(f.avatar_url) || `https://ui-avatars.com/api/?name=${f.full_name}`} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{f.full_name}</p>
                                    <p className="text-xs text-gray-500 truncate">{f.phone}</p>
                                </div>
                                <Button size="sm" variant="outline" className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-tight">{t('followers.profile', 'Profile')}</Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
