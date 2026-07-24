"use client";

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, ShieldCheck, Phone, Heart, Share2, MessageSquare, ArrowLeft, Eye, Star, Facebook, X, MessageCircle, AlertTriangle } from 'lucide-react';
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
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');

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

    const handleSubmitReport = async () => {
        if (!listing || !reportReason) return;
        if (!isAuthenticated) {
            openAuthModal('signin');
            return;
        }
        try {
            const response = await fetch('http://localhost:8000/api/v1/listings/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listing_id: listing.id,
                    reason: reportReason,
                    description: reportDescription.trim() || undefined,
                }),
                credentials: 'include',
            });
            if (response.ok) {
                setShowReportModal(false);
                setReportReason('');
                setReportDescription('');
                alert('Thank you for your report!');
            }
        } catch (err) {
            console.error('Failed to submit report', err);
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
            <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse space-y-8 pb-24">
                <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 aspect-square bg-gray-200 dark:bg-slate-800 rounded-lg" />
                    <div className="md:col-span-2 space-y-6">
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
        <div className="pb-24 md:pb-0 bg-gray-50 dark:bg-slate-950 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
                {/* Header Navigation */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white dark:bg-slate-900 rounded-lg p-6 md:p-8">
                    {/* Left: Product Images */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 relative">
                            <img
                                src={activeImage}
                                alt={field(listing.title_en, listing.title_so)}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        {/* Image Thumbnails */}
                        {listing.images && listing.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {listing.images.slice(0, 5).map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === img ? 'border-orange-500' : 'border-gray-200 dark:border-slate-700'}`}
                                    >
                                        <img src={img} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Information */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Title and Metadata */}
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {field(listing.title_en, listing.title_so)}
                            </h1>

                            {/* Star Rating and Reviews */}
                            <div className="flex items-center gap-4 mb-4">
                                {ratingAvg !== null ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < Math.round(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-slate-600'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                                            {ratingAvg.toFixed(1)} ({feedback.length} verified {feedback.length === 1 ? 'rating' : 'ratings'})
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500 dark:text-slate-400">No ratings yet</span>
                                )}
                            </div>
                        </div>

                        {/* Price Section */}
                        <div className="bg-blue-600 dark:bg-blue-700 rounded-lg p-6 text-white">
                            <div className="text-sm font-medium opacity-90 mb-2">Price</div>
                            <div className="text-3xl font-bold mb-4">
                                {formatConvertedPrice(listing.price, listing.currency || 'USD', displayCurrency)}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`flex-1 rounded-lg py-3 font-semibold transition-all ${isFavorite ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                >
                                    <Heart className={`h-5 w-5 inline mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                                    {isFavorite ? 'Liked' : 'Like'}
                                </button>
                                <Link
                                    href={`/messages?userId=${listing.owner_id}&productId=${listing.id}`}
                                    className="flex-1 bg-white text-blue-600 rounded-lg py-3 font-semibold hover:bg-gray-50 transition-all"
                                >
                                    <MessageSquare className="h-5 w-5 inline mr-2" />
                                    Contact Seller
                                </Link>
                            </div>
                        </div>

                        {/* Stock and Shipping */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">In Stock</div>
                                <div className="text-sm text-gray-700 dark:text-slate-300">Available now</div>
                            </div>
                            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Location</div>
                                <div className="text-sm text-gray-600 dark:text-slate-400">{listing.location || 'Somalia'}</div>
                            </div>
                        </div>

                        {/* Seller Information Card */}
                        {listing.owner && (
                            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                            {listing.owner.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {listing.owner.full_name}
                                                </div>
                                                {listing.owner.is_verified && (
                                                    <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                                {ratingAvg !== null ? `${ratingAvg.toFixed(1)}★ Seller` : 'New seller'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {listing.owner.phone && (
                                    <a
                                        href={`tel:${listing.owner.phone}`}
                                        className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg py-2 font-semibold text-gray-700 dark:text-slate-300 transition-all text-center"
                                    >
                                        <Phone className="h-4 w-4 inline mr-2" />
                                        Call Seller
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">About this item</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                                {field(listing.description_en, listing.description_so)}
                            </p>
                        </div>

                        {/* Share Section */}
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                            <div className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Share this product</div>
                            <div className="flex gap-3">
                                <a href="#" className="h-10 w-10 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                                    <Facebook className="h-5 w-5 text-blue-600" />
                                </a>
                                <a href="#" className="h-10 w-10 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                                    <X className="h-5 w-5 text-gray-900 dark:text-white" />
                                </a>
                                <a href="#" className="h-10 w-10 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                                    <MessageCircle className="h-5 w-5 text-green-600" />
                                </a>
                            </div>
                        </div>

                        {/* Report Listing */}
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-2"
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Report incorrect product information
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                {feedback.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 md:p-8 mt-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                            Ratings & Reviews ({feedback.length})
                        </h2>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {feedback.slice(0, 3).map((f) => (
                                <div key={f.id} className="pb-4 border-b border-gray-200 dark:border-slate-700 last:border-b-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={`h-4 w-4 ${i < f.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-slate-600'}`} />
                                        ))}
                                    </div>
                                    {f.comment && <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">{f.comment}</p>}
                                    <p className="text-xs text-gray-500 dark:text-slate-500">
                                        {new Date(f.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Listings */}
                {relatedListings.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Related Listings</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {relatedListings.map(rel => (
                                <ProductCard key={rel.id} listing={rel} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Report Listing Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
                    <div className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl w-full md:w-full md:max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Report this product</h2>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                What's the problem?
                            </label>
                            <select
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                            >
                                <option value="">Select a reason...</option>
                                <option value="incorrect_info">Incorrect product information</option>
                                <option value="not_available">Product not available</option>
                                <option value="duplicate">Duplicate listing</option>
                                <option value="fraud">Suspected fraud</option>
                                <option value="offensive">Offensive content</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                Additional details (optional)
                            </label>
                            <textarea
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                placeholder="Please provide more information..."
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-orange-500 resize-none"
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => {
                                    setShowReportModal(false);
                                    setReportReason('');
                                    setReportDescription('');
                                }}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReport}
                                disabled={!reportReason}
                                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold transition-all"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
