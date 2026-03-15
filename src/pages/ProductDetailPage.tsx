import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { listingService } from '../services/listingService';
import { interactionService, InteractionType } from '../services/interactionService';
import {
    Phone, Heart,
    MapPin, Clock, ShieldCheck, Flag,
    ChevronLeft, ChevronRight, Info, Navigation,
    MoreVertical, Camera, ChevronDown, ChevronUp, MessageCircle
} from 'lucide-react';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { formatConvertedPrice } from '../utils/currencyUtils';
import type { Listing } from '../types/listing';

const WA_ICON = (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const ProductDetailPage: React.FC = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const { t } = useTranslation();
    const [showPhone, setShowPhone] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const queryClient = useQueryClient();

    // Use cached listing from the home/search page as instant placeholder
    const cachedListing = queryClient.getQueryData<Listing[]>(['listings'])
        ?.find(l => l.id === Number(listingId))
        ?? queryClient.getQueryData<Listing[]>(['featured-listings'])
            ?.find(l => l.id === Number(listingId));

    const { data: ad, isLoading } = useQuery<Listing>({
        queryKey: ['listing', listingId],
        queryFn: () => listingService.getListing(Number(listingId)),
        enabled: !!listingId,
        retry: false,
        staleTime: 60_000,
        placeholderData: cachedListing,
    });

    const { data: relatedAds } = useQuery<Listing[]>({
        queryKey: ['related-listings'],
        queryFn: () => listingService.getListings({ limit: 6 }),
    });

    const displayRelatedAds = relatedAds || [];
    const { currency: targetCurrency } = useCurrencyStore();

    if (!ad) {
        return (
            <PublicLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
                    <p className="text-gray-500 mb-6">This ad may have been removed or is no longer available.</p>
                    <Link to="/"><Button>Back to Marketplace</Button></Link>
                </div>
            </PublicLayout>
        );
    }


    const images = ad.images && ad.images.length > 0
        ? ad.images
        : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800'];

    const isNegotiable = ad.attributes?.negotiable === true || ad.attributes?.negotiable === 'true';
    const isBoosted = (ad.boost_level ?? 0) > 0;
    const postedDate = ad.created_at
        ? new Date(ad.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';

    const whatsappUrl = `https://wa.me/${ad.owner?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in: ${ad.title}`)}`;

    const attrEntries = ad.attributes
        ? Object.entries(ad.attributes).filter(([k]) => k !== 'negotiable' && k !== 'kh_pin')
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
                        src={getImageUrl(images[activeImage])}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                        loading="eager"
                        fetchPriority="high"
                    />

                    {/* Top nav overlay */}
                    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 pt-10">
                        <button
                            onClick={() => window.history.back()}
                            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                        >
                            <ChevronLeft className="h-5 w-5 text-white" />
                        </button>
                        <div className="flex gap-2">
                            <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <Heart className="h-4 w-4 text-white" />
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
                        <span className="truncate">{ad.location}</span>
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
                    <h1 className="text-[17px] font-bold text-gray-900 leading-snug">{ad.title}</h1>
                </div>

                {/* ── Price ── */}
                <div className="bg-white px-4 pb-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary-600">
                        {formatConvertedPrice(ad.price, ad.currency, targetCurrency)}
                    </span>
                    {isNegotiable && (
                        <span className="text-sm text-gray-400 font-medium">{t('common.negotiable')}</span>
                    )}
                </div>

                {/* ── Action buttons ── */}
                <div className="bg-white px-4 pb-5 flex gap-2 border-b border-gray-100">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async () => {
                            try { await interactionService.logInteraction(ad.id, InteractionType.WHATSAPP); } catch {}
                        }}
                        className="flex-1 h-12 rounded-xl border-2 border-primary-500 text-primary-600 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        {WA_ICON} WhatsApp
                    </a>
                    <button
                        onClick={async () => {
                            setShowPhone(true);
                            try { await interactionService.logInteraction(ad.id, InteractionType.CALL); } catch {}
                        }}
                        className="flex-1 h-12 rounded-xl bg-primary-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Phone className="h-4 w-4" />
                        {showPhone ? (ad.owner?.phone || 'N/A') : t('listing.callSeller')}
                    </button>
                    <Link
                        to={`/messages?user=${ad.owner_id}&listing=${ad.id}`}
                        className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                        <MessageCircle className="h-4 w-4" />
                        {t('listing.sendMessage')}
                    </Link>
                </div>

                {/* ── Condition / Key Specs row ── */}
                {attrEntries.length > 0 && (
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
                {ad.description && (
                    <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
                        <h3 className="text-[13px] font-bold text-gray-900 mb-2">{t('listing.description')}</h3>
                        <p className={cn('text-[13px] text-gray-600 leading-relaxed', !showFullDesc && 'line-clamp-4')}>
                            {ad.description}
                        </p>
                        {ad.description.length > 200 && (
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
                {ad.attributes?.kh_pin && (
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

                {/* ── Seller card ── */}
                <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg overflow-hidden shrink-0">
                            {ad.owner?.avatar_url
                                ? <img src={getImageUrl(ad.owner.avatar_url)} alt="" className="w-full h-full object-cover" />
                                : ad.owner?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{ad.owner?.full_name || 'Seller'}</p>
                            {ad.owner?.is_verified && (
                                <div className="flex items-center gap-1 text-primary-600 mt-0.5">
                                    <ShieldCheck className="h-3 w-3" />
                                    <span className="text-[10px] font-bold">{t('listing.verifiedSeller')}</span>
                                </div>
                            )}
                        </div>
                        <Link
                            to={`/seller/${ad.owner_id}`}
                            className="text-xs font-bold text-primary-600 border border-primary-200 bg-primary-50 px-3 py-1.5 rounded-full shrink-0"
                        >
                            {t('listing.viewProfile')}
                        </Link>
                    </div>
                </div>

                {/* ── Report ── */}
                <div className="bg-white mt-2 px-4 py-3 border-b border-gray-100">
                    <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors">
                        <Flag className="h-4 w-4" />
                        {t('listing.reportAd')}
                    </button>
                </div>

                {/* ── Safety tip ── */}
                <div className="bg-white mt-2 mx-4 mb-4 rounded-xl p-3 border border-amber-100 flex gap-2 items-start">
                    <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>{t('listing.safetyTip')}:</strong> {t('listing.safetyTipText')}
                    </p>
                </div>
            </div>

            {/* Mobile sticky bottom CTA */}
            <div
                className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 flex gap-2 px-4 pt-3"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={async () => {
                        try { await interactionService.logInteraction(ad.id, InteractionType.WHATSAPP); } catch {}
                    }}
                    className="flex-1 h-12 rounded-xl border-2 border-primary-500 text-primary-600 font-bold text-sm flex items-center justify-center gap-2"
                >
                    {WA_ICON} WhatsApp
                </a>
                <button
                    onClick={async () => {
                        setShowPhone(true);
                        try { await interactionService.logInteraction(ad.id, InteractionType.CALL); } catch {}
                    }}
                    className="flex-1 h-12 rounded-xl bg-primary-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                    <Phone className="h-4 w-4" />
                    {showPhone ? (ad.owner?.phone || 'N/A') : t('listing.callSeller')}
                </button>
                <Link
                    to={`/messages?user=${ad.owner_id}&listing=${ad.id}`}
                    className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center gap-1.5"
                >
                    <MessageCircle className="h-4 w-4" />
                    {t('listing.sendMessage')}
                </Link>
            </div>

            {/* ══════════════════════════════════════════
                DESKTOP
            ══════════════════════════════════════════ */}
            <div className="hidden lg:block">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Gallery */}
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                <div className="relative aspect-video bg-gray-100">
                                    <img src={getImageUrl(images[activeImage])} alt={ad.title} className="w-full h-full object-contain" />
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
                                        <div className="absolute bottom-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
                                            👑 VIP
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {images.map((img: string, i: number) => (
                                        <button key={i} onClick={() => setActiveImage(i)}
                                            className={cn('w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0',
                                                activeImage === i ? 'border-primary-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100')}>
                                            <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Info card */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                    <MapPin className="h-4 w-4 text-primary-500" />{ad.location}
                                    {postedDate && <><Clock className="h-4 w-4 ml-2" />{postedDate}</>}
                                    {isBoosted && <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-0.5 rounded-full">👑 VIP</span>}
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-3">{ad.title}</h1>
                                <div className="flex items-baseline gap-3 mb-6">
                                    <span className="text-3xl font-bold text-primary-600">
                                        {formatConvertedPrice(ad.price, ad.currency, targetCurrency)}
                                    </span>
                                    {isNegotiable && <span className="text-gray-400 font-medium">{t('common.negotiable')}</span>}
                                </div>

                                {/* Attributes grid */}
                                {attrEntries.length > 0 && (
                                    <div className="mb-6 border border-gray-100 rounded-xl overflow-hidden">
                                        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
                                            {attrEntries.map(([key, value]) => (
                                                <div key={key} className="p-4">
                                                    <p className="text-sm font-bold text-gray-900">{String(value)}</p>
                                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">{key.replace(/_/g, ' ')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {ad.description && (
                                    <div className="border-t border-gray-100 pt-5">
                                        <h3 className="font-bold text-base mb-3 text-gray-900">{t('listing.description')}</h3>
                                        <p className={cn('text-gray-600 whitespace-pre-line leading-relaxed text-sm', !showFullDesc && 'line-clamp-5')}>
                                            {ad.description}
                                        </p>
                                        {ad.description.length > 300 && (
                                            <button onClick={() => setShowFullDesc(v => !v)}
                                                className="mt-2 text-primary-600 text-sm font-semibold flex items-center gap-1">
                                                {showFullDesc ? <>{t('listing.showLess')} <ChevronUp className="h-4 w-4" /></> : <>{t('listing.showMore')} <ChevronDown className="h-4 w-4" /></>}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* KH Pin */}
                                {ad.attributes?.kh_pin && (
                                    <div className="mt-5 p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Navigation className="h-5 w-5 text-primary-500" />
                                            <div>
                                                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">{t('listing.digitalAddress')}</p>
                                                <p className="text-sm font-bold text-gray-900">{ad.attributes.kh_pin}</p>
                                            </div>
                                        </div>
                                        <Link to="/kh"><Button variant="outline" size="sm" className="bg-white text-xs font-bold border-primary-200">{t('listing.getPin')}</Button></Link>
                                    </div>
                                )}

                                <div className="mt-5 flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
                                    <div className="flex items-center gap-2 text-primary-800">
                                        <ShieldCheck className="h-5 w-5" />
                                        <span className="text-sm font-medium">{t('listing.verifiedSellerGuarantee')}</span>
                                    </div>
                                    <Link to="/safety" className="text-xs text-primary-600 underline font-medium">{t('listing.learnMore')}</Link>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="sticky top-24 space-y-4">
                                {/* Seller */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <Link to={`/seller/${ad.owner_id}`} className="flex items-center gap-4 mb-6 group">
                                        <div className="w-16 h-16 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold overflow-hidden">
                                            {ad.owner?.avatar_url
                                                ? <img src={getImageUrl(ad.owner.avatar_url)} alt={ad.owner.full_name} className="w-full h-full object-cover" />
                                                : ad.owner?.full_name?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">{ad.owner?.full_name || 'Seller'}</h3>
                                            {ad.owner?.is_verified && (
                                                <div className="flex items-center gap-1 mt-1 text-primary-600">
                                                    <ShieldCheck className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('listing.verifiedSeller')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    <div className="flex flex-col gap-3">
                                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                                            onClick={async () => { try { await interactionService.logInteraction(ad.id, InteractionType.WHATSAPP); } catch {} }}
                                            className="w-full h-13 rounded-xl border-2 border-primary-500 text-primary-600 font-bold text-base flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors py-3">
                                            {WA_ICON} WhatsApp
                                        </a>
                                        <button
                                            onClick={async () => {
                                                setShowPhone(true);
                                                try { await interactionService.logInteraction(ad.id, InteractionType.CALL); } catch {}
                                            }}
                                            className="w-full h-13 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors py-3">
                                            <Phone className="h-5 w-5" />
                                            {showPhone ? (ad.owner?.phone || 'N/A') : t('listing.callSeller')}
                                        </button>
                                        <Link
                                            to={`/messages?user=${ad.owner_id}&listing=${ad.id}`}
                                            className="w-full rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors py-3"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            {t('listing.sendMessage')}
                                        </Link>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-dashed border-gray-200 text-center">
                                        <button className="text-sm text-gray-400 hover:text-red-500 flex items-center justify-center gap-2 mx-auto transition-colors">
                                            <Flag className="h-4 w-4" /> {t('listing.reportAd')}
                                        </button>
                                    </div>
                                </div>

                                {/* Safety tip */}
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                                    <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        <strong>{t('listing.safetyTip')}:</strong> {t('listing.safetyTipText')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related */}
                    {displayRelatedAds.length > 0 && (
                        <section className="mt-16">
                            <h2 className="text-2xl font-bold mb-8">{t('listing.relatedListings')}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {displayRelatedAds.map((item: Listing, idx: number) => (
                                    <ProductCard
                                        key={item.id}
                                        id={item.id.toString()}
                                        title={item.title}
                                        price={item.price}
                                        currency={item.currency}
                                        location={item.location}
                                        imageUrl={item.images?.[0]}
                                        isVerified={item.owner?.is_verified}
                                        isPromoted={(item.boost_level ?? 0) > 1}
                                        isPopular={idx < 2}
                                        rating={Number((4.5 + idx / 10).toFixed(1))}
                                        registrationAge={idx % 2 === 0 ? '3+ Years' : 'Verified ID'}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
};

export { ProductDetailPage };
