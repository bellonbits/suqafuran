import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import {
    Search, MapPin, TrendingUp, ShieldCheck, Loader2,
    ChevronRight, ShoppingBag, ArrowRight, Zap
} from 'lucide-react';
import { Button } from '../components/Button';
import { getCategoryIcon } from '../utils/categoryIcons';
import { LocationPickerModal } from '../components/LocationPickerModal';

// picsum.photos — seed-based, always loads, no auth needed
// Each seed gives a consistent unique photo every time
const CATEGORY_IMG_MAP: Array<{ keywords: string[]; url: string }> = [
    { keywords: ['raashin', 'food', 'cunto', 'grocery', 'restau', 'eat', 'meal'],
      url: 'https://picsum.photos/seed/grocery/200/200' },
    { keywords: ['dhar', 'fashion', 'cloth', 'wear', 'dress', 'shoe'],
      url: 'https://picsum.photos/seed/fashion/200/200' },
    { keywords: ['dhul', 'property', 'real', 'estate', 'land', 'guri', 'rent', 'hous'],
      url: 'https://picsum.photos/seed/house/200/200' },
    { keywords: ['xool', 'animal', 'livestock', 'cattle', 'goat', 'sheep', 'geela'],
      url: 'https://picsum.photos/seed/livestock/200/200' },
    { keywords: ['gaadii', 'car', 'vehicle', 'auto', 'motor', 'baabuur', 'truck'],
      url: 'https://picsum.photos/seed/cars/200/200' },
    { keywords: ['koront', 'electr', 'phone', 'mobile', 'laptop', 'computer', 'tech'],
      url: 'https://picsum.photos/seed/technology/200/200' },
    { keywords: ['alaab', 'furnitur', 'guriga', 'household', 'seat', 'bed', 'living'],
      url: 'https://picsum.photos/seed/furniture/200/200' },
    { keywords: ['agri', 'farm', 'beeraha', 'crop', 'harvest', 'plant'],
      url: 'https://picsum.photos/seed/farming/200/200' },
    { keywords: ['tool', 'hardware', 'build', 'equip'],
      url: 'https://picsum.photos/seed/tools/200/200' },
    { keywords: ['job', 'work', 'shaqo', 'employ', 'career'],
      url: 'https://picsum.photos/seed/office/200/200' },
    { keywords: ['service', 'adeeg', 'repair', 'fix', 'clean', 'salon', 'beauty'],
      url: 'https://picsum.photos/seed/salon/200/200' },
    { keywords: ['sport', 'ciyaar', 'gym', 'fitness', 'football'],
      url: 'https://picsum.photos/seed/sports/200/200' },
    { keywords: ['health', 'medical', 'caafimaad'],
      url: 'https://picsum.photos/seed/health/200/200' },
    { keywords: ['book', 'educat', 'school', 'waxbarasho'],
      url: 'https://picsum.photos/seed/books/200/200' },
];

const getCategoryImg = (cat: { slug?: string; name?: string }, index = 0): string => {
    const key = (cat.slug || cat.name || '').toLowerCase().replace(/[-_]/g, ' ');
    for (const item of CATEGORY_IMG_MAP) {
        if (item.keywords.some(k => key.includes(k))) return item.url;
    }
    return `https://picsum.photos/seed/cat${index}/200/200`;
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isLocationOpen, setLocationOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const { data: featuredAds, isLoading: adsLoading } = useQuery({
        queryKey: ['featured-ads'],
        queryFn: () => listingService.getListings({ limit: 12 }),
    });

    const displayCategories = categories || [];
    const displayAds = featuredAds || [];

    return (
        <PublicLayout>
            {/* ═══════════════════════════════════════════════
                MOBILE LAYOUT
            ═══════════════════════════════════════════════ */}
            <div className="lg:hidden bg-[#f7f9fc] min-h-screen">

                {/* Hero headline */}
                <div className="px-5 pt-6 pb-4">
                    <h1 className="text-[28px] font-extrabold text-gray-900 leading-tight tracking-tight">
                        Discover Great<br />Deals Near You !
                    </h1>
                </div>

                {/* Search bar */}
                <div className="px-5 mb-5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/search')}
                            className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 h-12 shadow-sm border border-gray-100 text-gray-400 active:bg-gray-50 transition-colors"
                        >
                            <Search className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="text-sm">Search listings…</span>
                        </button>
                        <button
                            onClick={() => setLocationOpen(true)}
                            className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0"
                        >
                            <MapPin className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Category chips — horizontal scroll */}
                <div className="mb-5">
                    <div className="flex gap-3 overflow-x-auto px-5 pb-2 hide-scrollbar">
                        {/* "All" chip */}
                        <button
                            onClick={() => setActiveCategory(null)}
                            className="flex flex-col items-center gap-1.5 shrink-0"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                                activeCategory === null
                                    ? 'bg-gray-900 shadow-lg'
                                    : 'bg-white border border-gray-200 shadow-sm'
                            }`}>
                                <TrendingUp className={`h-5 w-5 ${activeCategory === null ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <span className={`text-[10px] font-semibold ${activeCategory === null ? 'text-gray-900' : 'text-gray-500'}`}>All</span>
                        </button>

                        {displayCategories.slice(0, 12).map((cat, idx) => {
                            const isAct = activeCategory === String(cat.id);
                            const imgSrc = cat.image_url || getCategoryImg(cat, idx);
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setActiveCategory(String(cat.id));
                                        navigate(`/category/${cat.slug || cat.id}`);
                                    }}
                                    style={{ width: 60 }}
                                    className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
                                >
                                    <div
                                        className={`w-14 h-14 rounded-full overflow-hidden shrink-0 transition-all bg-gray-100 ${
                                            isAct ? 'ring-2 ring-primary-500 ring-offset-2 shadow-lg' : 'shadow-sm'
                                        }`}
                                    >
                                        <img
                                            src={imgSrc}
                                            alt={cat.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                                        />
                                    </div>
                                    <span
                                        className={`text-[10px] font-semibold text-center w-full ${isAct ? 'text-primary-600' : 'text-gray-500'}`}
                                        style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block' }}
                                    >
                                        {cat.name.split(' ')[0]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Featured promo banner */}
                <div className="mx-5 mb-6">
                    <div
                        onClick={() => navigate('/post-ad')}
                        className="relative overflow-hidden rounded-3xl p-5 active:scale-[0.98] transition-transform cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #1e3a4a 0%, #2d6a7a 60%, #7dcce9 100%)' }}
                    >
                        <div className="relative z-10">
                            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full mb-2 uppercase tracking-wider">
                                <Zap className="h-3 w-3" /> Free to post
                            </span>
                            <h3 className="text-white font-extrabold text-xl leading-tight mb-1">
                                The best place<br />+ to sell
                            </h3>
                            <p className="text-white/70 text-xs mb-3">Post your ad and reach 50,000+ buyers</p>
                            <div className="inline-flex items-center gap-1 bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">
                                Sell Now <ArrowRight className="h-3 w-3" />
                            </div>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                        <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/05" />
                    </div>
                </div>

                {/* Trending section header */}
                <div className="px-5 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary-500" />
                        <h2 className="text-base font-bold text-gray-900">Trending Ads</h2>
                    </div>
                    <button onClick={() => navigate('/search')} className="text-primary-500 text-sm font-semibold flex items-center gap-0.5 active:opacity-70">
                        See all <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Product grid */}
                {adsLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 px-5 pb-4">
                        {displayAds.map((ad, idx) => (
                            <ProductCard
                                key={ad.id}
                                id={String(ad.id)}
                                title={ad.title || ''}
                                price={ad.price || 0}
                                currency={ad.currency || 'USD'}
                                location={ad.location || ''}
                                imageUrl={ad.images?.[0] || ''}
                                isVerified={ad.owner?.is_verified}
                                isPromoted={(ad.boost_level ?? 0) > 0}
                                isPopular={idx < 2}
                                rating={4.8 + (idx / 10)}
                                registrationAge={idx % 2 === 0 ? '3+ Years' : 'Verified ID'}
                                className="rounded-2xl border-0 shadow-sm"
                            />
                        ))}
                    </div>
                )}

                {/* Sell CTA */}
                <div className="mx-5 mb-6">
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-900 text-base">I want to sell</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Post an ad for free in 2 mins</p>
                        </div>
                        <button
                            onClick={() => navigate('/post-ad')}
                            className="w-11 h-11 rounded-2xl bg-primary-500 flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                        >
                            <ShoppingBag className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Safety banner */}
                <div className="mx-5 mb-8">
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm">Buying safely</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Read our safety guidelines</p>
                        </div>
                        <button onClick={() => navigate('/safety')} className="shrink-0 text-primary-500">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                DESKTOP LAYOUT (unchanged structure, improved styling)
            ═══════════════════════════════════════════════ */}
            <div className="hidden lg:block">
                {/* Hero */}
                <section className="relative bg-primary-500 pt-14 pb-24">
                    <div className="container mx-auto px-4 flex flex-col items-center">
                        <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight">
                            What are you looking for?
                        </h1>
                        <div className="max-w-4xl w-full flex shadow-2xl rounded-2xl overflow-hidden border border-white/10">
                            <div className="relative bg-white w-1/3 border-r border-gray-100">
                                <button
                                    onClick={() => setLocationOpen(true)}
                                    className="w-full h-14 pl-4 pr-10 text-gray-700 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span className="truncate font-medium">{selectedLocation || 'All Locations'}</span>
                                    <MapPin className="ml-2 w-4 h-4 text-primary-500" />
                                </button>
                            </div>
                            <div className="flex-1 relative bg-white">
                                <input
                                    type="text"
                                    placeholder="I am looking for..."
                                    className="w-full h-14 pl-4 pr-14 text-gray-900 focus:outline-none placeholder:text-gray-400 font-medium"
                                />
                                <div className="absolute right-0 top-0 h-14 w-14 flex items-center justify-center text-gray-400">
                                    <Search className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories + Grid */}
                <section className="py-8 bg-[#f4f7f6]">
                    <div className="container mx-auto px-4">
                        <div className="flex gap-6">
                            {/* Sidebar */}
                            <aside className="w-72 shrink-0 relative z-20">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible sticky top-4">
                                    <div className="p-4 border-b border-primary-500 bg-primary-500 rounded-t-xl">
                                        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <div className="w-1 h-4 bg-white rounded-full" />
                                            Categories
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-gray-50 max-h-[calc(100vh-200px)] overflow-y-auto">
                                        {displayCategories.map((cat) => (
                                            <div
                                                key={cat.id}
                                                onMouseEnter={() => setHoveredCategory(cat.slug || String(cat.id))}
                                                className="group"
                                            >
                                                <button
                                                    onClick={() => navigate(`/category/${cat.slug || cat.id}`)}
                                                    className={`w-full flex items-center justify-between p-3.5 transition-colors text-left ${hoveredCategory === (cat.slug || String(cat.id)) ? 'bg-primary-50 text-primary-900' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${hoveredCategory === (cat.slug || String(cat.id)) ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-500'}`}>
                                                            {(() => {
                                                                const Icon = getCategoryIcon(cat.icon_name || cat.slug);
                                                                return <Icon size={18} />;
                                                            })()}
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-700">{cat.name}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mega menu */}
                                    <AnimatePresence>
                                        {hoveredCategory && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute left-[calc(100%+0.5rem)] top-0 w-[750px] min-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex"
                                                onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                                                onMouseLeave={() => setHoveredCategory(null)}
                                            >
                                                {(() => {
                                                    const activeCat = displayCategories.find(c => (c.slug || String(c.id)) === hoveredCategory);
                                                    if (!activeCat) return null;
                                                    return (
                                                        <>
                                                            <div className="flex-1 p-8 flex flex-col">
                                                                <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
                                                                    <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                                                                        {(() => {
                                                                            const Icon = getCategoryIcon(activeCat.icon_name || activeCat.slug);
                                                                            return <Icon size={32} />;
                                                                        })()}
                                                                    </div>
                                                                    <div>
                                                                        <h2 className="text-2xl font-bold text-gray-900">{activeCat.name}</h2>
                                                                        <p className="text-sm text-primary-600 font-medium flex items-center gap-1 mt-0.5">
                                                                            Browse Best Deals <ChevronRight size={14} />
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-y-4 gap-x-6 content-start flex-1 overflow-y-auto pr-2">
                                                                    {activeCat.subcategories?.map((sub, idx) => (
                                                                        <button
                                                                            key={sub.id || idx}
                                                                            onClick={() => {
                                                                                navigate(`/category/${activeCat.slug || activeCat.id}?subcategory=${sub.slug || sub.name}`);
                                                                                setHoveredCategory(null);
                                                                            }}
                                                                            className="flex items-center gap-3 p-2 rounded-xl hover:border-primary-100 hover:bg-primary-50/50 transition-all text-left group"
                                                                        >
                                                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                                                <img src={sub.image_url || activeCat.image_url || ''} alt={sub.name} className="w-full h-full object-cover" />
                                                                            </div>
                                                                            <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-700 line-clamp-2">
                                                                                {sub.name.replace(/^\d+\s/, '')}
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <div className="mt-8 pt-6 border-t border-gray-100">
                                                                    <button
                                                                        onClick={() => { navigate(`/category/${activeCat.slug || activeCat.id}`); setHoveredCategory(null); }}
                                                                        className="flex items-center gap-2 text-primary-600 font-bold hover:gap-3 transition-all"
                                                                    >
                                                                        View all in {activeCat.name.split(' (')[0]}
                                                                        <ChevronRight size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="w-64 bg-gray-50 relative overflow-hidden">
                                                                <img src={activeCat.image_url || ''} alt={activeCat.name} className="absolute inset-0 w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                                <div className="absolute bottom-0 left-0 p-6 text-white">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-80">Featured</p>
                                                                    <h4 className="text-lg font-bold">{activeCat.name.split(' (')[0]}</h4>
                                                                </div>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {hoveredCategory && <div className="absolute inset-y-0 -right-4 w-4 bg-transparent z-40" />}
                            </aside>

                            {/* Main feed */}
                            <div className="flex-1 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => navigate('/post-ad')}
                                        className="bg-[#ebf9eb] border border-[#d3f0d3] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between min-h-[100px]"
                                    >
                                        <div>
                                            <h4 className="font-bold text-[#2d3a2d] text-lg">I want to sell</h4>
                                            <p className="text-sm text-[#5a705a]">Post an ad for free now</p>
                                        </div>
                                        <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <ShoppingBag className="w-8 h-8 text-[#28a745]" />
                                        </div>
                                    </div>
                                    <div className="bg-[#f0f0ff] border border-[#e0e0ff] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between min-h-[100px]">
                                        <div>
                                            <h4 className="font-bold text-[#2e2e4e] text-lg">How to buy</h4>
                                            <p className="text-sm text-[#62628e]">Safety tips & guidelines</p>
                                        </div>
                                        <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <ShieldCheck className="w-8 h-8 text-[#5151d5]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-primary-500" />
                                            <h2 className="text-xl font-bold text-gray-900">Trending Ads</h2>
                                        </div>
                                        <Button variant="ghost" className="text-primary-600 text-sm" onClick={() => navigate('/search')}>See all</Button>
                                    </div>
                                    {adsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                                            {displayAds.map((ad, idx) => (
                                                <ProductCard
                                                    key={ad.id}
                                                    id={String(ad.id)}
                                                    title={ad.title || ''}
                                                    price={ad.price || 0}
                                                    currency={ad.currency || 'USD'}
                                                    location={ad.location || ''}
                                                    imageUrl={ad.images?.[0] || ''}
                                                    isVerified={ad.owner?.is_verified}
                                                    isPromoted={(ad.boost_level ?? 0) > 0}
                                                    isPopular={idx < 2}
                                                    rating={4.8 + (idx / 10)}
                                                    registrationAge={idx % 2 === 0 ? '3+ Years' : 'Verified ID'}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Desktop CTA */}
                <section className="py-12 bg-primary-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 skew-x-12 transform origin-top-right" />
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-3xl">
                            <h2 className="text-4xl font-bold mb-4 text-black">Ready to sell something today?</h2>
                            <p className="text-lg text-black/80 mb-8">Thousands of buyers are searching right now. Start in under 2 minutes.</p>
                            <div className="flex gap-4">
                                <Link to="/post-ad"><Button size="lg" className="rounded-full px-10 bg-white text-primary-600 hover:bg-gray-50 border-none shadow-xl">Post an Ad Now</Button></Link>
                                <Link to="/help"><Button size="lg" variant="outline" className="rounded-full px-10 border-white/40 text-black hover:bg-white/10">Learn How to Sell</Button></Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <LocationPickerModal
                isOpen={isLocationOpen}
                onClose={() => setLocationOpen(false)}
                onSelect={(location) => setSelectedLocation(location === 'All Locations' ? '' : location.split(',')[0])}
            />
        </PublicLayout>
    );
};

export { LandingPage };
