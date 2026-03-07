import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { listingService } from '../services/listingService';
import { interactionService, InteractionType } from '../services/interactionService';
import {
    Phone, Heart,
    MapPin, Clock, ShieldCheck, Flag,
    ChevronLeft, Info, Loader2, Navigation,
    MoreVertical, Camera, ChevronDown, ChevronUp
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
    const [showPhone, setShowPhone] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [showFullDesc, setShowFullDesc] = useState(false);

    const { data: ad, isLoading } = useQuery<Listing>({
        queryKey: ['listing', listingId],
        queryFn: () => listingService.getListing(Number(listingId)),
        enabled: !!listingId,
        retry: false,
    });

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

    return (
        <PublicLayout>
            {/* ══════════════════════════════════════════
                MOBILE — Jiji-style layout
            ══════════════════════════════════════════ */}
            <div className="lg:hidden bg-white pb-32">

                {/* Full-width image with overlaid nav */}
                <div className="relative w-full bg-black" style={{ aspectRatio: '4/3' }}>
                    <img
                        src={getImageUrl(images[activeImage])}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                    />

                    {/* Overlay top bar */}
                    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 pt-3">
                        <button
                            onClick={() => window.history.back()}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                        >
                            <ChevronLeft className="h-5 w-5 text-white" />
                        </button>
                        <div className="flex gap-2">
                            <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                <Heart className="h-4 w-4 text-white" />
                            </button>
                            <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                <MoreVertical className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Photo count */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        <Camera className="h-3 w-3" />
                        {images.length}
                    </div>

                    {/* VIP badge */}
                    {isBoosted && (
                        <div className="absolute bottom-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
                            👑 VIP
                        </div>
                    )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-gray-100">
                        {images.map((img: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(i)}
                                className={cn(
                                    'w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all',
                                    activeImage === i ? 'border-primary-500' : 'border-transparent opacity-60'
                                )}
                            >
                                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Location + date */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{ad.location}</span>
                        {postedDate && <span className="ml-1">· {postedDate}</span>}
                    </div>
                </div>

                {/* Title */}
                <div className="px-4 pb-1">
                    <h1 className="text-lg font-bold text-gray-900 leading-snug">{ad.title}</h1>
                </div>

                {/* Price */}
                <div className="px-4 pb-4 flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary-600">
                        {formatConvertedPrice(ad.price, ad.currency, targetCurrency)}
                    </span>
                    {isNegotiable && (
                        <span className="text-sm text-gray-500 font-medium">Negotiable</span>
                    )}
                </div>

                {/* Action buttons */}
                <div className="px-4 pb-4 flex gap-3">
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
                        className="flex-1 h-12 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Phone className="h-4 w-4" />
                        {showPhone ? (ad.owner?.phone || 'N/A') : 'Call'}
                    </button>
                </div>

                {/* Specs row (attributes as pills) */}
                {attrEntries.length > 0 && (
                    <div className="border-t border-b border-gray-100 px-4 py-3">
                        <div className="flex flex-wrap gap-4">
                            {attrEntries.slice(0, 4).map(([key, value]) => (
                                <div key={key} className="flex flex-col items-center gap-1 min-w-[70px]">
                                    <span className="text-sm font-semibold text-gray-700">{String(value)}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Details table */}
                {attrEntries.length > 0 && (
                    <div className="px-4 py-4 border-b border-gray-100">
                        <div className="grid grid-cols-2 gap-y-4">
                            {attrEntries.map(([key, value]) => (
                                <div key={key}>
                                    <p className="text-sm font-semibold text-gray-900">{String(value)}</p>
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wide mt-0.5">{key.replace(/_/g, ' ')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                {ad.description && (
                    <div className="px-4 py-4 border-b border-gray-100">
                        <p className={cn('text-sm text-gray-700 leading-relaxed', !showFullDesc && 'line-clamp-4')}>
                            {ad.description}
                        </p>
                        {ad.description.length > 200 && (
                            <button
                                onClick={() => setShowFullDesc(v => !v)}
                                className="mt-2 text-primary-600 text-sm font-semibold flex items-center gap-1"
                            >
                                {showFullDesc ? <>Show less <ChevronUp className="h-4 w-4" /></> : <>Show more <ChevronDown className="h-4 w-4" /></>}
                            </button>
                        )}
                    </div>
                )}

                {/* KH PIN */}
                {ad.attributes?.kh_pin && (
                    <div className="px-4 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                            <Navigation className="h-4 w-4 text-primary-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Digital Address</p>
                                <p className="text-sm font-bold text-gray-900">{ad.attributes.kh_pin}</p>
                            </div>
                            <Link to="/kh" className="text-xs font-bold text-primary-600 bg-white px-2 py-1 rounded-lg border border-primary-200">Map</Link>
                        </div>
                    </div>
                )}

                {/* Seller */}
                <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg overflow-hidden shrink-0">
                        {ad.owner?.avatar_url
                            ? <img src={getImageUrl(ad.owner.avatar_url)} alt="" className="w-full h-full object-cover" />
                            : ad.owner?.full_name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{ad.owner?.full_name || 'Seller'}</p>
                        {ad.owner?.is_verified && (
                            <div className="flex items-center gap-1 text-primary-600">
                                <ShieldCheck className="h-3 w-3" />
                                <span className="text-[10px] font-bold">Verified Seller</span>
                            </div>
                        )}
                    </div>
                    <Link to={`/seller/${ad.owner_id}`} className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full shrink-0">View Profile</Link>
                </div>

                {/* Safety tip */}
                <div className="px-4 py-4">
                    <div className="flex gap-2 items-start bg-amber-50 rounded-xl p-3">
                        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Safety tip:</strong> Never pay in advance. Meet in a public place. Inspect before you pay.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile sticky bottom CTA */}
            <div
                className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 flex gap-3 px-4 pt-3"
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
                    {showPhone ? (ad.owner?.phone || 'N/A') : 'Call'}
                </button>
            </div>

            {/* ══════════════════════════════════════════
                DESKTOP — unchanged structure
            ══════════════════════════════════════════ */}
            <div className="hidden lg:block">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Gallery */}
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                <div className="aspect-video bg-gray-100">
                                    <img src={getImageUrl(images[activeImage])} alt={ad.title} className="w-full h-full object-contain" />
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

                            {/* Info */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                            <MapPin className="h-4 w-4" />{ad.location}
                                            {postedDate && <><Clock className="h-4 w-4 ml-2" />{postedDate}</>}
                                        </div>
                                        <h1 className="text-2xl font-bold text-gray-900">{ad.title}</h1>
                                    </div>
                                    {isBoosted && <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full shrink-0">👑 VIP</span>}
                                </div>

                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-3xl font-bold text-primary-600">
                                        {formatConvertedPrice(ad.price, ad.currency, targetCurrency)}
                                    </span>
                                    {isNegotiable && <span className="text-gray-500 font-medium">Negotiable</span>}
                                </div>

                                {/* Attributes table */}
                                {attrEntries.length > 0 && (
                                    <div className="mb-6 border border-gray-100 rounded-xl overflow-hidden">
                                        <div className="grid grid-cols-2">
                                            {attrEntries.map(([key, value], i) => (
                                                <div key={key} className={cn('p-3', i % 2 === 0 ? 'bg-gray-50' : 'bg-white', 'border-b border-gray-100')}>
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">{key.replace(/_/g, ' ')}</p>
                                                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{String(value)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {ad.description && (
                                    <div className="border-t border-gray-100 pt-6">
                                        <h3 className="font-bold text-lg mb-3">Description</h3>
                                        <p className={cn('text-gray-600 whitespace-pre-line leading-relaxed', !showFullDesc && 'line-clamp-5')}>
                                            {ad.description}
                                        </p>
                                        {ad.description.length > 300 && (
                                            <button onClick={() => setShowFullDesc(v => !v)}
                                                className="mt-2 text-primary-600 text-sm font-semibold flex items-center gap-1">
                                                {showFullDesc ? <>Show less <ChevronUp className="h-4 w-4" /></> : <>Show more <ChevronDown className="h-4 w-4" /></>}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* KH Pin */}
                                {ad.attributes?.kh_pin && (
                                    <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Navigation className="h-5 w-5 text-primary-500" />
                                            <div>
                                                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Digital Address</p>
                                                <p className="text-sm font-bold text-gray-900">{ad.attributes.kh_pin}</p>
                                            </div>
                                        </div>
                                        <Link to="/kh"><Button variant="outline" size="sm" className="bg-white text-xs font-bold border-primary-200">GET PIN</Button></Link>
                                    </div>
                                )}

                                <div className="mt-6 flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
                                    <div className="flex items-center gap-2 text-primary-800">
                                        <ShieldCheck className="h-5 w-5" />
                                        <span className="text-sm font-medium">Verified Seller Guarantee</span>
                                    </div>
                                    <Link to="/safety" className="text-xs text-primary-600 underline font-medium">Learn More</Link>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="sticky top-24 space-y-6">
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
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Verified Seller</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    <div className="flex flex-col gap-3">
                                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                                            onClick={async () => { try { await interactionService.logInteraction(ad.id, InteractionType.WHATSAPP); } catch {} }}
                                            className="w-full h-14 rounded-xl border-2 border-primary-500 text-primary-600 font-bold text-base flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors">
                                            {WA_ICON} WhatsApp
                                        </a>
                                        <button
                                            onClick={async () => {
                                                setShowPhone(true);
                                                try { await interactionService.logInteraction(ad.id, InteractionType.CALL); } catch {}
                                            }}
                                            className="w-full h-14 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors">
                                            <Phone className="h-5 w-5" />
                                            {showPhone ? (ad.owner?.phone || 'N/A') : 'Call'}
                                        </button>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-dashed border-gray-200 text-center">
                                        <button className="text-sm text-red-500 flex items-center justify-center gap-2 mx-auto hover:underline font-medium">
                                            <Flag className="h-4 w-4" /> Report Abuse
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                                    <Info className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-yellow-800 leading-normal">
                                        <strong>Safety First:</strong> Avoid paying in advance. Meet the seller in a public place.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related */}
                    {displayRelatedAds.length > 0 && (
                        <section className="mt-16">
                            <h2 className="text-2xl font-bold mb-8">Related Listings</h2>
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
