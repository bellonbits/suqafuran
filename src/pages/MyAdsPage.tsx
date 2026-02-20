import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listingService } from '../services/listingService';
import {
    ShoppingBag, Eye, Edit2,
    Trash2, TrendingUp, Loader2, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import type { Listing } from '../types/listing';

import { walletService } from '../services/walletService';

const MyAdsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = React.useState<number | null>(null);
    const [boostingListing, setBoostingListing] = React.useState<Listing | null>(null);
    const [selectedBoost, setSelectedBoost] = React.useState<number | null>(null);

    const { data: myAds, isLoading } = useQuery<Listing[]>({
        queryKey: ['my-listings'],
        queryFn: listingService.getMyListings,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => listingService.deleteListing(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-listings'] });
            setDeletingId(null);
        },
    });

    const { data: boostPrices } = useQuery({
        queryKey: ['boost-prices'],
        queryFn: walletService.getBoostPrices,
    });

    return (
        <div className="space-y-4">
            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">Delete Ad?</h3>
                        <p className="text-gray-500 text-center mb-8">This action cannot be undone. All views and leads will be lost.</p>
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeletingId(null)}>Cancel</Button>
                            <Button variant="secondary" className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white border-none"
                                isLoading={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(deletingId)}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage, edit and boost your ads performance.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl font-bold border-2">Pending ({myAds?.filter(a => a.status === 'pending').length || 0})</Button>
                    <Button variant="ghost" size="sm" className="rounded-xl font-bold">Closed ({myAds?.filter(a => a.status === 'closed').length || 0})</Button>
                </div>
            </div>

            <div className="space-y-4 min-h-[400px]">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                    </div>
                ) : myAds?.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No active ads yet</h3>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">You haven't posted any items for sale. Start now and make some cash!</p>
                        <Link to="/post-ad">
                            <Button className="rounded-xl px-8">Post Your First Ad</Button>
                        </Link>
                    </div>
                ) : (
                    myAds?.map((ad: Listing) => (
                        <div key={ad.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="w-full md:w-32 aspect-video md:aspect-square rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                <img src={getImageUrl(ad.images?.[0])} alt="" className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                        ad.status === 'active' ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                                    )}>{ad.status}</span>
                                    <span className="text-xs text-gray-400">• Posted recently</span>
                                </div>
                                <h3 className="font-bold text-gray-900 truncate mb-1">{ad.title}</h3>
                                <p className="text-primary-600 font-bold mb-2">{ad.currency} {ad.price.toLocaleString()}</p>

                                <div className="flex items-center gap-6 text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>342 Views</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        <span>24 Leads</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-auto flex md:flex-col gap-2 shrink-0">
                                <Button
                                    size="sm"
                                    className="flex-1 md:w-32 rounded-lg gap-2"
                                    onClick={() => navigate(`/promote/${ad.id}`)}
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    {ad.boost_level && ad.boost_level > 0 ? 'Upgrade' : 'Boost Ad'}
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-lg"
                                        onClick={() => navigate(`/edit-ad/${ad.id}`)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-lg text-red-500 hover:bg-red-50 hover:border-red-100"
                                        onClick={() => setDeletingId(ad.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Analytics Card */}
            <div className="mt-12 bg-gray-900 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-600/20 blur-3xl rounded-full translate-x-1/2 translate-y-1/2"></div>
                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Grow your sales with Suqafuran Premium</h3>
                        <p className="text-gray-400 mb-6">Promoted ads get 10x more reach and 5x more messages from serious buyers.</p>
                        <Button variant="secondary" className="rounded-xl px-10">Upgrade to Premium</Button>
                    </div>
                    <div className="flex justify-end order-first md:order-last">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full max-w-xs">
                            <div className="flex justify-between items-end mb-6">
                                <div className="space-y-4 flex flex-col">
                                    <div className="h-10 w-2 bg-blue-300 rounded-full"></div>
                                    <div className="h-16 w-2 bg-secondary-500 rounded-full"></div>
                                    <div className="h-8 w-2 bg-blue-300 rounded-full"></div>
                                    <div className="h-12 w-2 bg-white/20 rounded-full"></div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Total Views</p>
                                    <p className="text-3xl font-bold text-white">4.2k</p>
                                    <p className="text-[10px] text-green-400 mt-1 uppercase font-bold">+12% this week</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { MyAdsPage };
