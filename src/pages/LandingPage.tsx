import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProductCard } from '../components/ProductCard';
import { listingService } from '../services/listingService';
import { Search, MapPin, TrendingUp, ShieldCheck, Loader2, ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '../components/Button';
import { getCategoryIcon } from '../utils/categoryIcons';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { JIJI_CATEGORIES } from '../utils/jijiCategories';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
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

    return (
        <PublicLayout>
            {/* Hero Section - Jiji Style with Bright Blue 300 */}
            <section className="relative bg-primary-300 pt-12 pb-20 z-30 overflow-hidden">
                <div className="container mx-auto px-4 h-full relative z-10 flex flex-col items-center">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-8 tracking-tight drop-shadow-sm">
                        What are you looking for?
                    </h1>

                    <div className="max-w-4xl w-full flex flex-col md:flex-row shadow-2xl rounded-xl md:rounded-lg overflow-hidden border border-white/10">
                        {/* Location Picker Trigger */}
                        <div className="relative bg-white md:w-1/3 md:border-r border-gray-100">
                            <button
                                onClick={() => setLocationOpen(true)}
                                className="w-full h-14 pl-4 pr-10 text-gray-700 focus:outline-none text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <span className="truncate font-medium">{selectedLocation || "All Somalia"}</span>
                                <MapPin className="ml-2 w-4 h-4 text-primary-500" />
                            </button>
                        </div>

                        {/* Search Input Area */}
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

                    {/* Hierarchical Location Picker Modal */}
                    <LocationPickerModal
                        isOpen={isLocationOpen}
                        onClose={() => setLocationOpen(false)}
                        onSelect={(location) => {
                            setSelectedLocation(location === "All Somalia" ? "" : location.split(',')[0]);
                        }}
                    />

                    <div className="mt-8 flex flex-wrap justify-center gap-6 text-[11px] font-bold text-white/90 uppercase tracking-widest">
                        <span className="opacity-60">Popular:</span>
                        <button className="hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">Toyota Corolla</button>
                        <button className="hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">Samsung S24</button>
                        <button className="hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">Apartments</button>
                    </div>
                </div>
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
                                            className="absolute left-[calc(100%+0.5rem)] top-0 w-[750px] min-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex"
                                            onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                                            onMouseLeave={() => setHoveredCategory(null)}
                                        >
                                            {(() => {
                                                const activeCat = JIJI_CATEGORIES.find(c => c.id === hoveredCategory);
                                                if (!activeCat) return null;

                                                return (
                                                    <>
                                                        {/* Left side: Subcategories */}
                                                        <div className="flex-1 p-8 flex flex-col">
                                                            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
                                                                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner">
                                                                    {(() => {
                                                                        const Icon = getCategoryIcon(activeCat.icon);
                                                                        return <Icon size={32} />;
                                                                    })()}
                                                                </div>
                                                                <div>
                                                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{activeCat.label}</h2>
                                                                    <p className="text-sm text-primary-600 font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
                                                                        Browse Best Deals
                                                                        <ChevronRight size={14} />
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 content-start flex-1 overflow-y-auto custom-scrollbar pr-2">
                                                                {activeCat.subcategories.map((sub, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => {
                                                                            navigate(`/category/${activeCat.id}?subcategory=${sub.name}`);
                                                                            setHoveredCategory(null);
                                                                        }}
                                                                        className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-primary-100 hover:bg-primary-50/50 transition-all text-left group"
                                                                    >
                                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                                                            <img
                                                                                src={sub.image || activeCat.image}
                                                                                alt={sub.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-700 line-clamp-2 leading-tight">
                                                                            {sub.name.replace(/^\d+\s/, '')}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <div className="mt-8 pt-6 border-t border-gray-100">
                                                                <button
                                                                    onClick={() => {
                                                                        navigate(`/category/${activeCat.id}`);
                                                                        setHoveredCategory(null);
                                                                    }}
                                                                    className="flex items-center gap-2 text-primary-600 font-bold hover:gap-3 transition-all"
                                                                >
                                                                    View all in {activeCat.label.split(' (')[0]}
                                                                    <ChevronRight size={18} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Right side: Featured Category Image */}
                                                        <div className="w-64 bg-gray-50 relative overflow-hidden group/featured">
                                                            <img
                                                                src={activeCat.image}
                                                                alt={activeCat.label}
                                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/featured:scale-110"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                                            <div className="absolute bottom-0 left-0 p-6 text-white">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-80">Featured</p>
                                                                <h4 className="text-lg font-bold leading-tight">{activeCat.label.split(' (')[0]}</h4>
                                                            </div>
                                                        </div>
                                                    </>
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
                            {/* Showcase Info Cards (As seen in Jiji Screenshot) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    onClick={() => navigate('/post-ad')}
                                    className="bg-[#ebf9eb] border border-[#d3f0d3] p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between min-h-[100px]"
                                >
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-[#2d3a2d] text-lg">I want to sell</h4>
                                        <p className="text-sm text-[#5a705a]">Post an ad for free now</p>
                                    </div>
                                    <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 text-[#28a745]" />
                                    </div>
                                </div>

                                <div
                                    className="bg-[#f0f0ff] border border-[#e0e0ff] p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between min-h-[100px]"
                                >
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-[#2e2e4e] text-lg">How to buy</h4>
                                        <p className="text-sm text-[#62628e]">Safety tips and guidelines</p>
                                    </div>
                                    <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <ShieldCheck className="w-8 h-8 text-[#5151d5]" />
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Categories (Scrollable) */}
                            <div className="lg:hidden overflow-hidden -mx-4 px-4">
                                <h3 className="font-bold text-gray-900 mb-4 text-sm">Top Categories</h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                    {displayCategories?.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => navigate(`/category/${cat.slug || cat.id}`)}
                                            className="flex flex-col items-center gap-2 min-w-[80px] group"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 group-active:bg-primary-600 group-active:text-white transition-all">
                                                {(() => {
                                                    const Icon = getCategoryIcon(cat.icon_name || cat.slug);
                                                    return <Icon size={24} />;
                                                })()}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600 text-center line-clamp-1">{cat.name}</span>
                                        </button>
                                    ))}
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
                                                currency={ad.currency || 'USD'}
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
        </PublicLayout >
    );
};

export { LandingPage };
