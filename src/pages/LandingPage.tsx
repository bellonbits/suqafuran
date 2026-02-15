import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import { Search, MapPin, TrendingUp, ShieldCheck, Loader2, ChevronLeft, ChevronRight, Tag, ListFilter } from 'lucide-react';
import { Button } from '../components/Button';
import { TrustPrompts } from '../components/TrustPrompts';
import { getCategoryIcon } from '../utils/categoryIcons';
import { SOMALI_REGIONS } from '../utils/somaliRegions';
import { JIJI_CATEGORIES } from '../utils/jijiCategories';

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
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [isLocationOpen, setLocationOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("");

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
            {/* Hero Section - Reduced to half screen height */}
            <section className="relative bg-primary-500 text-white min-h-[300px] lg:h-[40vh] z-30 overflow-hidden">
                {/* Background Pattern with Icons */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        {/* decorative icons staggered */}
                        <div className="grid grid-cols-6 gap-8 p-8 transform -rotate-12 scale-110">
                            {[...Array(24)].map((_, i) => (
                                <div key={i} className="flex justify-center items-center">
                                    {i % 4 === 0 && <MapPin className="w-12 h-12 text-white" />}
                                    {i % 4 === 1 && <Tag className="w-12 h-12 text-white" />}
                                    {i % 4 === 2 && <Search className="w-12 h-12 text-white" />}
                                    {i % 4 === 3 && <ListFilter className="w-12 h-12 text-white" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 h-full relative z-10 flex flex-col justify-center text-center">
                    {/* Text removed for cleaner Jiji-style look */}

                    <div className="max-w-3xl mx-auto w-full flex flex-col md:flex-row gap-3 p-2 bg-white/20 backdrop-blur-xl rounded-2xl md:rounded-full shadow-2xl border border-white/20">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="What are you looking for?"
                                className="w-full h-12 pl-12 pr-4 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                            />
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setLocationOpen(!isLocationOpen)}
                                className="w-full h-12 pl-12 pr-4 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary-500 text-left flex items-center justify-between"
                            >
                                <span className="truncate">{selectedLocation || "All Somalia"}</span>
                                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isLocationOpen ? 'rotate-90' : 'rotate-0'}`} />
                            </button>
                            <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />

                            {/* Jiji-style Location Picker Card */}
                            <AnimatePresence>
                                {isLocationOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 mt-2 w-full md:w-[400px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto custom-scrollbar"
                                    >
                                        <div className="p-2 sticky top-0 bg-white border-b border-gray-50 z-10">
                                            <input
                                                type="text"
                                                placeholder="Search city or region..."
                                                className="w-full p-2 bg-gray-50 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-secondary-500"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => { setSelectedLocation(""); setLocationOpen(false); }}
                                                className="w-full text-left p-2 hover:bg-primary-50 text-primary-600 font-semibold rounded-lg text-sm"
                                            >
                                                All Somalia
                                            </button>
                                            {SOMALI_REGIONS.map((region) => (
                                                <div key={region.name} className="mt-2">
                                                    <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                        {region.name}
                                                    </div>
                                                    {region.cities.map((city) => (
                                                        <button
                                                            key={city}
                                                            onClick={() => { setSelectedLocation(city); setLocationOpen(false); }}
                                                            className="w-full text-left p-2 hover:bg-gray-50 text-gray-700 text-sm rounded-lg flex items-center justify-between group"
                                                        >
                                                            <span>{city}</span>
                                                            {selectedLocation === city && <div className="w-2 h-2 rounded-full bg-secondary-500" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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

                    {/* Pagination Dots - Moved to relative to avoid overlap */}
                    <div className="mt-8 flex justify-center gap-2">
                        {HERO_SLIDES.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${currentSlide === idx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
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
                        {/* Sidebar Categories (Jiji Style) */}
                        <aside className="hidden lg:block w-72 shrink-0 relative z-20">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible sticky top-4">
                                <div className="p-4 border-b border-primary-500 bg-primary-500">
                                    <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <div className="w-1 h-4 bg-white rounded-full" />
                                        Categories
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-50 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar relative">
                                    {JIJI_CATEGORIES.map((cat) => (
                                        <div
                                            key={cat.id}
                                            onMouseEnter={() => setHoveredCategory(cat.id)}
                                            className="group"
                                        >
                                            <button
                                                onClick={() => navigate(`/category/${cat.id}`)}
                                                className={`w-full flex items-center justify-between p-3.5 transition-colors text-left ${hoveredCategory === cat.id ? 'bg-primary-50 text-primary-900' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${hoveredCategory === cat.id ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600'}`}>
                                                        {(() => {
                                                            const Icon = getCategoryIcon(cat.icon);
                                                            return <Icon size={18} />;
                                                        })()}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-semibold ${hoveredCategory === cat.id ? 'text-primary-900' : 'text-gray-700'}`}>{cat.label}</p>
                                                        {/* <p className="text-[10px] text-gray-400">{cat.count.toLocaleString()} ads</p> */}
                                                    </div>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 transition-all ${hoveredCategory === cat.id ? 'text-primary-500' : 'text-gray-300'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Mega Menu Overlay */}
                                <AnimatePresence>
                                    {hoveredCategory && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute left-[calc(100%+0.5rem)] top-0 w-[500px] min-h-[400px] bg-white rounded-xl shadow-2xl border border-gray-100 p-6 z-50"
                                            onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                                            onMouseLeave={() => setHoveredCategory(null)}
                                        >
                                            {(() => {
                                                const activeCat = JIJI_CATEGORIES.find(c => c.id === hoveredCategory);
                                                if (!activeCat) return null;

                                                return (
                                                    <div className="h-full flex flex-col">
                                                        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                                                            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                                                {(() => {
                                                                    const Icon = getCategoryIcon(activeCat.icon);
                                                                    return <Icon size={28} />;
                                                                })()}
                                                            </div>
                                                            <div>
                                                                <h2 className="text-2xl font-bold text-gray-900">{activeCat.label}</h2>
                                                                {/* <p className="text-secondary-600 font-medium">{activeCat.count.toLocaleString()} ads available</p> */}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-y-2 gap-x-8 content-start flex-1">
                                                            {activeCat.subcategories.map((sub, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href="#"
                                                                    className="flex items-center justify-between py-2 group hover:bg-gray-50 px-2 rounded-lg transition-colors"
                                                                >
                                                                    <span className="text-gray-600 group-hover:text-primary-600 font-medium">{sub.name}</span>
                                                                    {/* <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                                                        {sub.count.toLocaleString()} ads
                                                                    </span> */}
                                                                </a>
                                                            ))}
                                                        </div>

                                                        <div className="mt-auto pt-6 border-t border-gray-100">
                                                            <a href="#" className="flex items-center gap-2 text-primary-600 font-semibold hover:underline">
                                                                View all in {activeCat.label}
                                                                <ChevronRight size={16} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Hover trap to prevent menu from closing when moving cursor from sidebar to menu */}
                            {hoveredCategory && (
                                <div
                                    className="absolute inset-y-0 -right-4 w-4 bg-transparent z-40"
                                    onMouseEnter={() => { }}
                                />
                            )}
                        </aside>

                        {/* Main Feed Area */}
                        <div className="flex-1 space-y-6">
                            {/* Showcase Info Cards (As seen in Jiji Reference) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-primary-100 hover:border-primary-300 transition-all cursor-pointer group flex items-center gap-4">
                                    <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
                                        <div className="absolute inset-0 opacity-10 bg-primary-600 animate-pulse" />
                                        <ShieldCheck className="w-8 h-8 text-primary-500 z-10" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 group-hover:text-primary-500 transition-colors">Apply for Job</h4>
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
                                        <Search className="w-8 h-8 text-primary-500 z-10" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">How to Buy</h4>
                                        <p className="text-xs text-gray-500">Shop securely with Escrow</p>
                                    </div>
                                </div>
                            </div>

                            <TrustPrompts />

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
