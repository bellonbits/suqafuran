import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { favoriteService } from '../services/favoriteService';
import {
    Heart, MapPin,
    Trash2, Loader2, ArrowRight
} from 'lucide-react';
import { Button } from '../components/Button';
import type { Listing } from '../types/listing';

const FavoritesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: favorites, isLoading } = useQuery<Listing[]>({
        queryKey: ['favorites'],
        queryFn: favoriteService.getMyFavorites,
    });

    const removeMutation = useMutation({
        mutationFn: (id: number) => favoriteService.removeFavorite(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Saved Ads</h1>
                <p className="text-sm text-gray-500 mt-1">Keep track of the items you're interested in.</p>
            </div>

            <div className="space-y-4 min-h-[400px]">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                    </div>
                ) : favorites?.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <Heart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No saved ads yet</h3>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">Tap the heart icon on any ad to save it here for later.</p>
                        <Link to="/">
                            <Button variant="outline" className="rounded-xl px-8 border-2">Explore Ads</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites?.map((ad: Listing) => (
                            <div key={ad.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:border-primary-100 transition-all duration-300">
                                <div className="relative aspect-video overflow-hidden">
                                    <img
                                        src={ad.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=300'}
                                        alt={ad.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <button
                                        onClick={() => ad.id && removeMutation.mutate(ad.id)}
                                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-50 text-primary-600">{ad.condition}</span>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <MapPin className="h-3 w-3" />
                                            <span>{ad.location}</span>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-900 truncate mb-1 group-hover:text-primary-600 transition-colors">{ad.title}</h3>
                                    <p className="text-lg font-black text-primary-600 mb-4">KES {ad.price.toLocaleString()}</p>

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <Link to={`/ad/${ad.id}`}>
                                            <Button variant="ghost" size="sm" className="rounded-lg gap-2 text-primary-600 hover:bg-primary-50">
                                                View Details
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export { FavoritesPage };
