import React, { useState, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
    Heart, MessageCircle, Share2, ShoppingBag, 
    Sparkles, X, MapPin, ShieldCheck,
    Volume2, VolumeX, MoreHorizontal, ChevronUp
} from 'lucide-react';
import { listingService } from '../services/listingService';
import { getImageUrl } from '../utils/imageUtils';
import { useLanguageField } from '../hooks/useLanguageField';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { formatConvertedPrice } from '../utils/currencyUtils';
import { Link, useNavigate } from 'react-router-dom';

const DiscoveryFeedPage: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [muted, setMuted] = useState(true);
    const { getField } = useLanguageField();
    const { currency: targetCurrency } = useCurrencyStore();
    const navigate = useNavigate();

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ['discovery-feed'],
        queryFn: ({ pageParam = 0 }) => listingService.getListings({ limit: 12, skip: pageParam }),
        getNextPageParam: (lastPage, allPages) => lastPage.length === 12 ? allPages.length * 12 : undefined,
        initialPageParam: 0,
    });

    const listings = data?.pages.flat() || [];

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const newIndex = Math.round(scrollTop / clientHeight);
        if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
        }

        // Fetch next page when user is close to the end of the current results
        if (scrollTop + clientHeight >= scrollHeight - clientHeight * 2) {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }
    };

    const handleShare = (listing: any) => {
        if (navigator.share) {
            navigator.share({
                title: getField(listing, 'title'),
                text: getField(listing, 'description'),
                url: window.location.origin + `/listing/${listing.id}`,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.origin + `/listing/${listing.id}`);
            alert('Link copied to clipboard!');
        }
    };

    const handleChat = (listing: any) => {
        navigate(`/messages?listingId=${listing.id}&sellerId=${listing.owner_id}`);
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full animate-pulse" />
                        <Sparkles className="h-10 w-10 text-primary-500 relative animate-bounce" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-80">Suqafuran Smart Shop</span>
                        <span className="text-primary-500/60 text-[8px] font-bold tracking-widest uppercase">Initializing Immersive Feed</span>
                    </div>
                </div>
            </div>
        );
    }

    const feedListings = listings || [];

    return (
        <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col font-sans select-none">
            
            {/* ── Fixed Overlay UI ── */}
            <div className="absolute top-0 inset-x-0 z-[60] p-6 pt-12 flex items-center justify-between pointer-events-none">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 pointer-events-auto active:scale-90 transition-transform shadow-2xl"
                >
                    <X className="h-5 w-5 text-white" />
                </button>

                <div className="flex flex-col items-center gap-1 pointer-events-auto">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl">
                        <Sparkles className="h-4 w-4 text-primary-400 animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Smart Shop Discovery</span>
                    </div>
                </div>

                <button 
                    onClick={() => setMuted(!muted)}
                    className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 pointer-events-auto active:scale-90 transition-transform shadow-2xl"
                >
                    {muted ? <VolumeX className="h-5 w-5 text-white/60" /> : <Volume2 className="h-5 w-5 text-primary-400" />}
                </button>
            </div>

            {/* ── Vertical Scroll Feed ── */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
                style={{ scrollSnapStop: 'always' }}
            >
                {feedListings.map((listing, i) => (
                    <div 
                        key={listing.id} 
                        className="h-full w-full snap-start relative flex flex-col justify-end overflow-hidden"
                    >
                        {/* 🎬 Cinematic Background */}
                        <div className="absolute inset-0 z-0">
                            <motion.img 
                                initial={{ scale: 1.1 }}
                                animate={{ scale: activeIndex === i ? 1 : 1.1 }}
                                transition={{ duration: 10, ease: "linear" }}
                                src={getImageUrl(listing.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc')} 
                                alt="" 
                                className="w-full h-full object-cover"
                            />
                            {/* Multilayered Gradients for maximum text contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />
                            <div className="absolute inset-0 bg-black/20" />
                        </div>

                        {/* 📱 Main Interaction Layer */}
                        <div className="relative z-10 w-full p-6 pb-28 flex items-end justify-between gap-6">
                            
                            {/* 📝 Listing Details (Left Side) */}
                            <div className="flex-1 min-w-0 flex flex-col gap-4">
                                
                                {/* Seller Meta */}
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-full border-2 border-white/20 p-0.5 overflow-hidden bg-black/20 backdrop-blur-md shrink-0">
                                            <img 
                                                src={getImageUrl(listing.owner?.avatar_url || undefined)} 
                                                className="w-full h-full object-cover rounded-full" 
                                                alt=""
                                            />
                                        </div>
                                        {listing.owner?.is_verified && (
                                            <div className="absolute -bottom-1 -right-1 bg-primary-500 rounded-full p-0.5 border-2 border-black">
                                                <ShieldCheck className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-sm font-black text-white leading-none tracking-tight">
                                            @{listing.owner?.full_name?.replace(/\s+/g, '').toLowerCase() || 'seller'}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Active Now</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white leading-[1.1] tracking-tight drop-shadow-xl">
                                        {getField(listing, 'title')}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-2xl font-black text-primary-400 tracking-tight drop-shadow-xl">
                                            {formatConvertedPrice(listing.price, listing.currency, targetCurrency)}
                                        </span>
                                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                            <MapPin size={10} className="text-white/60" />
                                            <span className="text-[10px] font-bold text-white/90">{listing.location}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/70 line-clamp-2 leading-relaxed font-medium drop-shadow-lg">
                                        {getField(listing, 'description')}
                                    </p>
                                </div>

                                {/* Main CTA */}
                                <div className="pt-2">
                                    <Link 
                                        to={`/listing/${listing.id}`}
                                        className="w-full bg-white text-black h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-sm active:scale-95 transition-all shadow-2xl hover:bg-gray-100"
                                    >
                                        <ShoppingBag size={20} className="text-primary-600" />
                                        VIEW LISTING DETAILS
                                    </Link>
                                </div>
                            </div>

                            {/* ⚡ Vertical Action Bar (Right Side) */}
                            <div className="flex flex-col items-center gap-7 shrink-0">
                                
                                {/* Like Button */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <button className="w-14 h-14 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 text-white active:scale-75 transition-all group">
                                        <Heart size={26} className="group-active:fill-red-500 group-active:text-red-500 transition-colors" />
                                    </button>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">Save</span>
                                </div>

                                {/* Chat Button */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <button 
                                        onClick={() => handleChat(listing)}
                                        className="w-14 h-14 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 text-white active:scale-75 transition-all"
                                    >
                                        <MessageCircle size={26} />
                                    </button>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">Chat</span>
                                </div>

                                {/* Share Button */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <button 
                                        onClick={() => handleShare(listing)}
                                        className="w-14 h-14 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 text-white active:scale-75 transition-all"
                                    >
                                        <Share2 size={24} />
                                    </button>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">Share</span>
                                </div>

                                {/* Report / More */}
                                <button className="w-10 h-10 flex items-center justify-center text-white/40">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* ── Fixed Navigation Navigation ── */}
            <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2 pointer-events-none z-[60]">
                <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/5 flex flex-col items-center gap-1">
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <ChevronUp className="h-4 w-4 text-primary-400" />
                    </motion.div>
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] ml-1">Next Discovery</span>
                </div>
            </div>
        </div>
    );
};

export default DiscoveryFeedPage;
