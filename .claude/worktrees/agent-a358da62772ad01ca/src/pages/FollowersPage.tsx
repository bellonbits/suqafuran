import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followsService } from '../services/followsService';
import { Users, Search, UserMinus } from 'lucide-react';
import { Button } from '../components/Button';
import { getAvatarUrl } from '../utils/imageUtils';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const FollowersPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'followers' | 'following'>('followers');
    const [search, setSearch] = useState('');

    const { data: followers, isLoading: loadingFollowers } = useQuery({
        queryKey: ['my-followers'],
        queryFn: followsService.getMyFollowers,
    });

    const { data: following, isLoading: loadingFollowing } = useQuery({
        queryKey: ['my-following'],
        queryFn: followsService.getMyFollowing,
    });

    const unfollowMutation = useMutation({
        mutationFn: (userId: number) => followsService.unfollowUser(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-following'] }),
    });

    const isLoading = tab === 'followers' ? loadingFollowers : loadingFollowing;
    const list = (tab === 'followers' ? followers : following) ?? [];

    const filtered = list.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search)
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('followers.title', 'Followers')}</h1>
                    <p className="text-gray-500 mt-1">{t('followers.subtitle', 'Manage users who follow your marketplace updates.')}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                {/* Tab bar */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setTab('followers')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${
                            tab === 'followers'
                                ? 'text-primary-600 border-b-2 border-primary-600'
                                : 'text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        {t('followers.tabFollowers', 'Followers')}
                        {followers && (
                            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                                {followers.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('following')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${
                            tab === 'following'
                                ? 'text-primary-600 border-b-2 border-primary-600'
                                : 'text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        {t('followers.tabFollowing', 'Following')}
                        {following && (
                            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                                {following.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('followers.findFollower', 'Search...')}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center text-gray-400">
                            {t('followers.loading', 'Loading...')}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <Users className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">
                                {tab === 'followers'
                                    ? t('followers.noFollowersTitle', 'No followers yet')
                                    : t('followers.noFollowingTitle', 'Not following anyone yet')}
                            </h3>
                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                                {tab === 'followers'
                                    ? t('followers.noFollowersDesc', 'Build your audience by posting great ads and being active.')
                                    : t('followers.noFollowingDesc', 'Browse seller profiles and tap Follow to stay updated on their listings.')}
                            </p>
                        </div>
                    ) : (
                        filtered.map((u) => (
                            <div
                                key={u.id}
                                className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group hover:border-primary-200 transition-all"
                            >
                                <Link to={`/seller/${u.id}`} className="shrink-0">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                        <img
                                            src={getAvatarUrl(u.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=0ea5e9&color=fff`}
                                            className="w-full h-full object-cover"
                                            alt={u.full_name}
                                        />
                                    </div>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/seller/${u.id}`}>
                                        <p className="font-bold text-gray-900 truncate hover:text-primary-600 transition-colors">{u.full_name}</p>
                                    </Link>
                                    <p className="text-xs text-gray-500 truncate">{u.phone}</p>
                                </div>
                                {tab === 'following' ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-tight gap-1 text-red-500 border-red-200 hover:bg-red-50"
                                        onClick={() => unfollowMutation.mutate(u.id)}
                                        disabled={unfollowMutation.isPending}
                                    >
                                        <UserMinus className="h-3 w-3" />
                                        {t('followers.unfollow', 'Unfollow')}
                                    </Button>
                                ) : (
                                    <Link to={`/seller/${u.id}`}>
                                        <Button size="sm" variant="outline" className="rounded-lg h-8 text-[10px] font-bold uppercase tracking-tight">
                                            {t('followers.profile', 'Profile')}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
