import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { authService } from '../services/authService';
import { getImageUrl } from '../utils/imageUtils';
import { listingService } from '../services/listingService';
import { followsService } from '../services/followsService';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import {
    ShieldCheck, MapPin, Clock, Phone,
    Share2, Flag, Loader2, ChevronLeft,
    UserPlus, UserCheck, Users
} from 'lucide-react';
import type { Listing } from '../types/listing';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';

const SellerProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { sellerId } = useParams<{ sellerId: string }>();
    const { user: me } = useAuthStore();
    const queryClient = useQueryClient();

    const { data: seller, isLoading: isSellerLoading } = useQuery({
        queryKey: ['seller', sellerId],
        queryFn: () => authService.getUserPublicInfo(Number(sellerId)),
        enabled: !!sellerId,
    });

    const { data: listings, isLoading: isListingsLoading } = useQuery<Listing[]>({
        queryKey: ['seller-listings', sellerId],
        queryFn: () => listingService.getListings({ owner_id: Number(sellerId) }),
        enabled: !!sellerId,
    });

    const { data: followStats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['follow-stats', sellerId],
        queryFn: () => followsService.getFollowStats(Number(sellerId)),
        enabled: !!sellerId && !!me,
    });

    const followMutation = useMutation({
        mutationFn: () => followsService.followUser(Number(sellerId)),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follow-stats', sellerId] }),
    });

    const unfollowMutation = useMutation({
        mutationFn: () => followsService.unfollowUser(Number(sellerId)),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follow-stats', sellerId] }),
    });

    useEffect(() => {
        if (sellerId) {
            authService.trackProfileView(Number(sellerId)).catch(() => {});
        }
    }, [sellerId]);

    const isOwnProfile = me?.id === Number(sellerId);
    const isFollowing = followStats?.is_following ?? false;

    const handleFollowToggle = () => {
        if (isFollowing) {
            unfollowMutation.mutate();
        } else {
            followMutation.mutate();
        }
    };

    if (isSellerLoading || isListingsLoading) {
        return (
            <PublicLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                </div>
            </PublicLayout>
        );
    }

    if (!seller) {
        return (
            <PublicLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('sellerProfile.notFound', 'Seller Not Found')}</h2>
                    <p className="text-gray-500 mb-6">{t('sellerProfile.notFoundDesc', 'The user profile you are looking for does not exist.')}</p>
                    <Link to="/">
                        <Button>{t('sellerProfile.backToMarketplace', 'Back to Marketplace')}</Button>
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            {/* Header / Breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <Link to="/" className="flex items-center text-sm text-gray-600 hover:text-primary-600 w-fit">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {t('sellerProfile.backToSearch', 'Back to Search')}
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Seller Profile Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-primary-50 border-4 border-primary-100 flex items-center justify-center text-primary-600 text-4xl font-bold uppercase mb-4 overflow-hidden">
                                    {seller.avatar_url ? (
                                        <img
                                            src={getImageUrl(seller.avatar_url)}
                                            alt={seller.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        seller.full_name?.charAt(0) || 'S'
                                    )}
                                </div>
                                <h1 className="text-xl font-bold text-gray-900 mb-1">{seller.full_name}</h1>

                                <div className="flex items-center gap-1.5 text-primary-600 mb-3">
                                    <ShieldCheck className="h-4 w-4 fill-primary-50" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{t('sellerProfile.verifiedSeller', 'Verified Seller')}</span>
                                </div>

                                {/* Follower stats */}
                                {!isStatsLoading && followStats && (
                                    <div className="flex items-center gap-4 py-3 mb-3 border-y border-gray-100 w-full justify-center">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900">{followStats.followers_count}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t('sellerProfile.followers', 'Followers')}</p>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100" />
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900">{followStats.following_count}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t('sellerProfile.following', 'Following')}</p>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100" />
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900">{listings?.length ?? 0}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t('sellerProfile.ads', 'Ads')}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="w-full space-y-3 pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="h-4 w-4" />
                                        <span>{t('sellerProfile.memberSince', 'Member since {{year}}', { year: 2024 })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 text-left">
                                        <ShieldCheck className="h-4 w-4 text-green-500" />
                                        <span>{t('sellerProfile.phoneVerified', 'Phone Verified')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="h-4 w-4" />
                                        <span>Mogadishu</span>
                                    </div>
                                </div>

                                <div className="w-full mt-6 space-y-3">
                                    {/* Follow / Unfollow button — only for logged-in non-own profiles */}
                                    {me && !isOwnProfile && (
                                        <Button
                                            className="w-full gap-2"
                                            variant={isFollowing ? 'secondary' : 'primary'}
                                            onClick={handleFollowToggle}
                                            disabled={followMutation.isPending || unfollowMutation.isPending}
                                        >
                                            {isFollowing ? (
                                                <><UserCheck className="h-4 w-4" />{t('sellerProfile.following', 'Following')}</>
                                            ) : (
                                                <><UserPlus className="h-4 w-4" />{t('sellerProfile.follow', 'Follow')}</>
                                            )}
                                        </Button>
                                    )}
                                    <Button className="w-full gap-2" variant={me && !isOwnProfile ? 'secondary' : 'primary'}>
                                        <Phone className="h-4 w-4" />
                                        {t('sellerProfile.callSeller', 'Call Seller')}
                                    </Button>
                                    <Button variant="secondary" className="w-full gap-2">
                                        <Share2 className="h-4 w-4" />
                                        {t('sellerProfile.shareProfile', 'Share Profile')}
                                    </Button>
                                </div>

                                <button className="mt-6 text-xs text-red-500 flex items-center gap-1 hover:underline">
                                    <Flag className="h-3 w-3" />
                                    {t('sellerProfile.reportUser', 'Report User')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Listings Content */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {t('sellerProfile.activeListings', 'Active Listings')}
                                <span className="ml-2 text-sm font-normal text-gray-500">({listings?.length || 0})</span>
                            </h2>
                        </div>

                        {listings && listings.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                {listings.map((ad, idx) => (
                                    <ProductCard
                                        key={ad.id}
                                        id={ad.id.toString()}
                                        ownerId={ad.owner_id}
                                        title_en={ad.title_en}
                                        title_so={ad.title_so}
                                        price={ad.price}
                                        currency={ad.currency}
                                        location={ad.location}
                                        imageUrl={ad.images?.[0]}
                                        isVerified={seller.is_verified}
                                        isPromoted={(ad.boost_level ?? 0) > 1}
                                        isPopular={idx < 1}
                                        registrationAge="Verified User"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                                <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('sellerProfile.noListings', 'No active listings')}</h3>
                                <p className="text-gray-500">{t('sellerProfile.noListingsDesc', "This seller hasn't posted any ads yet.")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export { SellerProfilePage };
