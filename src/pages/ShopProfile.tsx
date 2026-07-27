import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { businessService } from '../services/businessService';
import { getImageUrl } from '../utils/imageUtils';
import { Button } from '../components/Button';
import {
    ShieldCheck, MapPin, Phone, Mail, Globe,
    MessageCircle, Sparkles, Loader2, ChevronLeft, ShoppingBag,
    AlertCircle, Check, Copy, Heart, Eye, ExternalLink, Star, Clock, Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { formatConvertedPrice } from '../utils/currencyUtils';
import { useScrollPosition } from '../hooks/useScrollPosition';

const ShopProfile: React.FC = () => {
    const { t } = useTranslation();
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about' | 'contact'>('products');

    // Scroll position memory
    useScrollPosition(`shop-${slug}`, [slug]);
    const [copied, setCopied] = useState(false);
    const [favorites, setFavorites] = useState<Record<number, boolean>>({});
    const { currency: targetCurrency } = useCurrencyStore();

    const { data, isLoading, error } = useQuery({
        queryKey: ['public-shop', slug],
        queryFn: () => businessService.getPublicShop(slug || ''),
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });

    const handleShare = async () => {
        const shareUrl = window.location.href;
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

    const handleWhatsAppShare = () => {
        const shareUrl = window.location.href;
        const text = encodeURIComponent(`Check out this amazing shop on Suqafuran: ${data?.business.name}\n${shareUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    const toggleFavorite = (productId: number) => {
        setFavorites(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    if (isLoading) {
        return (
            <PublicLayout>
                <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
                    <p className="text-slate-500 text-sm animate-pulse font-medium">Loading Shop Profile...</p>
                </div>
            </PublicLayout>
        );
    }

    if (error || !data || !data.business) {
        return (
            <PublicLayout>
                <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-slate-50">
                    <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Shop Not Found</h2>
                    <p className="text-slate-500 max-w-md mb-8">The shop storefront you are trying to visit does not exist or has been temporarily deactivated.</p>
                    <Link to="/">
                        <Button className="rounded-full px-8 bg-primary-500 text-white hover:bg-primary-600 border-none shadow-lg">
                            Back to Marketplace
                        </Button>
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    const { business, products, listings = [], owner_avatar_url } = data;
    const brandColor = business.brand_color || '#2563eb';
    const totalItems = listings.length + products.length;

    return (
        <PublicLayout>
            <div className="min-h-screen bg-[#f4f7fa] text-slate-800">
                {/* Back link */}
                <div className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t('sellerProfile.backToSearch', 'BACK TO MARKETPLACE')}
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-full transition-all active:scale-95"
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? 'COPIED!' : 'COPY LINK'}
                            </button>
                            <button
                                onClick={handleWhatsAppShare}
                                className="flex items-center gap-1.5 bg-green-50 border border-green-200/80 text-xs font-bold text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-full transition-all active:scale-95"
                            >
                                <MessageCircle className="h-3.5 w-3.5 fill-green-500/10 text-green-500" />
                                SHARE WHATSAPP
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cover Banner */}
                <div className="relative h-48 md:h-72 w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                    {business.banner_url ? (
                        <img
                            src={getImageUrl(business.banner_url)}
                            alt={business.name}
                            className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full opacity-35 flex items-center justify-center bg-sky-50/50">
                            <ShoppingBag className="w-24 h-24 text-sky-200" />
                        </div>
                    )}
                    {/* Light subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#f4f7fa] via-[#f4f7fa]/40 to-transparent" />
                </div>

                {/* Profile Header Block */}
                <div className="container mx-auto px-4 -mt-16 md:-mt-24 relative z-10 pb-8">
                    <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 shadow-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                                {/* Logo Overlay */}
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                                    {(business.logo_url || owner_avatar_url) ? (
                                        <img
                                            src={getImageUrl(business.logo_url || owner_avatar_url)}
                                            alt={business.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full text-white font-extrabold text-3xl uppercase flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                                            {business.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 mt-2">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{business.name}</h1>
                                        {business.is_verified && (
                                            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <ShieldCheck className="h-3.5 w-3.5 fill-amber-500/10 text-amber-500" />
                                                Verified Shop
                                            </span>
                                        )}
                                        <span className="inline-flex items-center bg-sky-50 border border-sky-100 text-sky-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                            {business.category}
                                        </span>
                                    </div>

                                    {business.tagline && (
                                        <p className="text-slate-500 mt-2 text-sm md:text-base italic max-w-xl">"{business.tagline}"</p>
                                    )}

                                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-4 text-xs text-slate-500">
                                        {business.address && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{business.address}</span>
                                            </div>
                                        )}
                                        {business.phone && (
                                            <div className="flex items-center gap-1">
                                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{business.phone}</span>
                                            </div>
                                        )}
                                        {business.rating > 0 && (
                                            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 font-bold px-1.5 py-0.5 rounded border border-amber-100">
                                                <span>★</span>
                                                <span>{business.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-row md:flex-col gap-3 justify-center">
                                {business.phone && (
                                    <a href={`tel:${business.phone}`} className="flex-1 md:flex-initial">
                                        <Button
                                            className="w-full rounded-2xl gap-2 font-bold transition-all transform hover:scale-[1.02] border-none shadow-md text-white"
                                            style={{ backgroundColor: brandColor }}
                                        >
                                            <Phone className="h-4 w-4" />
                                            Call Shop
                                        </Button>
                                    </a>
                                )}
                                {business.phone && (
                                    <a
                                        href={`https://wa.me/${business.phone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 md:flex-initial"
                                    >
                                        <Button className="w-full rounded-2xl gap-2 font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm">
                                            <MessageCircle className="h-4 w-4 text-green-500 fill-green-500/10" />
                                            WhatsApp Chat
                                        </Button>
                                    </a>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Shop Navigation Tabs */}
                <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-14 z-30">
                    <div className="container mx-auto px-4">
                        <div className="flex gap-8 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('products')}
                                className={cn(
                                    "py-4 text-sm font-bold tracking-wider relative transition-colors uppercase whitespace-nowrap",
                                    activeTab === 'products' ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Products
                                {activeTab === 'products' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: brandColor }} />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={cn(
                                    "py-4 text-sm font-bold tracking-wider relative transition-colors uppercase whitespace-nowrap",
                                    activeTab === 'reviews' ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Reviews
                                {activeTab === 'reviews' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: brandColor }} />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('about')}
                                className={cn(
                                    "py-4 text-sm font-bold tracking-wider relative transition-colors uppercase whitespace-nowrap",
                                    activeTab === 'about' ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                About Shop
                                {activeTab === 'about' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: brandColor }} />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('contact')}
                                className={cn(
                                    "py-4 text-sm font-bold tracking-wider relative transition-colors uppercase whitespace-nowrap",
                                    activeTab === 'contact' ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Contact Info
                                {activeTab === 'contact' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: brandColor }} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab content panel */}
                <div className="container mx-auto px-4 py-8">
                    {activeTab === 'products' && (
                        <div>
                            {/* Products Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 rounded-full" style={{ backgroundColor: brandColor }} />
                                    <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Store Catalog</h2>
                                </div>
                                <span className="bg-sky-50 border border-sky-100 text-sky-600 px-3 py-1 rounded-full text-xs font-extrabold">
                                    {totalItems} Items Available
                                </span>
                            </div>

                            {/* Listings Grid (primary — from owner's ads) */}
                            {listings.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                                    {listings.map((listing: any) => {
                                        const thumb = listing.images?.[0];
                                        return (
                                            <Link
                                                key={listing.id}
                                                to={`/listing/${listing.id}`}
                                                className="group bg-white rounded-3xl overflow-hidden border border-sky-100/70 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 relative flex flex-col"
                                            >
                                                {/* Boost badge */}
                                                {listing.boost_level > 0 && (
                                                    <span className="absolute top-3 left-3 z-10 bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                                        Promoted
                                                    </span>
                                                )}

                                                {/* Thumbnail */}
                                                <div className="relative aspect-square w-full bg-slate-50 overflow-hidden shrink-0">
                                                    {thumb ? (
                                                        <img
                                                            src={getImageUrl(thumb)}
                                                            alt={listing.title_en}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                            <ShoppingBag className="w-12 h-12 text-slate-300" />
                                                        </div>
                                                    )}
                                                    {/* Hover overlay */}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <ExternalLink className="w-6 h-6 text-white drop-shadow-lg" />
                                                    </div>
                                                </div>

                                                {/* Details */}
                                                <div className="p-4 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-tight">
                                                            {listing.title_en}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-[10px] font-bold text-slate-400 capitalize">{listing.condition}</span>
                                                            {listing.is_negotiable && (
                                                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full">Negotiable</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 pt-3 border-t border-sky-100/60">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-base font-extrabold text-slate-900">
                                                                {formatConvertedPrice(listing.price, listing.currency, targetCurrency)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-medium">
                                                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.views ?? 0}</span>
                                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {listing.location}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Business Product Catalog (secondary — in-store inventory) */}
                            {products.length > 0 && (
                                <>
                                    {listings.length > 0 && (
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-px flex-1 bg-slate-100" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">In-Store Inventory</span>
                                            <div className="h-px flex-1 bg-slate-100" />
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {products.map((product) => {
                                            const discountPercent = product.discount_price 
                                                ? Math.round(((product.price - product.discount_price) / product.price) * 100)
                                                : null;

                                            return (
                                                <div 
                                                    key={product.id}
                                                    className="group bg-white rounded-3xl overflow-hidden border border-sky-100/70 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 relative flex flex-col"
                                                >
                                                    {/* Wishlist and discount overlays */}
                                                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                                                        <button 
                                                            onClick={() => toggleFavorite(product.id)}
                                                            className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors active:scale-90"
                                                        >
                                                            {favorites[product.id] ? (
                                                                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                                            ) : (
                                                                <Heart className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {discountPercent && (
                                                        <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                                            -{discountPercent}% OFF
                                                        </span>
                                                    )}

                                                    {/* Image Container */}
                                                    <div className="relative aspect-square w-full bg-slate-50 overflow-hidden shrink-0">
                                                        {product.images && product.images[0] ? (
                                                            <img
                                                                src={getImageUrl(product.images[0])}
                                                                alt={product.name_en}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                                <ShoppingBag className="w-12 h-12 text-slate-300" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-tight">
                                                                {product.name_en}
                                                            </h3>
                                                            {product.sku && (
                                                                <span className="text-[10px] font-mono text-slate-400 mt-1 block">SKU: {product.sku}</span>
                                                            )}
                                                        </div>

                                                        <div className="mt-4 pt-3 border-t border-sky-100/60">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-base font-extrabold text-slate-900">
                                                                    {formatConvertedPrice(product.discount_price || product.price, 'USD', targetCurrency)}
                                                                </span>
                                                                {product.discount_price && (
                                                                    <span className="text-xs text-slate-400 line-through">
                                                                        {formatConvertedPrice(product.price, 'USD', targetCurrency)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Stock status indicator */}
                                                            <div className="mt-2 flex items-center justify-between">
                                                                {product.stock_level > 0 ? (
                                                                    <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                                        In Stock
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-red-500">Out of Stock</span>
                                                                )}
                                                                
                                                                {product.stock_level > 0 && product.stock_level <= product.low_stock_threshold && (
                                                                    <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded uppercase border border-amber-100">
                                                                        Running Low
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Empty state - shown when both are empty */}
                            {listings.length === 0 && products.length === 0 && (
                                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-sky-100 shadow-sm">
                                    <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">No items listed</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto">This shop storefront is brand new or hasn't imported inventory catalog products yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="max-w-3xl mx-auto">
                            {/* Reviews Header */}
                            <div className="bg-white rounded-3xl p-6 md:p-8 border border-sky-100 shadow-sm mb-6">
                                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Star className="w-5 h-5" style={{ color: brandColor }} />
                                    Customer Reviews
                                </h2>

                                {/* Overall Rating Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-sky-100/60">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="text-5xl font-black text-slate-900 mb-2">
                                            {business.rating.toFixed(1)}
                                        </div>
                                        <div className="flex items-center gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        'h-5 w-5',
                                                        i < Math.round(business.rating)
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-slate-300'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">Based on customer feedback</p>
                                    </div>

                                    <div className="space-y-3">
                                        {[5, 4, 3, 2, 1].map(rating => (
                                            <div key={rating} className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 w-12">
                                                    {[...Array(rating)].map((_, i) => (
                                                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                    ))}
                                                </div>
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-400"
                                                        style={{ width: `${Math.random() * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* No Reviews Message */}
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium mb-4">
                                        This shop doesn't have customer reviews yet. Be the first to share your experience!
                                    </p>
                                    <button className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-colors">
                                        Write a Review
                                    </button>
                                </div>
                            </div>

                            {/* Review List Placeholder */}
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500 text-center py-8">
                                    Verified customer reviews will appear here once customers start rating their purchases.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-sky-100 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5" style={{ color: brandColor }} />
                                About {business.name}
                            </h2>
                            <p className="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-line">
                                {business.description || 'Welcome to our shop storefront! We are dedicated to providing the best products and customer experience.'}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-sky-100/60 text-xs md:text-sm">
                                <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100/50">
                                    <span className="text-slate-400 block mb-1 uppercase font-bold tracking-wider text-[10px]">Verified Status</span>
                                    <span className="text-slate-800 font-extrabold flex items-center gap-1.5">
                                        {business.is_verified ? (
                                            <><ShieldCheck className="h-4 w-4 text-amber-500 fill-amber-500/10" /> Verified Store</>
                                        ) : (
                                            'Standard Registration'
                                        )}
                                    </span>
                                </div>
                                <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100/50">
                                    <span className="text-slate-400 block mb-1 uppercase font-bold tracking-wider text-[10px]">Merchant Category</span>
                                    <span className="text-slate-800 font-extrabold capitalize">{business.category}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-sky-100 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                Contact Information
                            </h2>
                            
                            <div className="space-y-4">
                                {business.address && (
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-sky-50/30 border border-sky-100/50">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-sky-100 flex items-center justify-center shrink-0 shadow-sm">
                                            <MapPin className="w-5 h-5" style={{ color: brandColor }} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Physical Address</span>
                                            <p className="text-slate-800 font-semibold text-sm mt-0.5">{business.address}</p>
                                        </div>
                                    </div>
                                )}

                                {business.phone && (
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-sky-50/30 border border-sky-100/50">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-sky-100 flex items-center justify-center shrink-0 shadow-sm">
                                            <Phone className="w-5 h-5" style={{ color: brandColor }} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Phone Support</span>
                                            <p className="text-slate-800 font-semibold text-sm mt-0.5">{business.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {business.email && (
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-sky-50/30 border border-sky-100/50">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-sky-100 flex items-center justify-center shrink-0 shadow-sm">
                                            <Mail className="w-5 h-5" style={{ color: brandColor }} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Email Address</span>
                                            <p className="text-slate-800 font-semibold text-sm mt-0.5">{business.email}</p>
                                        </div>
                                    </div>
                                )}

                                {business.website && (
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-sky-50/30 border border-sky-100/50">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-sky-100 flex items-center justify-center shrink-0 shadow-sm">
                                            <Globe className="w-5 h-5" style={{ color: brandColor }} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Web Portal</span>
                                            <a 
                                                href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-primary-600 hover:underline font-semibold text-sm mt-0.5 block"
                                                style={{ color: brandColor }}
                                            >
                                                {business.website}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
};

export { ShopProfile };
