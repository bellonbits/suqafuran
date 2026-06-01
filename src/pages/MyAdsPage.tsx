import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { listingService } from '../services/listingService';
import { getImageUrl } from '../utils/imageUtils';
import {
    AlertTriangle, X, PlusCircle,
    Eye, Loader2, ShoppingBag, CheckCircle, HelpCircle
} from 'lucide-react';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { useLanguageField } from '../hooks/useLanguageField';
import type { Listing } from '../types/listing';

const MyAdsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { getField } = useLanguageField();
    const [deletingId, setDeletingId] = React.useState<number | null>(null);

    // "Was it sold?" modal state
    const [soldModal, setSoldModal] = React.useState<{ listingId: number; action: 'delete' | 'close' } | null>(null);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['my-listings'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    };

    const { data: myAds, isLoading } = useQuery<Listing[]>({
        queryKey: ['my-listings'],
        queryFn: listingService.getMyListings,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => listingService.deleteListing(id),
        onSuccess: () => { invalidate(); setDeletingId(null); },
    });

    const markAsSoldMutation = useMutation({
        mutationFn: ({ id, via }: { id: number; via: string }) =>
            listingService.patchListing(id, { is_sold: true, sold_via: via, status: 'sold' }),
        onSuccess: () => invalidate(),
    });

    const markNotSoldDeleteMutation = useMutation({
        mutationFn: (id: number) => listingService.patchListing(id, { is_sold: false, status: 'closed' }),
        onSuccess: () => invalidate(),
    });

    // Called when seller clicks Delete or Close on an active listing
    const promptSoldCheck = (listingId: number) => {
        setSoldModal({ listingId, action: 'delete' });
    };

    const handleSoldAnswer = (wasSold: boolean, via?: string) => {
        if (!soldModal) return;
        const { listingId } = soldModal;
        if (wasSold) {
            markAsSoldMutation.mutate({ id: listingId, via: via || 'platform' });
        } else {
            if (soldModal.action === 'delete') {
                deleteMutation.mutate(listingId);
            } else {
                markNotSoldDeleteMutation.mutate(listingId);
            }
        }
        setSoldModal(null);
    };

    const [filter, setFilter] = React.useState<'all' | 'active' | 'pending' | 'declined' | 'sold'>('all');

    const filteredAds = myAds?.filter(ad => {
        if (filter === 'all') return true;
        if (filter === 'active') return ad.status === 'active';
        if (filter === 'pending') return ad.status === 'pending';
        if (filter === 'declined') return ad.status === 'reported';
        if (filter === 'sold') return ad.status === 'closed' || ad.status === 'sold';
        return true;
    });

    const declinedCount = myAds?.filter(a => a.status === 'reported').length || 0;

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">{t('myads.deleteTitle')}</h3>
                        <p className="text-gray-500 text-center mb-8">{t('myads.deleteDesc')}</p>
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeletingId(null)}>{t('common.cancel')}</Button>
                            <Button variant="secondary" className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white border-none"
                                isLoading={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(deletingId)}>{t('common.delete')}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Jiji-style Alerts Banner */}
            {declinedCount > 0 && (
                <div className="bg-orange-500 rounded-xl p-4 text-white flex items-center gap-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 cursor-pointer" onClick={() => {}}>
                        <X className="h-4 w-4" />
                    </div>
                    <div className="w-2 h-2 rounded-full bg-red-600 border border-white shrink-0 animate-pulse" />
                    <div className="flex-1 text-sm">
                        <span className="font-bold">{declinedCount} your ad was declined!</span>
                        <Link to={`/edit-ad/${myAds?.find(a => a.status === 'reported')?.id}`} className="ml-2 underline font-medium hover:text-white/80">
                            Click here to edit Ad.
                        </Link>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl p-2 md:p-4 border border-gray-100 shadow-sm">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                        <h1 className="text-xl font-bold text-gray-900">My adverts</h1>
                        <Link to="/post-ad" className="md:hidden">
                            <Button size="sm" className="rounded-xl h-8 text-[10px] uppercase tracking-wider font-bold">Post Ad</Button>
                        </Link>
                    </div>

                    {/* Status Filters */}
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            <button
                                onClick={() => setFilter('all')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                                    filter === 'all' ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:text-gray-600"
                                )}>
                                All listings ({myAds?.length || 0})
                            </button>
                            <button
                                onClick={() => setFilter('active')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                                    filter === 'active' ? "bg-green-50 text-green-600" : "text-gray-400 hover:text-gray-600"
                                )}>
                                <ShoppingBag className="h-4 w-4" />
                                Active ({myAds?.filter(a => a.status === 'active').length || 0})
                            </button>
                            <button
                                onClick={() => setFilter('declined')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                                    filter === 'declined' ? "bg-red-50 text-red-600" : "text-gray-400 hover:text-gray-600"
                                )}>
                                <AlertTriangle className="h-4 w-4" />
                                <span className="flex items-center gap-1">
                                    <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">{declinedCount}</span>
                                    Declined
                                </span>
                            </button>
                            <button
                                onClick={() => setFilter('sold')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                                    filter === 'sold' ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"
                                )}>
                                <CheckCircle className="h-4 w-4" />
                                Sold ({myAds?.filter(a => a.status === 'sold' || a.status === 'closed').length || 0})
                            </button>
                        </div>

                        {/* Category Dropdown (Jiji Style) */}
                        <div className="flex justify-start">
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                                <span>Category</span>
                                <PlusCircle className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Ad Grid/List */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                            </div>
                        ) : filteredAds?.length === 0 ? (
                            <div className="py-20 text-center">
                                <ShoppingBag className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-400">No ads found in this category</h3>
                                <p className="text-gray-300 text-sm">Post a new ad to start selling</p>
                            </div>
                        ) : (
                            filteredAds?.map((ad: Listing) => (
                                <div key={ad.id} className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all p-3 md:p-4">
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden shrink-0 relative bg-gray-50 border border-gray-50">
                                            <img src={getImageUrl(ad.images?.[0])} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <span>{ad.images?.length || 0}</span>
                                                <Eye className="h-3 w-3" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col h-full">
                                                <div className="mb-1">
                                                    <p className="text-lg font-bold text-gray-900 leading-tight">
                                                        {ad.currency} {ad.price.toLocaleString()}
                                                    </p>
                                                    <h3 className="text-sm text-gray-800 font-medium truncate group-hover:text-primary-600 transition-colors">
                                                        {getField(ad, 'title')}
                                                    </h3>
                                                </div>

                                                <div className="mt-auto space-y-1">
                                                    {ad.status === 'reported' && (
                                                        <div className="flex flex-wrap gap-1">
                                                            <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
                                                                Declined: correct 1 mistake
                                                            </div>
                                                            {ad.rejection_reason && (
                                                                <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-pink-50 text-pink-500 text-[10px] font-bold border border-pink-100">
                                                                    {ad.rejection_reason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {ad.status === 'active' && (
                                                        <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-bold border border-green-100">
                                                            Active
                                                        </div>
                                                    )}
                                                    {ad.status === 'pending' && (
                                                        <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100">
                                                            Under Review
                                                        </div>
                                                    )}
                                                    {ad.status === 'sold' && (
                                                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-bold border border-green-100">
                                                            <CheckCircle className="h-3 w-3" /> Sold
                                                        </div>
                                                    )}
                                                    {ad.status === 'closed' && (
                                                        <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200">
                                                            Closed
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2">
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => navigate(`/edit-ad/${ad.id}`)}
                                                            className="text-primary-600 text-xs font-bold hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (ad.status === 'active') {
                                                                    promptSoldCheck(ad.id);
                                                                } else {
                                                                    setDeletingId(ad.id);
                                                                }
                                                            }}
                                                            className="text-red-500 text-xs font-bold hover:underline"
                                                        >
                                                            Delete
                                                        </button>
                                                        {ad.status === 'active' && (
                                                            <button
                                                                onClick={() => promptSoldCheck(ad.id)}
                                                                className="text-green-600 text-xs font-bold hover:underline flex items-center gap-1"
                                                            >
                                                                <CheckCircle className="h-3 w-3" />
                                                                Mark as Sold
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Upsell - Jiji Style */}
            <div className="bg-gray-900 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-lg font-bold text-white mb-1">Increase your sales with Premium Services!</h3>
                        <p className="text-gray-400 text-xs">Diamond, VIP and Top-ad plans to boost your visibility by up to 100x.</p>
                    </div>
                    <Button variant="secondary" className="rounded-xl px-8 font-bold whitespace-nowrap shadow-lg shadow-primary-900/50 grow-0 h-10 text-xs">
                        Show plans
                    </Button>
                </div>
            </div>
        </div>

        {/* ── "Was it sold?" Modal ── */}
        {soldModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 mx-auto mb-4">
                        <HelpCircle className="w-7 h-7 text-amber-500" />
                    </div>
                    <h3 className="text-base font-black text-gray-900 text-center mb-1">Was this item sold?</h3>
                    <p className="text-xs text-gray-500 text-center mb-5">
                        This helps us track sales. Please let us know how the sale went.
                    </p>

                    <div className="space-y-2 mb-4">
                        <button
                            onClick={() => handleSoldAnswer(true, 'platform')}
                            className="w-full py-3 px-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-bold hover:bg-green-100 active:scale-95 transition-all text-left flex items-center gap-3"
                        >
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            Yes — sold through Suqafuran
                        </button>
                        <button
                            onClick={() => handleSoldAnswer(true, 'external')}
                            className="w-full py-3 px-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold hover:bg-blue-100 active:scale-95 transition-all text-left flex items-center gap-3"
                        >
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            Yes — sold outside the platform
                        </button>
                        <button
                            onClick={() => handleSoldAnswer(false)}
                            className="w-full py-3 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-100 active:scale-95 transition-all text-left flex items-center gap-3"
                        >
                            <X className="h-4 w-4 shrink-0" />
                            No — just removing the listing
                        </button>
                    </div>

                    <button
                        onClick={() => setSoldModal(null)}
                        className="w-full text-xs text-gray-400 hover:text-gray-600 font-medium py-1"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}
    );
};


export { MyAdsPage };
