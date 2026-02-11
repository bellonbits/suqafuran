import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import { Search, MapPin, TrendingUp, ShieldCheck, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';
import { getCategoryIcon } from '../utils/categoryIcons';
import { MOCK_CATEGORIES, MOCK_LISTINGS } from '../data/mockData';

const HERO_SLIDES = [
    {
        image: '',
        title: <>The Safest Way to Buy and Sell <br className="hidden md:block" /> Almost Anything in Somalia</>,
        subtitle: 'Join thousands of traders buying and selling vehicles, electronics, property, and more every day.'
    },
    {
        image: '',
        title: <>Find Your Dream Property <br className="hidden md:block" /> in Mogadishu & Beyond</>,
        subtitle: 'From luxury villas to affordable apartments, explore the best real estate deals in Somalia.'
    },
    {
        image: '',
        title: <>Upgrade Your Tech with <br className="hidden md:block" /> Trusted Local Sellers</>,
        subtitle: 'Get the latest iPhones, laptops, and solar kits at unbeatable prices from verified merchants.'
    }
];

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const { data: featuredAds, isLoading: adsLoading } = useQuery({
        queryKey: ['featured-ads'],
        queryFn: () => listingService.getListings({ limit: 12 }),
    });

    const displayCategories = (categories && categories.length > 0) ? categories : MOCK_CATEGORIES;
    const displayAds = (featuredAds && featuredAds.length > 0) ? featuredAds : MOCK_LISTINGS;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 60000); // 1 minute
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

    return (
        <PublicLayout>
            {/* Hero Section */}
            <section className="relative bg-primary-600 text-white overflow-hidden min-h-[600px] lg:h-[calc(100vh-64px)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                    >
                        {HERO_SLIDES[currentSlide].image ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] scale-110"
                                style={{ backgroundImage: `url('${HERO_SLIDES[currentSlide].image}')` }}
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600" />
                        )}
                        {/* Removed dark overlays for pure light blue look */}
                    </motion.div>
                </AnimatePresence>

                <div className="container mx-auto px-4 h-full relative z-10 flex flex-col justify-center text-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight drop-shadow-lg">
                                {HERO_SLIDES[currentSlide].title}
                            </h1>
                            <p className="text-lg md:text-xl text-white mb-10 max-w-2xl mx-auto drop-shadow-md">
                                {HERO_SLIDES[currentSlide].subtitle}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="max-w-3xl mx-auto w-full flex flex-col md:flex-row gap-3 p-2 bg-white/20 backdrop-blur-xl rounded-2xl md:rounded-full shadow-2xl border border-white/20">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="What are you looking for?"
                                className="w-full h-12 pl-12 pr-4 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                            />
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                        <div className="w-full md:w-60 relative">
                            <input
                                type="text"
                                placeholder="All Locations"
                                className="w-full h-12 pl-12 pr-4 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                            />
                            <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                        <Button variant="secondary" size="lg" className="rounded-full shadow-lg h-12">
                            Search Now
                        </Button>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-primary-50">
                        <span>Popular:</span>
                        <button className="underline hover:text-white transition-colors">Toyota Corolla</button>
                        <button className="underline hover:text-white transition-colors">Samsung S24</button>
                        <button className="underline hover:text-white transition-colors">Apartments</button>
                        <button className="underline hover:text-white transition-colors">Electronics</button>
                    </div>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                        {HERO_SLIDES.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === idx ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Arrow Controls */}
                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white backdrop-blur-sm transition-all hidden md:block"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white backdrop-blur-sm transition-all hidden md:block"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </section>

            {/* Categories & Main Grid Section */}
            <section className="py-8 bg-[#f4f7f6]">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Sidebar Categories (As seen in Jiji Reference) */}
                        <aside className="hidden lg:block w-72 shrink-0">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
                                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <div className="w-1 h-4 bg-primary-600 rounded-full" />
                                        Categories
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-50 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                                    {displayCategories?.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => navigate(`/category/${cat.id}`)}
                                            className="w-full flex items-center justify-between p-3.5 hover:bg-primary-50 transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-primary-600 group-hover:text-white transition-all">
                                                    {(() => {
                                                        const Icon = getCategoryIcon(cat.icon_name);
                                                        return <Icon size={18} />;
                                                    })()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 group-hover:text-primary-700">{cat.name}</p>
                                                    <p className="text-[10px] text-gray-400 group-hover:text-primary-400">Thousands of ads</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Main Feed Area */}
                        <div className="flex-1 space-y-6">
                            {/* Showcase Info Cards (As seen in Jiji Reference) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-primary-100 hover:border-primary-300 transition-all cursor-pointer group flex items-center gap-4">
                                    <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
                                        <div className="absolute inset-0 opacity-10 bg-primary-600 animate-pulse" />
                                        <ShieldCheck className="w-8 h-8 text-primary-600 z-10" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">Apply for Job</h4>
                                        <p className="text-xs text-gray-500">Find your dream career today</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                                </div>

                                <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-secondary-100 hover:border-secondary-300 transition-all cursor-pointer group flex items-center gap-4">
                                    <div className="w-16 h-16 bg-secondary-50 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
                                        <div className="absolute inset-0 opacity-10 bg-secondary-600 animate-pulse" />
                                        <TrendingUp className="w-8 h-8 text-secondary-600 z-10" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 group-hover:text-secondary-700 transition-colors">How to Sell</h4>
                                        <p className="text-xs text-gray-500">Get guidelines for safe selling</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-secondary-600 group-hover:translate-x-1 transition-all" />
                                </div>

                                <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-primary-100 hover:border-primary-300 transition-all cursor-pointer group flex items-center gap-4">
                                    <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
                                        <div className="absolute inset-0 opacity-10 bg-primary-600 animate-pulse" />
                                        <Search className="w-8 h-8 text-primary-600 z-10" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">How to Buy</h4>
                                        <p className="text-xs text-gray-500">Shop securely with Escrow</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>

                            {/* Trending Grid */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-secondary-500" />
                                        <h2 className="text-xl font-bold text-gray-900">Trending Ads</h2>
                                    </div>
                                    <Button variant="ghost" className="text-primary-600 text-sm" onClick={() => navigate('/search')}>See all</Button>
                                </div>

                                {adsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                        {displayAds?.map((ad, idx) => (
                                            <ProductCard
                                                key={ad.id}
                                                id={String(ad.id)}
                                                title={ad.title || ''}
                                                price={ad.price || 0}
                                                location={ad.location || ''}
                                                imageUrl={ad.images?.[0] || ''}
                                                isVerified={ad.owner?.is_verified}
                                                isPromoted={(ad.boost_level ?? 0) > 0}
                                                isPopular={idx < 2}
                                                rating={4.8 + (idx / 10)}
                                                registrationAge={idx % 2 === 0 ? "3+ Years on platform" : "Verified ID"}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile Categories (Scrollable) */}
            <section className="py-6 lg:hidden bg-white overflow-hidden">
                <div className="container mx-auto px-4">
                    <h3 className="font-bold text-gray-900 mb-4 text-sm px-1">Top Categories</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                        {displayCategories?.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => navigate(`/category/${cat.id}`)}
                                className="flex flex-col items-center gap-2 min-w-[80px] group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 group-active:bg-primary-600 group-active:text-white transition-all">
                                    {(() => {
                                        const Icon = getCategoryIcon(cat.icon_name);
                                        return <Icon size={24} />;
                                    })()}
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 text-center line-clamp-1">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-gray-900 text-white relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-600/10 skew-x-12 transform origin-top-right"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to declutter and <br /> make some money?</h2>
                        <p className="text-lg text-gray-400 mb-10">
                            Thousands of potential buyers are searching for what you have right now.
                            Start selling in less than 2 minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="rounded-full px-10 text-lg">Post an Ad Now</Button>
                            <Button size="lg" variant="ghost" className="rounded-full px-10 text-lg border border-white/20 text-white hover:bg-white/10">Learn How to Sell</Button>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export { LandingPage };
