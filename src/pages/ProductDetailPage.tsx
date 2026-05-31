import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { translateTexts } from '../services/translateService';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Spin } from 'antd';
import { PublicLayout } from '../layouts/PublicLayout';
import { listingService } from '../services/listingService';
import { interactionService, InteractionType } from '../services/interactionService';
import { followsService } from '../services/followsService';
import { feedbackService } from '../services/feedbackService';
import {
    Phone, Heart,
    MapPin, Clock, ShieldCheck, Flag,
    ChevronLeft, ChevronRight, Navigation,
    MoreVertical, Camera, ChevronDown, ChevronUp, MessageCircle,
    Share2, PhoneCall, AlertTriangle, XCircle, UserPlus, UserCheck, Star, User, Zap, Trash2, Loader2, CheckCircle, BadgeCheck, ShoppingBag
} from 'lucide-react';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import { Capacitor } from '@capacitor/core';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { formatConvertedPrice } from '../utils/currencyUtils';
import { useLanguageField } from '../hooks/useLanguageField';
import type { Listing } from '../types/listing';
import { favoriteService } from '../services/favoriteService';

const WA_ICON = (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const ProductDetailPage: React.FC = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { getField } = useLanguageField();
    const { user } = useAuthStore();
    const [showPhone, setShowPhone] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDesc, setReportDesc] = useState('');
    const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
    const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isTranslated, setIsTranslated] = useState(false);
    const queryClient = useQueryClient();

    const markAsSoldMutation = useMutation({
        mutationFn: (id: number) => listingService.patchListing(id, { status: 'sold' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
            queryClient.invalidateQueries({ queryKey: ['listings'] });
        },
    });

    const reportMutation = useMutation({
        mutationFn: ({ listing_id, reason, description }: { listing_id: number; reason: string; description: string }) =>
            api.post('/trust_ops/reports', { listing_id, reason, description }),
        onSuccess: () => {
            setShowReportModal(false);
            setReportReason('');
            setReportDesc('');
        },
    });

    const submitFeedbackMutation = useMutation({
        mutationFn: ({ target_user_id, listing_id, rating, comment }: any) =>
            feedbackService.submitFeedback({ target_user_id, listing_id, rating, comment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-feedback', ad?.owner_id] });
            setShowFeedbackModal(false);
            setFeedbackRating(0);
            setFeedbackComment('');
        },
    });

    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');

    // Use cached listing from the home/search page as instant placeholder
    const id = Number(listingId);
    const cachedListing =
        queryClient.getQueryData<Listing[]>(['featured-ads'])?.find(l => l.id === id)
        ?? queryClient.getQueryData<Listing[]>(['listings'])?.find(l => l.id === id)
        ?? (() => {
            // Also search any category/search page caches
            const allCaches = queryClient.getQueriesData<Listing[]>({ queryKey: ['listings'] });
            for (const [, data] of allCaches) {
                const found = data?.find(l => l.id === id);
                if (found) return found;
            }
            return undefined;
        })();

    const { data: ad, isLoading, isSuccess } = useQuery<Listing>({
        queryKey: ['listing', listingId],
        queryFn: () => listingService.getListing(id),
        enabled: !!listingId,
        retry: false,
        staleTime: 60_000,
        placeholderData: cachedListing,
    });

    const { data: relatedAds } = useQuery<Listing[]>({
        queryKey: ['related-listings', ad?.category_id],
        queryFn: () => listingService.getListings({ limit: 6, category_id: ad?.category_id }),
        enabled: !!ad?.category_id,
        staleTime: 5 * 60 * 1000,
    });

    const { data: followStats } = useQuery({
        queryKey: ['follow-stats', ad?.owner_id],
        queryFn: () => followsService.getFollowStats(ad!.owner_id),
        enabled: !!ad?.owner_id && !!user,
    });

    const { data: feedback } = useQuery({
        queryKey: ['seller-feedback', ad?.owner_id],
        queryFn: () => feedbackService.getUserFeedback(ad!.owner_id),
        enabled: !!ad?.owner_id,
    });

    const followMutation = useMutation({
        mutationFn: () => followsService.followUser(ad!.owner_id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follow-stats', ad?.owner_id] }),
    });

    const unfollowMutation = useMutation({
        mutationFn: () => followsService.unfollowUser(ad!.owner_id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follow-stats', ad?.owner_id] }),
    });

    const { data: favorites } = useQuery<Listing[]>({
        queryKey: ['favorites'],
        queryFn: favoriteService.getMyFavorites,
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
    });

    const isFavorite = favorites?.some((fav: any) => fav.id === id) ?? false;

    const toggleFavoriteMutation = useMutation({
        mutationFn: async () => {
            if (!user) {
                navigate('/login');
                return;
            }
            if (isFavorite) {
                await favoriteService.removeFavorite(id);
            } else {
                await favoriteService.addFavorite(id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });

    const avgRating = feedback?.length 
        ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1) 
        : null;

    const deleteMutation = useMutation({
        mutationFn: (id: number) => listingService.deleteListing(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['listings'] });
            queryClient.invalidateQueries({ queryKey: ['featured-ads'] });
            navigate('/', { replace: true });
        },
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const displayRelatedAds = relatedAds || [];
    const { currency: targetCurrency, setCurrency } = useCurrencyStore();

    const rawTitle = ad ? getField(ad, 'title') : '';
    const rawDesc = ad ? getField(ad, 'description') : '';

    const effectiveTitle = translatedTitle ?? rawTitle;
    const effectiveDesc = translatedDesc ?? rawDesc;

    // Auto-translate when language switches to Somali; clears when switching back to English.
    useEffect(() => {
        if (!ad) return;
        if (i18n.language !== 'so' || ad.title_so) {
            setTranslatedTitle(null);
            setTranslatedDesc(null);
            setIsTranslated(false);
            setIsTranslating(false);
            return;
        }
        let cancelled = false;
        setIsTranslating(true);
        const texts: string[] = [ad.title_en];
        if (ad.description_en) texts.push(ad.description_en);
        translateTexts(texts, 'so')
            .then(results => {
                if (cancelled) return;
                setTranslatedTitle(results[0] ?? null);
                if (ad.description_en && results[1]) setTranslatedDesc(results[1]);
                setIsTranslated(true);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setIsTranslating(false); });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i18n.language, ad?.id]);

    // Fetch done but listing doesn't exist
    if (!isLoading && isSuccess && !ad) {
        return (
            <PublicLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('listing.notFound')}</h2>
                    <p className="text-gray-500 mb-6">{t('listing.notFoundDesc')}</p>
                    <Link to="/"><Button>{t('listing.backToMarketplace')}</Button></Link>
                </div>
            </PublicLayout>
        );
    }

    // Skeleton helpers (kept as null — loader above handles no-data state)
    const S = {
        line: (_w = 'w-full', _h = 'h-3') => null,
        box: (_cls = '') => null,
    };

    // Show full-page loader while fetching and no cached data
    if (isLoading && !ad) {
        return (
            <PublicLayout>
                <div style={{
                    minHeight: '70vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                }}>
                    <Spin size="large" />
                    <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, letterSpacing: 0.3 }}>
                        {t('listing.loading')}
                    </p>
                </div>
            </PublicLayout>
        );
    }

    const images = ad?.images && ad.images.length > 0
        ? ad.images
        : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800'];

    const isNegotiable = ad?.is_negotiable || ad?.attributes?.negotiable === 'yes' || ad?.attributes?.negotiable === true;
    const negotiationStatus = ad?.attributes?.negotiable; // 'yes', 'no', 'not_sure'
    const bulkPrice = ad?.attributes?.bulk_price;
    const bulkQty = ad?.attributes?.bulk_quantity;
    const isBoosted = (ad?.boost_level ?? 0) > 0;
    const postedDate = ad?.created_at
        ? new Date(ad.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';

    const whatsappUrl = `https://wa.me/${ad?.owner?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in: ${effectiveTitle ?? ''}`)}`;

    const attrEntries = ad?.attributes
        ? Object.entries(ad.attributes).filter(([k]) => 
            k !== 'negotiable' && 
            k !== 'kh_pin' && 
            k !== 'bulk_currency' && 
            k !== 'bulk_price' && 
            k !== 'bulk_quantity'
        )
        : [];

    const prevImage = () => setActiveImage(i => (i - 1 + images.length) % images.length);
    const nextImage = () => setActiveImage(i => (i + 1) % images.length);

    return (
        <PublicLayout>
            {/* ══════════════════════════════════════════
                MOBILE — Jiji-style layout
            ══════════════════════════════════════════ */}
            <div className="lg:hidden bg-gray-50 pb-32">

                {/* ── Full-width hero image ── */}
                <div className="relative w-full bg-black" style={{ aspectRatio: '4/3' }}>
                    <img
                        src={getImageUrl(images[activeImage], { width: 800, quality: 'auto' })}
                        alt={effectiveTitle ?? ''}
                        className="w-full h-full object-cover cursor-pointer"
                        loading="eager"
                        fetchPriority="high"
                        onClick={() => setShowFullImage(true)}
                    />

                    {/* Top nav overlay */}
                    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 pt-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                        >
                            <ChevronLeft className="h-5 w-5 text-white" />
                        </button>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => toggleFavoriteMutation.mutate()}
                                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <Heart className={cn("h-4 w-4", isFavorite ? "text-red-500 fill-red-500" : "text-white")} />
                            </button>
                            <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <MoreVertical className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Left / Right tap zones */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-0 top-0 w-1/3 h-full flex items-center justify-start pl-2 opacity-0 active:opacity-100"
                                aria-label="Previous image"
                            >
                                <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                                    <ChevronLeft className="h-5 w-5 text-white" />
                                </div>
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-0 top-0 w-1/3 h-full flex items-center justify-end pr-2 opacity-0 active:opacity-100"
                                aria-label="Next image"
                            >
                                <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                                    <ChevronRight className="h-5 w-5 text-white" />
                                </div>
                            </button>
                        </>
                    )}

                    {/* Photo count badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/55 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        <Camera className="h-3.5 w-3.5" />
                        {activeImage + 1}/{images.length}
                    </div>

                    {/* VIP badge */}
                    {isBoosted && (
                        <div className="absolute bottom-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
                            👑 VIP
                        </div>
                    )}

                    {/* Dot indicators */}
                    {images.length > 1 && (
                        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
                            {images.map((_: string, i: number) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'rounded-full transition-all',
                                        i === activeImage
                                            ? 'w-4 h-1.5 bg-white'
                                            : 'w-1.5 h-1.5 bg-white/50'
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="flex gap-2 px-3 py-2 bg-white overflow-x-auto border-b border-gray-100">
                        {images.map((img: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(i)}
                                className={cn(
                                    'w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all',
                                    activeImage === i ? 'border-primary-500' : 'border-transparent opacity-50'
                                )}
                            >
                                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Location + Date + VIP row ── */}
                <div className="bg-white px-4 pt-3 pb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs min-w-0">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                        {ad ? <span className="truncate">{ad.location}</span> : S.line('w-32', 'h-3')}
                        {postedDate && (
                            <>
                                <Clock className="h-3 w-3 shrink-0 ml-1" />
                                <span className="truncate">{postedDate}</span>
                            </>
                        )}
                    </div>
                    {isBoosted && (
                        <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full shrink-0">👑 VIP</span>
                    )}
                </div>

                {/* ── Title ── */}
                <div className="bg-white px-4 pb-1">
                    <div className="flex items-start justify-between gap-2">
                        {ad
                            ? <h1 className="text-[17px] font-bold text-gray-900 leading-snug">
                                {isTranslating ? <span className="opacity-50">{effectiveTitle}</span> : effectiveTitle}
                              </h1>
                            : <div className="space-y-2 py-1">{S.line('w-3/4', 'h-5')}{S.line('w-1/2', 'h-5')}</div>
                        }
                        
                        {ad && (
                            <button
                                onClick={() => {
                                    if (isTranslated) {
                                        // Revert to original
                                        setTranslatedTitle(null);
                                        setTranslatedDesc(null);
                                        setIsTranslated(false);
                                    } else {
                                        // Force translation to target language (or opposite if already in target)
                                        const targetLang = i18n.language === 'so' ? 'en' : 'so';
                                        setIsTranslating(true);
                                        const texts: string[] = [ad.title_en || ad.title_so || ''];
                                        if (ad.description_en || ad.description_so) texts.push(ad.description_en || ad.description_so || '');
                                        translateTexts(texts, targetLang)
                                            .then(results => {
                                                setTranslatedTitle(results[0] ?? null);
                                                if (texts[1] && results[1]) setTranslatedDesc(results[1]);
                                                setIsTranslated(true);
                                            })
                                            .catch(() => {})
                                            .finally(() => setIsTranslating(false));
                                    }
                                }}
                                disabled={isTranslating}
                                className="shrink-0 mt-0.5 inline-flex items-center gap-1 bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-primary-100 hover:bg-primary-100 transition-colors active:scale-95"
                            >
                                <span className="text-[12px] leading-none">🌍</span> {isTranslated ? 'Original' : 'Translate'}
                            </button>
                        )}
                    </div>
                </div>
                {/* ── Price & Negotiation ── */}
                <div className="bg-white px-4 pb-2">
                    {ad ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[22px] font-black text-secondary-500">
                                {formatConvertedPrice(ad.price, ad.currency, targetCurrency)}
                            </span>
                            {Capacitor.getPlatform() === 'ios' && (
                                <div className="inline-flex p-0.5 bg-gray-100/80 rounded-lg border border-gray-200/50 shadow-sm shrink-0 items-center">
                                    <button
                                        onClick={() => setCurrency('KES')}
                                        className={cn(
                                            "px-1.5 py-0.5 text-[9px] font-black rounded-md transition-all cursor-pointer",
                                            targetCurrency === 'KES'
                                                ? "bg-white text-secondary-500 shadow-xs"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        KES
                                    </button>
                                    <button
                                        onClick={() => setCurrency('USD')}
                                        className={cn(
                                            "px-1.5 py-0.5 text-[9px] font-black rounded-md transition-all cursor-pointer",
                                            targetCurrency === 'USD'
                                                ? "bg-white text-secondary-500 shadow-xs"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        USD
                                    </button>
                                </div>
                            )}
                            {isNegotiable && (
                                <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase tracking-wide">
                                    {t('common.negotiable')}
                                </span>
                            )}
                            {negotiationStatus === 'not_sure' && !ad?.is_negotiable && (
                                <span className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 uppercase tracking-wide">
                                    {t('listing.negotiableMaybe')}
                                </span>
                            )}
                        </div>
                    ) : S.line('w-1/3', 'h-7')}
                </div>

                {/* ── Bulk Pricing Section ── */}
                {ad && bulkPrice && bulkQty && (
                    <div className="bg-white px-4 pb-4">
                        <div className="p-3.5 bg-secondary-50 border border-secondary-100 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-secondary-500 fill-secondary-500" />
                                <span className="text-[13px] font-bold text-secondary-700">{t('listing.wholesalePriceAvailable')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider">{t('listing.minOrder')}</span>
                                    <span className="text-sm font-bold text-gray-900">{bulkQty} {t('common.units')}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider">{t('listing.pricePerUnit')}</span>
                                    <div className="text-lg font-black text-secondary-600">
                                        {formatConvertedPrice(Number(bulkPrice), ad.currency, targetCurrency)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Action buttons ── */}
                <div className="bg-white px-4 pb-5 flex gap-2 border-b border-gray-100">
                    {!ad ? (
                        <>{S.box('flex-1 h-11')}{S.box('flex-1 h-11')}{S.box('flex-1 h-11')}</>
                    ) : (
                        <>
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={async () => {
                                    try { await interactionService.logInteraction(ad.id, InteractionType.WHATSAPP); } catch {}
                                }}
                                className="flex-1 h-11 rounded-xl border-2 border-primary-500 text-primary-600 font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 transition-transform"
                            >
                                {WA_ICON} WhatsApp
                            </a>
                            <button
                                onClick={async () => {
                                    setShowPhone(true);
                                    try { await interactionService.logInteraction(ad.id, InteractionType.CALL); } catch {}
                                }}
                                className="flex-1 h-11 rounded-xl bg-primary-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 transition-transform"
                            >
                                <Phone className="h-3.5 w-3.5" />
                                {showPhone ? (ad.owner?.phone || 'N/A') : t('listing.callSeller')}
                            </button>
                            <Link
                                to={`/messages?user=${ad.owner_id}&listing=${ad.id}`}
                                className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 transition-transform"
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                                {t('listing.sendMessage')}
                            </Link>
                        </>
                    )}
                </div>

                {/* ── Chat with seller ── */}
                {ad && (
                    <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
                        <h3 className="text-[13px] font-bold text-gray-900 mb-3">{t('listing.chatWithSeller')}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {[t('listing.makeOfferMsg'), t('listing.isAvailable'), t('listing.lastPrice')].map(msg => (
                                <Link
                                    key={msg}
                                    to={`/messages?user=${ad.owner_id}&listing=${ad.id}&msg=${encodeURIComponent(msg)}`}
                                    className="px-3 py-1.5 rounded-full border border-primary-400 text-primary-600 text-xs font-semibold active:bg-primary-50 transition-colors"
                                >
                                    {msg}
                                </Link>
                            ))}
                        </div>
                        <Link
                            to={`/messages?user=${ad.owner_id}&listing=${ad.id}`}
                            className="w-full h-11 rounded-xl bg-secondary-500 text-white font-bold text-sm flex items-center justify-center"
                        >
                            {t('listing.startChat')}
                        </Link>
                    </div>
                )}

                {/* ── Condition / Key Specs row ── */}
                {ad && attrEntries.length > 0 && (
                    <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                            {attrEntries.map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                    <span className="text-[13px] font-bold text-gray-900">{String(value)}</span>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">{key.replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Description ── */}
                {effectiveDesc && (
                    <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
                        <h3 className="text-[13px] font-bold text-gray-900 mb-2">{t('listing.description')}</h3>
                        <p className={cn('text-[13px] text-gray-600 leading-relaxed', !showFullDesc && 'line-clamp-4')}>
                            {effectiveDesc}
                        </p>
                        {(effectiveDesc?.length ?? 0) > 200 && (
                            <button
                                onClick={() => setShowFullDesc(v => !v)}
                                className="mt-2 text-primary-600 text-sm font-semibold flex items-center gap-1"
                            >
                                {showFullDesc
                                    ? <>{t('listing.showLess')} <ChevronUp className="h-4 w-4" /></>
                                    : <>{t('listing.showMore')} <ChevronDown className="h-4 w-4" /></>}
                            </button>
                        )}
                    </div>
                )}

                {/* ── KH PIN ── */}
                {ad?.attributes?.kh_pin && (
                    <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                            <Navigation className="h-4 w-4 text-primary-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">{t('listing.digitalAddress')}</p>
                                <p className="text-sm font-bold text-gray-900">{ad.attributes.kh_pin}</p>
                            </div>
                            <Link to="/kh" className="text-xs font-bold text-primary-600 bg-white px-2 py-1 rounded-lg border border-primary-200">{t('listing.getPin')}</Link>
                        </div>
                    </div>
                )}

                {/* ── Admin Controls ── */}
                {user?.is_admin && ad && (
                    <div className="bg-red-50 border-y border-red-100 px-4 py-4 flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-red-700">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">{t('admin.title', 'Admin Controls')}</span>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-black shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"
                        >
                            <Trash2 className="h-4 w-4" />
                            {t('common.delete')}
                        </button>
                    </div>
                )}

                {/* ── Seller card ── */}
                <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
                    {!ad ? (
                        <div className="flex items-center gap-3 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                            <div className="flex-1 space-y-2">{S.line('w-1/2', 'h-4')}{S.line('w-1/3', 'h-3')}</div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg overflow-hidden shrink-0">
                                {ad.owner?.avatar_url
                                    ? <img src={getImageUrl(ad.owner.avatar_url)} alt="" className="w-full h-full object-cover" />
                                    : ad.owner?.full_name?.charAt(0) || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">{ad.owner?.full_name || t('listing.seller')}</p>
                                
                                <div className="flex flex-col gap-1 mt-1">
                                    {ad.owner?.is_verified && (
                                        <div className={cn(
                                            "flex items-center gap-1",
                                            (ad.owner?.verified_level as string) === 'premium' ? "text-amber-600" : "text-primary-600"
                                        )}>
                                            <BadgeCheck className={cn("h-3.5 w-3.5", (ad.owner?.verified_level as string) === 'premium' ? "fill-amber-500 text-white" : "fill-primary-500 text-white")} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">
                                                {(ad.owner?.verified_level as string) === 'premium' ? 'Premium Trusted' : 'Verified Seller'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Trust Score Progress */}
                                    <div className="w-full max-w-[120px] flex flex-col gap-1 mt-0.5">
                                        <div className="flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                            <span>Trust Score</span>
                                            <span className="text-gray-900">{(ad.owner?.trust_score || 500) / 10}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full transition-all duration-500",
                                                    (ad.owner?.trust_score || 0) > 700 ? "bg-green-500" : 
                                                    (ad.owner?.trust_score || 0) > 400 ? "bg-primary-500" : "bg-amber-500"
                                                )}
                                                style={{ width: `${(ad.owner?.trust_score || 500) / 10}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-0.5">
                                        {ad.owner?.created_at && (
                                            <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                                                <Clock className="w-2.5 h-2.5" />
                                                Joined {format(new Date(ad.owner.created_at), 'MMM yyyy')}
                                            </span>
                                        )}
                                        {avgRating && (
                                            <div className="flex items-center gap-0.5 text-amber-500">
                                                <Star className="h-2.5 w-2.5 fill-amber-500" />
                                                <span className="text-[9px] font-bold">{avgRating}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {user && user.id !== ad.owner_id && (
                                    <button
                                        onClick={() => followStats?.is_following ? unfollowMutation.mutate() : followMutation.mutate()}
                                        className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                            followStats?.is_following ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                                        )}
                                    >
                                        {followStats?.is_following ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                    </button>
                                )}
                                <Link
                                    to={`/seller/${ad.owner_id}`}
                                    className="text-xs font-bold text-primary-600 border border-primary-200 bg-primary-50 px-3 py-1.5 rounded-full shrink-0"
                                >
                                    {t('listing.viewProfile')}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Report ── */}
                {ad && (
                <div className="bg-white mt-2 px-4 py-3 border-b border-gray-100">
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Flag className="h-4 w-4" />
                        {t('listing.reportAd')}
                    </button>
                </div>
                )}

                {/* ── Safety tips ── */}
                <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-2">{t('listing.safetyTip')}</h3>
                    <ul className="text-[12px] text-gray-600 space-y-1.5 list-disc list-inside leading-relaxed">
                        <li>{t('listing.safetyTip1')}</li>
                        <li>{t('listing.safetyTip2')}</li>
                        <li>{t('listing.safetyTip3')}</li>
                        <li>{t('listing.safetyTip4')}</li>
                    </ul>
                </div>

                {/* ── Post Ad Like This ── */}
                {ad && (
                    <div className="px-4 py-4 mb-2">
                        <Link
                            to={`/post-ad?category=${ad.category_id}`}
                            className="w-full h-12 rounded-xl border-2 border-primary-500 text-primary-600 font-extrabold text-sm flex items-center justify-center tracking-wide"
                        >
                            {t('listing.postAdLikeThis')}
                        </Link>
                    </div>
                )}
            </div>

            {/* Mobile sticky bottom CTA */}
            <div 
                className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 flex gap-2 px-4 pt-3"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
                {!ad ? (
                    <div className="flex-1 flex gap-2">
                        {S.box('flex-1 h-11')}
                        {S.box('flex-1 h-11')}
                        {S.box('flex-1 h-11')}
                    </div>
                ) : (
                    <>
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={async () => {
                                try { await interactionService.logInteraction(ad.id, InteractionType.WHATSAPP); } catch {}
                            }}
                            className="flex-1 h-11 rounded-xl border-2 border-primary-500 text-primary-600 font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                            {WA_ICON} WhatsApp
                        </a>
                        <button
                            onClick={async () => {
                                setShowPhone(true);
                                try { await interactionService.logInteraction(ad.id, InteractionType.CALL); } catch {}
                            }}
                            className="flex-1 h-11 rounded-xl bg-primary-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                            <Phone className="h-3.5 w-3.5" />
                            {showPhone ? (ad.owner?.phone || 'N/A') : t('listing.callSeller')}
                        </button>
                        <Link
                            to={`/messages?user=${ad.owner_id}&listing=${ad.id}`}
                            className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {t('listing.sendMessage')}
                        </Link>
                    </>
                )}
            </div>

            {/* ══════════════════════════════════════════
                DESKTOP — Jiji-style layout
            ══════════════════════════════════════════ */}
            <div className="hidden lg:block bg-gray-50 min-h-screen">
                <div className="container mx-auto px-4 py-6 max-w-6xl">
                    <div className="flex gap-6 items-start">

                        {/* ── Main column ── */}
                        <div className="flex-1 min-w-0 space-y-4">

                            {/* Gallery */}
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                <div className="relative bg-gray-100 group" style={{ aspectRatio: '16/9' }}>
                                    <img 
                                        src={getImageUrl(images[activeImage], { width: 800, quality: 'auto' })} 
                                        alt={effectiveTitle ?? ''} 
                                        className="w-full h-full object-contain cursor-zoom-in" 
                                        onClick={() => setShowFullImage(true)}
                                    />
                                    {images.length > 1 && (
                                        <>
                                            <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors">
                                                <ChevronLeft className="h-5 w-5 text-white" />
                                            </button>
                                            <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors">
                                                <ChevronRight className="h-5 w-5 text-white" />
                                            </button>
                                        </>
                                    )}
                                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/55 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                        <Camera className="h-3.5 w-3.5" />
                                        {activeImage + 1}/{images.length}
                                    </div>
                                    {isBoosted && (
                                        <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
                                            👑 VIP
                                        </div>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <div className="flex gap-2 p-3 overflow-x-auto">
                                        {images.map((img: string, i: number) => (
                                            <button key={i} onClick={() => setActiveImage(i)}
                                                className={cn('w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0',
                                                    activeImage === i ? 'border-primary-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100')}>
                                                <img src={getImageUrl(img, { width: 100, quality: 'eco' })} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Title + Price + Meta */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <h1 className={`text-2xl md:text-3xl font-bold text-gray-900 ${isTranslating ? 'opacity-50' : ''}`}>
                                        {effectiveTitle}
                                    </h1>
                                    {ad && (
                                        <button
                                            onClick={() => {
                                                if (isTranslated) {
                                                    setTranslatedTitle(null);
                                                    setTranslatedDesc(null);
                                                    setIsTranslated(false);
                                                } else {
                                                    const targetLang = i18n.language === 'so' ? 'en' : 'so';
                                                    setIsTranslating(true);
                                                    const texts: string[] = [ad.title_en || ad.title_so || ''];
                                                    if (ad.description_en || ad.description_so) texts.push(ad.description_en || ad.description_so || '');
                                                    translateTexts(texts, targetLang)
                                                        .then(results => {
                                                            setTranslatedTitle(results[0] ?? null);
                                                            if (texts[1] && results[1]) setTranslatedDesc(results[1]);
                                                            setIsTranslated(true);
                                                        })
                                                        .catch(() => {})
                                                        .finally(() => setIsTranslating(false));
                                                }
                                            }}
                                            disabled={isTranslating}
                                            className="shrink-0 inline-flex items-center gap-1 bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-primary-100 hover:bg-primary-100 transition-colors active:scale-95"
                                        >
                                            <span className="text-[12px] leading-none">🌍</span> {isTranslated ? 'Original' : 'Translate'}
                                        </button>
                                    )}
                                </div>
                                {isTranslated && (
                                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l6 6M4 14l6-6 2-2M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/></svg>
                                        Turjumaad Google
                                    </span>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-3 mb-2">
                                    <MapPin className="h-3.5 w-3.5 text-primary-500" />
                                    {ad ? <span>{ad.location}</span> : S.line('w-28', 'h-3')}
                                    {postedDate && <><Clock className="h-3.5 w-3.5 ml-1" /><span>{postedDate}</span></>}
                                </div>
                                <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                                    {ad ? (
                                        <>
                                            <span className="text-2xl font-extrabold text-secondary-500">
                                                {formatConvertedPrice(ad.price, ad.currency, targetCurrency)}
                                            </span>
                                            {Capacitor.getPlatform() === 'ios' && (
                                                <div className="inline-flex p-0.5 bg-gray-100/80 rounded-lg border border-gray-200/50 shadow-sm shrink-0 items-center">
                                                    <button
                                                        onClick={() => setCurrency('KES')}
                                                        className={cn(
                                                            "px-1.5 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer",
                                                            targetCurrency === 'KES'
                                                                ? "bg-white text-secondary-500 shadow-xs"
                                                                : "text-gray-400 hover:text-gray-600"
                                                        )}
                                                    >
                                                        KES
                                                    </button>
                                                    <button
                                                        onClick={() => setCurrency('USD')}
                                                        className={cn(
                                                            "px-1.5 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer",
                                                            targetCurrency === 'USD'
                                                                ? "bg-white text-secondary-500 shadow-xs"
                                                                : "text-gray-400 hover:text-gray-600"
                                                        )}
                                                    >
                                                        USD
                                                    </button>
                                                </div>
                                            )}
                                            {isNegotiable && <span className="text-sm text-gray-400">{t('common.negotiable')}</span>}
                                        </>
                                    ) : S.line('w-1/4', 'h-7')}
                                </div>

                                {/* Share row */}
                                {ad && (
                                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-400 font-semibold flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> {t('listing.share')}:</span>
                                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:opacity-80 transition-opacity text-xs font-bold">f</a>
                                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(effectiveTitle || '')}`} target="_blank" rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-full bg-primary-400 text-white flex items-center justify-center hover:opacity-80 transition-opacity text-xs font-bold">𝕏</a>
                                        <a href={`https://wa.me/?text=${encodeURIComponent((effectiveTitle || '') + ' ' + window.location.href)}`} target="_blank" rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:opacity-80 transition-opacity">
                                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                        </a>
                                        <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
                                            className="ml-auto text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1 transition-colors">
                                            <Share2 className="h-3.5 w-3.5" /> {t('listing.copyLink')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Attributes */}
                            {ad && attrEntries.length > 0 && (
                                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-sm text-gray-900 mb-3">{t('listing.details')}</h3>
                                    <div className="prose prose-primary max-w-none text-gray-600">
                                        <p className="whitespace-pre-line leading-relaxed">{effectiveDesc}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-4">
                                        {attrEntries.map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-center border-b border-gray-50 pb-2">
                                                <span className="text-xs text-gray-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                                                <span className="text-sm font-semibold text-gray-800">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {effectiveDesc && (
                                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-sm text-gray-900 mb-3">{t('listing.description')}</h3>
                                    <p className={cn('text-gray-600 whitespace-pre-line leading-relaxed text-sm', !showFullDesc && 'line-clamp-5')}>
                                        {effectiveDesc}
                                    </p>
                                    {(effectiveDesc?.length ?? 0) > 300 && (
                                        <button onClick={() => setShowFullDesc(v => !v)}
                                            className="mt-3 text-primary-600 text-sm font-semibold flex items-center gap-1">
                                            {showFullDesc ? <>{t('listing.showLess')} <ChevronUp className="h-4 w-4" /></> : <>{t('listing.showMore')} <ChevronDown className="h-4 w-4" /></>}
                                        </button>
                                    )}
                                    {/* Make an offer */}
                                    {ad && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <Link to={`/messages?user=${ad.owner_id}&listing=${ad.id}&msg=${encodeURIComponent(t('listing.makeOfferMsg'))}`}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-primary-400 text-primary-600 font-bold text-sm hover:bg-primary-50 transition-colors">
                                                <MessageCircle className="h-4 w-4" /> {t('listing.makeOfferMsg')}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* KH Pin */}
                            {ad?.attributes?.kh_pin && (
                                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                                        <Navigation className="h-5 w-5 text-primary-500 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">{t('listing.digitalAddress')}</p>
                                            <p className="text-sm font-bold text-gray-900">{ad.attributes.kh_pin}</p>
                                        </div>
                                        <Link to="/kh"><Button variant="outline" size="sm" className="bg-white text-xs font-bold border-primary-200">{t('listing.getPin')}</Button></Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Sidebar ── */}
                        <div className="w-72 shrink-0">
                            <div className="sticky top-20 space-y-4">

                                {/* Price + CTA card */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Price header */}
                                    <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                                        {ad ? (
                                            <>
                                                <div className="flex items-center gap-2 mb-0.5 justify-between">
                                                    <span className="text-2xl font-extrabold text-secondary-500">
                                                        {formatConvertedPrice(ad.price, ad.currency, targetCurrency)}
                                                    </span>
                                                    {Capacitor.getPlatform() === 'ios' && (
                                                        <div className="inline-flex p-0.5 bg-gray-100 rounded-lg border border-gray-200/50 shadow-sm shrink-0 items-center">
                                                            <button
                                                                onClick={() => setCurrency('KES')}
                                                                className={cn(
                                                                    "px-2 py-0.5 text-[9px] font-black rounded-md transition-all cursor-pointer",
                                                                    targetCurrency === 'KES'
                                                                        ? "bg-white text-secondary-500 shadow-sm"
                                                                        : "text-gray-400 hover:text-gray-600"
                                                                )}
                                                            >
                                                                KES
                                                            </button>
                                                            <button
                                                                onClick={() => setCurrency('USD')}
                                                                className={cn(
                                                                    "px-2 py-0.5 text-[9px] font-black rounded-md transition-all cursor-pointer",
                                                                    targetCurrency === 'USD'
                                                                        ? "bg-white text-secondary-500 shadow-sm"
                                                                        : "text-gray-400 hover:text-gray-600"
                                                                )}
                                                            >
                                                                USD
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {isNegotiable && <p className="text-xs text-gray-400">{t('common.negotiable')}</p>}
                                            </>
                                        ) : S.line('w-1/2', 'h-7')}
                                    </div>

                                    {/* Seller info */}
                                    <div className="px-5 py-4 border-b border-gray-100">
                                        {!ad ? (
                                            <div className="flex items-center gap-3 animate-pulse">
                                                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                                                <div className="flex-1 space-y-2">{S.line('w-1/2', 'h-4')}{S.line('w-1/3', 'h-3')}</div>
                                            </div>
                                        ) : (
                                            <Link to={`/seller/${ad.owner_id}`} className="flex items-center gap-3 group">
                                                <div className="w-12 h-12 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center text-primary-600 text-lg font-bold overflow-hidden shrink-0">
                                                    {ad.owner?.avatar_url
                                                        ? <img src={getImageUrl(ad.owner.avatar_url)} alt={ad.owner?.full_name ?? ''} className="w-full h-full object-cover" />
                                                        : ad.owner?.full_name?.charAt(0) || 'S'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-900 group-hover:text-primary-600 transition-colors truncate">{ad.owner?.full_name || t('listing.seller')}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {ad.owner?.is_verified && (
                                                            <div className="flex items-center gap-1 text-primary-600">
                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                                <span className="text-[11px] font-bold">{t('listing.verified')}</span>
                                                            </div>
                                                        )}
                                                        {avgRating && (
                                                            <div className="flex items-center gap-1 text-yellow-500">
                                                                <Star className="h-3 w-3 fill-yellow-500" />
                                                                <span className="text-[11px] font-bold">{avgRating}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {ad.owner?.business && (
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100/80 text-sky-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                <ShoppingBag className="w-2.5 h-2.5 text-sky-600" />
                                                                Official Shop
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="px-4 py-4 flex flex-col gap-2.5">
                                        {!ad ? (
                                            <>{S.box('w-full h-11')}{S.box('w-full h-11')}{S.box('w-full h-10')}</>
                                        ) : (
                                            <>
                                                {/* Show Phone / Call */}
                                                <button
                                                    onClick={async () => {
                                                        setShowPhone(true);
                                                        try { await interactionService.logInteraction(ad.id, InteractionType.CALL); } catch {}
                                                    }}
                                                    className="w-full h-11 rounded-xl bg-primary-500 hover:bg-[#80c5ef] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                                    <Phone className="h-4 w-4" />
                                                    {showPhone ? (ad.owner?.phone || 'N/A') : t('listing.showContact')}
                                                </button>

                                                {/* Visit Official Shop */}
                                                {ad.owner?.business && (
                                                    <Link
                                                        to={`/shop/${ad.owner.business.slug}`}
                                                        className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                                                    >
                                                        <ShoppingBag className="h-4 w-4" />
                                                        Visit Official Shop
                                                    </Link>
                                                )}

                                                {/* Follow button */}
                                                {user && user.id !== ad.owner_id && (
                                                    <button
                                                        onClick={() => followStats?.is_following ? unfollowMutation.mutate() : followMutation.mutate()}
                                                        disabled={followMutation.isPending || unfollowMutation.isPending}
                                                        className={cn(
                                                            "w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                                                            followStats?.is_following 
                                                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200" 
                                                                : "bg-secondary-50 text-secondary-600 border border-secondary-100 hover:bg-secondary-100"
                                                        )}
                                                    >
                                                        {followStats?.is_following ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                                        {followStats?.is_following ? t('sellerProfile.following', 'Following') : t('sellerProfile.follow', 'Follow Seller')}
                                                    </button>
                                                )}

                                                {/* Watchlist/Favorite button */}
                                                <button
                                                    onClick={() => toggleFavoriteMutation.mutate()}
                                                    className={cn(
                                                        "w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] border",
                                                        isFavorite 
                                                            ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                                                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                                    )}
                                                >
                                                    <Heart className={cn("h-4 w-4", isFavorite && "fill-red-600")} />
                                                    {isFavorite ? t('favorites.saved', 'Saved in Watchlist') : t('favorites.save', 'Save to Watchlist')}
                                                </button>

                                                {/* Start chat */}
                                                <Link
                                                    to={`/messages?user=${ad.owner_id}&listing=${ad.id}`}
                                                    className="w-full h-11 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:border-primary-300 hover:text-primary-600 transition-colors">
                                                    <MessageCircle className="h-4 w-4" /> {t('listing.startChat')}
                                                </Link>

                                                {/* WhatsApp */}
                                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                                                    onClick={async () => { try { await interactionService.logInteraction(ad.id, InteractionType.WHATSAPP); } catch {} }}
                                                    className="w-full h-10 rounded-xl border border-gray-200 text-gray-500 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600 transition-colors">
                                                    {WA_ICON} WhatsApp
                                                </a>

                                                {/* Request call back */}
                                                <a
                                                    href={ad.owner?.phone ? `tel:${ad.owner.phone}` : undefined}
                                                    onClick={async () => { try { await interactionService.logInteraction(ad.id, InteractionType.CALL); } catch {} }}
                                                    className="w-full h-10 rounded-xl border border-gray-200 text-gray-500 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                                                    <PhoneCall className="h-4 w-4" /> {t('listing.requestCallBack')}
                                                </a>
                                            </>
                                        )}
                                    </div>

                                    {/* Mark unavailable + Report */}
                                    {ad && (
                                        <div className="px-4 pb-4 flex gap-2">
                                            {user?.id === ad.owner_id && (
                                                <button
                                                    onClick={() => {
                                                        if (ad.status === 'active' && window.confirm('Mark as sold? This ad will be hidden from buyers.')) {
                                                            markAsSoldMutation.mutate(ad.id);
                                                        }
                                                    }}
                                                    disabled={ad.status === 'sold' || ad.status === 'closed' || markAsSoldMutation.isPending}
                                                    className="flex-1 h-9 rounded-lg border border-gray-200 text-gray-400 hover:text-green-600 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-green-50 transition-colors disabled:opacity-50"
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    {(ad.status === 'sold' || ad.status === 'closed') ? 'Sold / Closed' : 'Mark as Sold'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowReportModal(true)}
                                                className="flex-1 h-9 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors"
                                            >
                                                <Flag className="h-3.5 w-3.5" /> {t('listing.reportAbuse')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Safety tips */}
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                    <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        {t('listing.safetyTip')}
                                    </h4>
                                    <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside leading-relaxed">
                                        <li>{t('listing.safetyTip1')}</li>
                                        <li>{t('listing.safetyTip2')}</li>
                                        <li>{t('listing.safetyTip3')}</li>
                                        <li>{t('listing.safetyTip4')}</li>
                                    </ul>
                                    <Link to="/safety" className="mt-3 block text-xs text-primary-600 font-semibold hover:underline">{t('listing.readAllSafetyTips')}</Link>
                                </div>

                                {/* Post Ad Like This */}
                                {ad && (
                                    <Link
                                        to={`/post-ad?category=${ad.category_id}`}
                                        className="w-full h-11 rounded-xl border-2 border-primary-500 text-primary-600 font-extrabold text-sm flex items-center justify-center tracking-wide hover:bg-primary-50 transition-colors">
                                        {t('listing.postAdLikeThis')}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    {feedback && feedback.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-8">
                            <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center justify-between">
                                <span>{t('feedback.sellerReviews', 'Seller Reviews')} ({feedback.length})</span>
                                {avgRating && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-black border border-yellow-100">
                                        <Star size={14} className="fill-yellow-600" />
                                        {avgRating}
                                    </div>
                                )}
                            </h3>
                            <div className="space-y-6">
                                {feedback.slice(0, 3).map((f) => (
                                    <div key={f.id} className="flex gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                            <User size={20} className="text-gray-400" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-gray-900 text-sm">Anonymous</p>
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={cn("h-3 w-3", i < f.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200")} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">{f.comment}</p>
                                            <p className="text-[10px] text-gray-400 pt-1 uppercase font-bold tracking-widest">{new Date(f.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {feedback.length > 3 && (
                                    <Link to={`/seller/${ad?.owner_id}`} className="block text-center text-primary-600 font-bold text-sm hover:underline py-2">
                                        {t('feedback.viewAllReviews', 'View all reviews')} →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Related */}
                    {displayRelatedAds.length > 0 && (
                        <section className="mt-16">
                            <h2 className="text-2xl font-bold mb-8">{t('listing.relatedListings')}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {displayRelatedAds.map((item: Listing, idx: number) => (
                                    <ProductCard
                                        key={item.id}
                                        id={item.id.toString()}
                                        ownerId={item.owner_id}
                                        title_en={item.title_en}
                                        title_so={item.title_so}
                                        price={item.price}
                                        currency={item.currency}
                                        location={item.location}
                                        imageUrl={item.images?.[0] ?? ''}
                                        isVerified={item.owner?.is_verified}
                                        isPromoted={false}
                                        isPopular={idx < 2}
                                        isNegotiable={item.is_negotiable || item.attributes?.negotiable === 'yes'}
                                        hasBulkPrice={!!item.attributes?.bulk_price}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════
                REPORT MODAL
            ══════════════════════════════════════════ */}
            {showReportModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
                >
                    <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Flag className="h-5 w-5 text-red-500" />
                                <h3 className="font-bold text-gray-900 text-base">{t('listing.reportModalTitle')}</h3>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                            >
                                <XCircle className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4 space-y-4">
                            <p className="text-sm text-gray-500">{t('listing.reportModalDesc')}</p>

                            {/* Reason select */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    {t('listing.reportReasonLabel')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={reportReason}
                                    onChange={e => setReportReason(e.target.value)}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                                >
                                    <option value="">{t('listing.reportReasonPlaceholder')}</option>
                                    <option value="spam">{t('listing.reportReasonSpam')}</option>
                                    <option value="fraud">{t('listing.reportReasonFraud')}</option>
                                    <option value="inappropriate">{t('listing.reportReasonInappropriate')}</option>
                                    <option value="wrong_category">{t('listing.reportReasonWrongCategory')}</option>
                                    <option value="already_sold">{t('listing.reportReasonAlreadySold')}</option>
                                    <option value="other">{t('listing.reportReasonOther')}</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    {t('listing.reportDescLabel')}
                                </label>
                                <textarea
                                    value={reportDesc}
                                    onChange={e => setReportDesc(e.target.value)}
                                    placeholder={t('listing.reportDescPlaceholder')}
                                    rows={3}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                            >
                                {t('listing.reportCancel')}
                            </button>
                            <button
                                onClick={() => {
                                    if (!reportReason || !ad) return;
                                    reportMutation.mutate({
                                        listing_id: ad.id,
                                        reason: reportReason,
                                        description: reportDesc,
                                    });
                                }}
                                disabled={!reportReason || reportMutation.isPending}
                                className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <Flag className="h-4 w-4" />
                                {reportMutation.isPending ? '…' : t('listing.reportSubmit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-7 w-7 text-red-600" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">{t('admin.deleteListing')}</h3>
                        <p className="text-sm text-gray-500 mb-6">{t('admin.cannotUndo')}</p>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(ad!.id)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-3 rounded-2xl bg-red-600 text-white text-sm font-black shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Feedback Modal ── */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFeedbackModal(false)} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('listing.writeReview', 'Write Review')}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('listing.rating', 'Rating')}</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFeedbackRating(star)}
                                                className="focus:outline-none"
                                            >
                                                <Star className={cn("h-8 w-8", feedbackRating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('listing.comment', 'Comment')}</label>
                                    <textarea
                                        value={feedbackComment}
                                        onChange={e => setFeedbackComment(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none"
                                        placeholder={t('listing.feedbackPlaceholder', 'Share your experience...')}
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowFeedbackModal(false)}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button
                                        onClick={() => submitFeedbackMutation.mutate({ target_user_id: ad?.owner_id, listing_id: ad?.id, rating: feedbackRating, comment: feedbackComment })}
                                        disabled={feedbackRating === 0 || submitFeedbackMutation.isPending}
                                        className="flex-1 rounded-xl bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/20"
                                    >
                                        {submitFeedbackMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('listing.submitReview', 'Submit')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Full Image Zoom Modal ── */}
            {showFullImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-200">
                    <div className="flex items-center justify-between p-4 absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                        <span className="text-white text-sm font-semibold tracking-wider pointer-events-auto">
                            {activeImage + 1} / {images.length}
                        </span>
                        <button 
                            onClick={() => setShowFullImage(false)}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto shadow-sm"
                        >
                            <XCircle className="w-7 h-7" />
                        </button>
                    </div>
                    
                    <div 
                        className="flex-1 w-full h-full overflow-auto flex items-center justify-center touch-pan-x touch-pan-y"
                        onClick={() => setShowFullImage(false)}
                    >
                        <img 
                            src={getImageUrl(images[activeImage])} 
                            alt={effectiveTitle ?? 'Full image'}
                            className="max-w-none max-h-none md:max-w-full md:max-h-full object-contain cursor-zoom-out min-w-full min-h-full"
                            style={{ objectFit: 'contain' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFullImage(false);
                            }}
                        />
                    </div>

                    {images.length > 1 && (
                        <div className="absolute bottom-10 inset-x-0 flex justify-center gap-6 pointer-events-none">
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-white/20 active:scale-95 transition-all border border-white/10 shadow-xl"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-white/20 active:scale-95 transition-all border border-white/10 shadow-xl"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </PublicLayout>
    );
};

export { ProductDetailPage };
