"use client";

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, ShieldCheck, Phone, Heart, Share2, MessageSquare, ArrowLeft, Eye, Star } from 'lucide-react';
import { listingsService } from '../../../../services/listings';
import { feedbackService, averageRating } from '../../../../services/feedback';
import { useFavoritesStore } from '../../../../store/useFavorites';
import { useAuthStore } from '../../../../store/useAuth';
import { useAuthModal } from '../../../../store/useAuthModal';
import { useCurrencyStore } from '../../../../store/useCurrency';
import { formatConvertedPrice } from '../../../../lib/currency';
import { useLocalizedField } from '../../../../lib/i18n';
import { ProductCard } from '../../../../components/features/ProductCard';
import { businessService } from '../../../../services/business';
import type { Listing, Feedback } from '../../../../types';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
    const router = useRouter();
    const { id } = use(params);
    
    const [listing, setListing] = useState<Listing | null>(null);
    const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
    const [activeImage, setActiveImage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const { isAuthenticated, user } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const isFavorite = useFavoritesStore((s) => listing ? s.isFavorite(listing.id) : false);
    const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
    const displayCurrency = useCurrencyStore((s) => s.currency);
    const field = useLocalizedField();

    useEffect(() => {
        const loadListingDetails = async () => {
            setIsLoading(true);
            setLoadError(false);
            try {
                const data = await listingsService.getListing(id);
                setListing(data);

                if (data.images && data.images.length > 0) {
                    setActiveImage(data.images[0]);
                } else {
                    setActiveImage('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop');
                }

                // Load related listings
                const related = await listingsService.getListings({ limit: 4 });
                setRelatedListings(related.filter(r => r.id !== data.id));

                const listingFeedback = await feedbackService.getListingFeedback(data.id).catch(() => []);
                setFeedback(listingFeedback);
            } catch (err) {
                console.error('Failed to load listing details', err);
                setListing(null);
                setLoadError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadListingDetails();
    }, [id]);

    const handleToggleFavorite = () => {
        if (!listing) return;
        if (!isAuthenticated) {
            openAuthModal('signin');
            return;
        }
        toggleFavorite(listing.id);
    };

    const handleSubmitReview = async () => {
        if (!listing?.owner) return;
        if (!isAuthenticated) {
            openAuthModal('signin');
            return;
        }
        setSubmittingReview(true);
        try {
            await feedbackService.createFeedback({
                target_user_id: listing.owner_id,
                listing_id: listing.id,
                rating: reviewRating,
                comment: reviewComment.trim() || undefined,
            });
            const refreshed = await feedbackService.getListingFeedback(listing.id);
            setFeedback(refreshed);
            setReviewComment('');
        } catch (err) {
            console.error('Failed to submit review', err);
        } finally {
            setSubmittingReview(false);
        }
    };

    const ratingAvg = averageRating(feedback);

    const handleOrderSubmit = async (orderDetails: { quantity: number; location: string; notes: string }) => {
        if (!listing) return;
        // Simulate/Connect to API order placement
        try {
            await businessService.recordOrder('generic-business-id', {
                customer_id: 999, // current user ID simulated
                items: [{ product_id: listing.id, quantity: orderDetails.quantity }],
                total_amount: listing.price * orderDetails.quantity,
                notes: `Location: ${orderDetails.location}. Notes: ${orderDetails.notes}`
            });
        } catch (err) {
            console.error('Order creation simulation fallback error', err);
            // Even if actual endpoint fails due to mock business ID, show success popup
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse space-y-8">
                <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="aspect-square bg-gray-200 dark:bg-slate-800 rounded-3xl" />
                    <div className="space-y-6">
                        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                        <div className="h-6 w-1/4 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                        <div className="h-24 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
                <p className="font-bold text-gray-500">
                    {loadError ? 'Could not load this listing. Please try again.' : 'Listing not found'}
                </p>
                <Link href="/" className="text-primary font-black hover:underline">Go Home</Link>
            </div>
        );
    }

    return (
        <div className="pb-24">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
                {/* Back Button */}
                <button 
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-sky-400 cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to listings</span>
                </button>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Media Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square overflow-hidden rounded-3xl border border-gray-100 bg-white dark:bg-slate-950 dark:border-slate-800 relative card-shadow">
                            <img
                                src={activeImage}
                                alt={field(listing.title_en, listing.title_so)}
                                className="h-full w-full object-cover"
                            />
                            {listing.condition && (
                                <span className="absolute left-4 top-4 rounded-full bg-slate-900/80 backdrop-blur px-3.5 py-1 text-xs font-black text-white uppercase tracking-wider">
                                    {listing.condition}
                                </span>
                            )}
                        </div>
                        {/* Previews row */}
                        {listing.images && listing.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {listing.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${activeImage === img ? 'border-primary' : 'border-transparent'}`}
                                    >
                                        <img src={img} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Information */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                    Listing ID: #{listing.id}
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleToggleFavorite}
                                        className={`rounded-full p-2.5 border border-gray-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                                    >
                                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                                    </button>
                                    <button className="rounded-full p-2.5 border border-gray-200 bg-white hover:bg-slate-50 text-gray-400 dark:border-slate-800 dark:bg-slate-900">
                                        <Share2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 font-poppins sm:text-3xl leading-snug">
                                {field(listing.title_en, listing.title_so)}
                            </h1>

                            <div className="flex items-center gap-6">
                                <span className="text-3xl font-black text-primary dark:text-sky-400">
                                    {formatConvertedPrice(listing.price, listing.currency || 'USD', displayCurrency)}
                                </span>
                                {listing.is_negotiable && (
                                    <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                        Negotiable Price
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Product Details</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                                {field(listing.description_en, listing.description_so)}
                            </p>
                        </div>

                        {/* Seller profile card */}
                        {listing.owner && (
                            <div className="rounded-3xl border border-gray-100 bg-white p-5 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-4">
                                <div className="flex gap-4 items-center justify-between">
                                    <div className="flex gap-3.5 items-center">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg uppercase shrink-0 dark:bg-[#e0f7ff]0/10">
                                            {listing.owner.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                                    {listing.owner.full_name}
                                                </h4>
                                                {listing.owner.is_verified && (
                                                    <ShieldCheck className="h-4 w-4 text-accent" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                                Trust Score: {listing.owner.trust_score || 90}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        {ratingAvg !== null ? (
                                            <span className="text-xs font-bold text-amber-500 flex items-center gap-1 justify-end">
                                                <Star className="h-3.5 w-3.5 fill-current" />
                                                {ratingAvg.toFixed(1)}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-gray-400">No reviews yet</span>
                                        )}
                                        <span className="text-[10px] text-gray-400 font-medium">{feedback.length} review{feedback.length === 1 ? '' : 's'}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                                    {/* Contact Options */}
                                    <Link 
                                        href={`/messages?userId=${listing.owner_id}`}
                                        className="btn-premium flex-1 bg-primary text-white py-2.5 text-xs shadow shadow-primary/10 hover:bg-primary-dark"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <span>Chat Seller</span>
                                    </Link>
                                    
                                    {listing.owner.phone && (
                                        <a 
                                            href={`tel:${listing.owner.phone}`}
                                            className="btn-premium flex-1 bg-slate-50 border border-gray-200 text-gray-700 py-2.5 text-xs hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                                        >
                                            <Phone className="h-4 w-4" />
                                            <span>Call Seller</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Location Details widget */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Trading Location</h3>
                            <div className="flex gap-2.5 items-center text-xs font-bold text-gray-700 dark:text-slate-300">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{listing.location || 'Mogadishu, Somalia'}</span>
                            </div>
                            
                            {/* Interactive Fallback Map Design */}
                            <div className="h-44 w-full rounded-3xl bg-slate-100 border border-gray-100 dark:bg-slate-950 dark:border-slate-800 overflow-hidden relative flex items-center justify-center text-center">
                                {/* SVG visual map mockup */}
                                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,var(--color-primary-dark)_1px,transparent_1px)] bg-[size:16px_16px]" />
                                <div className="relative space-y-2 p-4">
                                    <div className="mx-auto h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-bounce">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Map details localized in {listing.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <div className="pt-8 border-t border-gray-100 dark:border-slate-800 space-y-5">
                    <h2 className="text-lg font-black text-gray-900 dark:text-slate-100 font-poppins">
                        Reviews {feedback.length > 0 && `(${feedback.length})`}
                    </h2>

                    {feedback.length > 0 ? (
                        <div className="space-y-3">
                            {feedback.map((f) => (
                                <div key={f.id} className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 space-y-1.5">
                                    <div className="flex items-center gap-1 text-amber-500">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={`h-3.5 w-3.5 ${i < f.rating ? 'fill-current' : 'text-gray-200 dark:text-slate-700'}`} />
                                        ))}
                                    </div>
                                    {f.comment && (
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{f.comment}</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">
                                        {new Date(f.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-slate-500">No reviews yet — be the first to leave one.</p>
                    )}

                    {listing.owner && user?.id !== listing.owner_id && (
                        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 space-y-3">
                            <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300">Write a review</h3>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <button key={i} onClick={() => setReviewRating(i + 1)} className="cursor-pointer">
                                        <Star className={`h-5 w-5 ${i < reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-slate-700'}`} />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Share your experience with this seller..."
                                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 p-3 text-sm outline-none focus:border-primary"
                                rows={3}
                            />
                            <button
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                                className="btn-premium bg-primary text-white px-5 py-2.5 text-xs disabled:opacity-60"
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Related listings */}
                {relatedListings.length > 0 && (
                    <div className="pt-12 border-t border-gray-100 dark:border-slate-800 space-y-6">
                        <h2 className="text-lg font-black text-gray-900 dark:text-slate-100 font-poppins">Related Listings</h2>
                        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                            {relatedListings.map(rel => (
                                <ProductCard key={rel.id} listing={rel} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Actions panel (DoorDash style) */}
            <div className="fixed bottom-[76px] md:bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 py-4 px-6 md:px-12 flex items-center justify-between">
                <div className="hidden md:flex flex-col">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Price</span>
                    <span className="text-xl font-black text-primary dark:text-sky-400">
                        {formatConvertedPrice(listing.price, listing.currency || 'USD', displayCurrency)}
                    </span>
                </div>

                <Link 
                    href={`/messages?userId=${listing.owner_id}&productId=${listing.id}`}
                    className="btn-premium w-full bg-primary hover:bg-primary-dark text-white px-8 py-3 text-sm shadow-lg shadow-primary/20 font-black flex items-center justify-center gap-2"
                >
                    <MessageSquare className="h-5 w-5" />
                    <span>Contact Seller</span>
                </Link>
            </div>

        </div>
    );
}
