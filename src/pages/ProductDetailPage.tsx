import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { listingService } from '../services/listingService';
import { interactionService, InteractionType } from '../services/interactionService';
import {
    Phone, Heart, Share2,
    MapPin, Clock, ShieldCheck, Flag,
    ChevronLeft, Info, Loader2, Navigation
} from 'lucide-react';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { formatConvertedPrice } from '../utils/currencyUtils';
import type { Listing } from '../types/listing';

const ProductDetailPage: React.FC = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const [showPhone, setShowPhone] = useState(false);
    const [activeImage, setActiveImage] = useState(0);

    const { data: ad, isLoading } = useQuery<Listing>({
        queryKey: ['listing', listingId],
        queryFn: () => listingService.getListing(Number(listingId)),
        enabled: !!listingId,
        retry: false,
    });

    const displayAd = ad;

    const { data: relatedAds } = useQuery<Listing[]>({
        queryKey: ['related-listings'],
        queryFn: () => listingService.getListings({ limit: 6 }),
    });

    const displayRelatedAds = relatedAds || [];

    const { currency: targetCurrency } = useCurrencyStore();

    if (isLoading) {
        return (
            <PublicLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                </div>
            </PublicLayout>
        );
    }

    if (!displayAd) {
        return (
            <PublicLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
                    <p className="text-gray-500 mb-6">The ad you are looking for might have been removed or is no longer available.</p>
                    <Link to="/">
                        <Button>Back to Marketplace</Button>
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    const images = (displayAd && displayAd.images && displayAd.images.length > 0)
        ? displayAd.images
        : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800'];

    return (
        <PublicLayout>
            {/* ── Mobile view: reference-style layout ───────────────── */}
            <div className="lg:hidden bg-[#f7f9fc] min-h-screen pb-28">

                {/* Floating top bar */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <button
                        onClick={() => window.history.back()}
                        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                            <Heart className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                            <Share2 className="h-4 w-4 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Image card — cream background like reference */}
                <div className="mx-4 mb-4 rounded-3xl overflow-hidden bg-[#f0ede8]" style={{ aspectRatio: '1/1' }}>
                    <img
                        src={getImageUrl(images[activeImage])}
                        alt={displayAd.title}
                        className="w-full h-full object-contain p-4"
                    />
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="flex gap-2 px-4 mb-4">
                        {images.map((img: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(i)}
                                className={cn(
                                    'w-16 h-16 rounded-2xl overflow-hidden bg-[#f0ede8] shrink-0 transition-all active:scale-95',
                                    activeImage === i ? 'ring-2 ring-primary-500 ring-offset-1' : 'opacity-60'
                                )}
                            >
                                <img src={getImageUrl(img)} alt="" className="w-full h-full object-contain p-1" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Product info card */}
                <div className="mx-4 bg-white rounded-3xl p-5 shadow-sm mb-4">
                    {/* Title + badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <h1 className="text-xl font-extrabold text-gray-900 leading-tight flex-1">{displayAd.title}</h1>
                        {displayAd.boost_level && displayAd.boost_level > 0 && (
                            <span className="shrink-0 bg-primary-100 text-primary-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                Featured
                            </span>
                        )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-extrabold text-gray-900">
                            {formatConvertedPrice(displayAd.price, displayAd.currency, targetCurrency)}
                        </span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{displayAd.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Posted recently</span>
                    </div>

                    {/* KH PIN */}
                    {displayAd.attributes?.kh_pin && (
                        <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-2xl mb-4">
                            <Navigation className="h-4 w-4 text-primary-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Digital Address</p>
                                <p className="text-sm font-bold text-gray-900 truncate">{displayAd.attributes.kh_pin}</p>
                            </div>
                            <Link to="/kh" className="text-[10px] font-bold text-primary-600 bg-white px-2 py-1 rounded-lg border border-primary-100">Map</Link>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="font-bold text-sm text-gray-900 mb-2">Description</h3>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{displayAd.description}</p>
                        {displayAd.description && displayAd.description.length > 120 && (
                            <button className="text-primary-500 text-sm font-semibold mt-1">…See more</button>
                        )}
                    </div>
                </div>

                {/* Seller card */}
                <div className="mx-4 bg-white rounded-3xl p-4 shadow-sm mb-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg overflow-hidden shrink-0">
                        {displayAd.owner?.avatar_url ? (
                            <img src={getImageUrl(displayAd.owner.avatar_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            displayAd.owner?.full_name?.charAt(0) || 'S'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{displayAd.owner?.full_name || 'Seller'}</p>
                        {displayAd.owner?.is_verified && (
                            <div className="flex items-center gap-1 text-primary-600">
                                <ShieldCheck className="h-3 w-3" />
                                <span className="text-[10px] font-bold">Verified Seller</span>
                            </div>
                        )}
                    </div>
                    <Link to={`/seller/${displayAd.owner_id}`} className="text-xs font-bold text-primary-500 bg-primary-50 px-3 py-1.5 rounded-full">View</Link>
                </div>

                {/* Safety tip */}
                <div className="mx-4 bg-amber-50 rounded-2xl p-3 flex gap-2 items-start">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>Safety tip:</strong> Never pay in advance. Meet in a public place.
                    </p>
                </div>
            </div>

            {/* Mobile sticky CTA */}
            <div
                className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 flex gap-3 px-4 pt-3"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
                <button
                    onClick={async () => {
                        setShowPhone(true);
                        if (displayAd) {
                            try { await interactionService.logInteraction(displayAd.id, InteractionType.CALL); } catch {}
                        }
                    }}
                    className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-800 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <Phone className="h-4 w-4" />
                    {showPhone ? (displayAd.owner?.phone || '+252 6X XXX XXX') : 'Call'}
                </button>
                <a
                    href={`https://wa.me/${displayAd.owner?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in: ${displayAd.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-[2] h-12 rounded-2xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    onClick={async () => {
                        if (displayAd) {
                            try { await interactionService.logInteraction(displayAd.id, InteractionType.WHATSAPP); } catch {}
                        }
                    }}
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                    Contact Seller
                </a>
            </div>

            {/* ── Desktop view (unchanged structure) ─────────────────── */}
            <div className="hidden lg:block">
            <div className="container mx-auto px-4 py-8 pb-32 md:pb-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative group">
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                <img
                                    src={getImageUrl(images[activeImage])}
                                    alt={displayAd.title}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            <div className="flex gap-2 p-4 overflow-x-auto">
                                {images.map((img: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        className={cn(
                                            "w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                                            activeImage === i ? "border-primary-600 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{displayAd.title}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" /> Posted recently
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" /> {displayAd.location}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-bold text-primary-600">
                                        {formatConvertedPrice(displayAd.price, displayAd.currency, targetCurrency)}
                                    </span>
                                    {displayAd.boost_level && displayAd.boost_level > 0 && (
                                        <div className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest mt-1">
                                            Featured Ad
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Kaalay Heedhe PIN Integration */}
                            <div className="mb-8 p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        <Navigation className="h-5 w-5 text-primary-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Digital Address</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {displayAd.attributes?.kh_pin || "Find exact location using KH-PIN"}
                                        </p>
                                    </div>
                                </div>
                                <Link to="/kh">
                                    <Button variant="outline" size="sm" className="bg-white hover:bg-white/80 text-[10px] h-8 font-bold border-primary-200">
                                        GET PIN
                                    </Button>
                                </Link>
                            </div>

                            {displayAd.attributes && Object.keys(displayAd.attributes).length > 0 && (
                                <div className="mb-8 overflow-hidden">
                                    <h3 className="font-bold text-lg mb-4">Specifications</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(displayAd.attributes).map(([key, value]) => (
                                            <div key={key} className="bg-gray-50 p-3 rounded-xl">
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">{key}</p>
                                                <p className="text-sm font-semibold text-gray-700">{String(value)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="font-bold text-lg mb-4">Description</h3>
                                <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                                    {displayAd.description}
                                </p>
                            </div>

                            <div className="mt-8 flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
                                <div className="flex items-center gap-2 text-primary-800">
                                    <ShieldCheck className="h-5 w-5" />
                                    <span className="text-sm font-medium">Verified Seller Guarantee</span>
                                </div>
                                <Link to="/safety" className="text-xs text-primary-600 underline font-medium">Learn More</Link>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        <div className="sticky top-24 space-y-6">
                            {/* Seller Card */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <Link to={`/seller/${displayAd.owner_id}`} className="flex items-center gap-4 mb-6 group/seller">
                                    <div className="w-16 h-16 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold uppercase group-hover/seller:bg-primary-100 transition-colors overflow-hidden">
                                        {displayAd.owner?.avatar_url ? (
                                            <img
                                                src={getImageUrl(displayAd.owner.avatar_url)}
                                                alt={displayAd.owner.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            displayAd.owner?.full_name?.charAt(0) || 'S'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 group-hover/seller:text-primary-600 transition-colors line-clamp-1">{displayAd.owner?.full_name || 'Seller'}</h3>
                                        <p className="text-xs text-gray-500">{displayAd.owner?.response_time || 'Typically responds in a few hours'}</p>
                                        {displayAd.owner?.is_verified && (
                                            <div className="flex items-center gap-1 mt-1 text-primary-600">
                                                <ShieldCheck className="h-3.5 w-3.5 fill-primary-50" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Verified Seller</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                {/* Desktop Action Buttons (Hidden on Mobile) */}
                                <div className="hidden md:flex flex-col gap-3">
                                    <Button
                                        className={cn(
                                            "w-full gap-2 text-lg h-14 rounded-xl transition-all",
                                            showPhone ? "bg-primary-50 text-primary-700 border-2 border-primary-100 hover:bg-primary-100" : ""
                                        )}
                                        onClick={async () => {
                                            setShowPhone(true);
                                            if (displayAd) {
                                                try {
                                                    await interactionService.logInteraction(displayAd.id, InteractionType.CALL);
                                                } catch (err) {
                                                    console.error('Failed to log call interaction', err);
                                                }
                                            }
                                        }}
                                    >
                                        <Phone className="h-5 w-5" />
                                        {showPhone ? (displayAd.owner?.phone || '+252 61 XXX XXX') : `${displayAd.owner?.phone?.substring(0, 4) || '+252 6'} XXX XXX`}
                                    </Button>
                                    <a
                                        href={`https://wa.me/${displayAd.owner?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in your ad: ${displayAd.title} (ID: ${displayAd.id})`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center h-14 rounded-xl bg-[#25D366] text-white text-lg font-bold hover:bg-[#20bd5c] transition-colors shadow-sm gap-2"
                                        onClick={async () => {
                                            if (displayAd) {
                                                try {
                                                    await interactionService.logInteraction(displayAd.id, InteractionType.WHATSAPP);
                                                } catch (err) {
                                                    console.error('Failed to log whatsapp interaction', err);
                                                }
                                            }
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                        WhatsApp
                                    </a>

                                    <div className="mt-6 pt-6 border-t border-dotted border-gray-200 text-center">
                                        <button className="text-sm text-red-500 flex items-center justify-center gap-2 mx-auto hover:underline font-medium">
                                            <Flag className="h-4 w-4" />
                                            Report Abuse
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Warning Card */}
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                                <Info className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-800 leading-normal">
                                    <strong>Safety First:</strong> Avoid paying in advance even for delivery. Meet the seller in a public place.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Ads */}
                <section className="mt-16">
                    <h2 className="text-2xl font-bold mb-8">Related Listings</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {displayRelatedAds?.map((ad: Listing, idx: number) => (
                            <ProductCard
                                key={ad.id}
                                id={ad.id.toString()}
                                title={ad.title}
                                price={ad.price}
                                currency={ad.currency}
                                location={ad.location}
                                imageUrl={ad.images?.[0]}
                                isVerified={ad.owner?.is_verified}
                                isPromoted={(ad.boost_level ?? 0) > 1}
                                isPopular={idx < 2}
                                rating={Number((4.5 + (idx / 10)).toFixed(1))}
                                registrationAge={idx % 2 === 0 ? "3+ Years on platform" : "Verified ID"}
                            />
                        ))}
                    </div>
                </section>
            </div>

            {/* Desktop sticky action bar (hidden on mobile — handled above) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 hidden z-40 flex gap-3 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <Button
                    className={cn(
                        "flex-1 gap-2 h-12 rounded-xl text-sm font-bold shadow-none border transition-all",
                        showPhone
                            ? "bg-primary-50 text-primary-700 border-primary-200"
                            : "bg-primary-600 text-white border-transparent hover:bg-primary-700"
                    )}
                    onClick={async () => {
                        setShowPhone(true);
                        if (displayAd) {
                            try {
                                await interactionService.logInteraction(displayAd.id, InteractionType.CALL);
                            } catch (err) {
                                console.error('Failed to log call', err);
                            }
                        }
                    }}
                >
                    <Phone className="h-5 w-5" />
                    {showPhone ? (displayAd.owner?.phone || '+252 61 XXX XXX') : "Call Seller"}
                </Button>
                <a
                    href={`https://wa.me/${displayAd.owner?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in your ad: ${displayAd.title} (ID: ${displayAd.id})`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center h-12 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#20bd5c] transition-colors shadow-none gap-2"
                    onClick={async () => {
                        if (displayAd) {
                            try {
                                await interactionService.logInteraction(displayAd.id, InteractionType.WHATSAPP);
                            } catch (err) {
                                console.error('Failed to log whatsapp', err);
                            }
                        }
                    }}
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    WhatsApp
                </a>
            </div>
            </div> {/* end desktop wrapper */}
        </PublicLayout>
    );
};

export { ProductDetailPage };
