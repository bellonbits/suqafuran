import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
    Shield, CheckCircle2, ChevronRight, HelpCircle, 
    ShoppingBag, MapPin, Eye, Lock, Award, ArrowLeft,
    Sparkles, RefreshCw, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Breadcrumb {
    name: string;
    url: string;
}

interface SEOResponse {
    title: string;
    meta_description: string;
    h1: string;
    seo_description: string;
    breadcrumbs: Breadcrumb[];
    faq_schema: any;
    schema_markup: any;
    listings: any[];
}

const ProgrammaticSEOPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const product = searchParams.get('product') || '';
    const city = searchParams.get('city') || '';
    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || '';
    const skill = searchParams.get('skill') || '';
    const service = searchParams.get('service') || '';

    const { data, isLoading } = useQuery<SEOResponse>({
        queryKey: ['seo-landing', product, city, category, country, skill, service],
        queryFn: async () => {
            const res = await api.get('/seo/landing', {
                params: { product, city, category, country, skill, service }
            });
            return res.data;
        }
    });

    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    // Inject meta tags and structured schemas dynamically into DOM head
    useEffect(() => {
        if (!data) return;

        // 1. Update Title and Description
        document.title = data.title;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', data.meta_description);

        // 2. Open Graph Title and Description
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', data.title);

        let ogDesc = document.querySelector('meta[property="og:description"]');
        if (!ogDesc) {
            ogDesc = document.createElement('meta');
            ogDesc.setAttribute('property', 'og:description');
            document.head.appendChild(ogDesc);
        }
        ogDesc.setAttribute('content', data.meta_description);

        // 3. Structured Data injection
        let scriptFaq = document.getElementById('seo-faq-jsonld') as HTMLScriptElement;
        if (!scriptFaq) {
            scriptFaq = document.createElement('script');
            scriptFaq.id = 'seo-faq-jsonld';
            scriptFaq.type = 'application/ld+json';
            document.head.appendChild(scriptFaq);
        }
        scriptFaq.textContent = JSON.stringify(data.faq_schema);

        let scriptMarkup = document.getElementById('seo-markup-jsonld') as HTMLScriptElement;
        if (!scriptMarkup) {
            scriptMarkup = document.createElement('script');
            scriptMarkup.id = 'seo-markup-jsonld';
            scriptMarkup.type = 'application/ld+json';
            document.head.appendChild(scriptMarkup);
        }
        scriptMarkup.textContent = JSON.stringify(data.schema_markup);

        return () => {
            scriptFaq?.remove();
            scriptMarkup?.remove();
        };
    }, [data]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
                <RefreshCw className="animate-spin text-primary-500 w-8 h-8 mb-3" />
                <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Generating Dynamic Market Guide...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-gray-50/40 pb-20">
            {/* Header / Hero Section */}
            <div className="relative bg-gradient-to-br from-sky-900 via-sky-850 to-indigo-950 text-white py-12 sm:py-16 overflow-hidden">
                {/* Visual Glassmorphic Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c7_1px,transparent_1px),linear-gradient(to_bottom,#0284c7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.08]" />
                
                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    {/* Back Navigation */}
                    <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-sky-200 hover:text-white mb-6 font-extrabold transition-colors">
                        <ArrowLeft size={14} /> Back to Marketplace
                    </Link>

                    {/* Breadcrumbs Navigation */}
                    <nav className="flex items-center gap-1.5 text-sky-200 text-xs font-semibold mb-4 flex-wrap">
                        {data.breadcrumbs.map((crumb, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <ChevronRight size={10} className="text-sky-400/50" />}
                                <Link to={crumb.url} className="hover:text-white transition-colors">{crumb.name}</Link>
                            </React.Fragment>
                        ))}
                    </nav>

                    {/* Dynamic H1 */}
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight max-w-3xl leading-tight">
                        {data.h1}
                    </h1>

                    {/* Meta Description Subheading */}
                    <p className="text-sky-100 text-sm sm:text-base max-w-2xl mt-4 font-medium leading-relaxed">
                        {data.meta_description}
                    </p>

                    {/* Trust Seals Badge row */}
                    <div className="flex flex-wrap items-center gap-4 mt-8 pt-6 border-t border-white/10 text-xs text-sky-200 font-bold">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                            <Shield size={14} className="text-green-400" />
                            Anti-Scam Verification
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                            <CheckCircle2 size={14} className="text-primary-400" />
                            Verified Local Sellers
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                            <Award size={14} className="text-yellow-400" />
                            Genuine Products Guaranteed
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: SEO Description & Matching Listings Grid */}
                <div className="lg:col-span-2 space-y-8">
                    {/* SEO-Rich Editorial Paragraph */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                            <Sparkles className="text-primary-500 w-5 h-5" />
                            Buyer's Market Guide
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed font-medium">
                            {data.seo_description}
                        </p>
                    </div>

                    {/* Matches Section */}
                    <div>
                        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center justify-between">
                            <span>Available Matches nearby</span>
                            <span className="text-xs bg-primary-50 text-primary-600 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                {data.listings.length} offers
                            </span>
                        </h3>

                        {data.listings.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                                <ShoppingBag className="mx-auto text-gray-300 w-12 h-12 mb-3" />
                                <h4 className="font-extrabold text-gray-800 text-sm">No items matching exactly currently posted</h4>
                                <p className="text-gray-400 text-xs mt-1.5 max-w-xs mx-auto">But don't worry! You can use our smart request search or post a wanted ad completely free.</p>
                                <Link to="/post-ad" className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md mt-5 transition-all active:scale-95">
                                    Post Wanted Ad
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.listings.map((item) => (
                                    <motion.div 
                                        key={item.id}
                                        whileHover={{ y: -4 }}
                                        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                                    >
                                        <div>
                                            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                                {item.images && item.images.length > 0 ? (
                                                    <img 
                                                        src={item.images[0]} 
                                                        alt={item.title_en} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ShoppingBag size={32} />
                                                    </div>
                                                )}
                                                {/* Price badge */}
                                                <span className="absolute left-3 bottom-3 bg-gray-900/90 text-white text-xs font-black px-2.5 py-1.5 rounded-xl backdrop-blur-sm">
                                                    ${item.price?.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="p-4">
                                                <h4 className="font-black text-gray-900 text-sm group-hover:text-primary-600 transition-colors line-clamp-1">
                                                    {item.title_en}
                                                </h4>
                                                <div className="flex items-center gap-3 text-gray-400 text-[10px] font-bold uppercase mt-2 tracking-wider">
                                                    <span className="flex items-center gap-0.5">
                                                        <MapPin size={11} />
                                                        {item.location}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Eye size={11} />
                                                        {item.views ?? 0} views
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 pt-0 border-t border-gray-50 flex items-center gap-2 mt-2">
                                            <Link 
                                                to={`/listing/${item.id}`} 
                                                className="flex-1 text-center bg-primary-500 hover:bg-primary-600 text-white text-xs font-black py-2 rounded-xl transition-all shadow-sm shadow-primary-200"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: FAQs & Trust Center */}
                <div className="space-y-6">
                    {/* Dynamic FAQ Accordion */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                            <HelpCircle className="text-primary-500" size={18} />
                            Frequently Asked Questions
                        </h3>
                        <div className="space-y-3">
                            {data.faq_schema.mainEntity.map((faq: any, i: number) => (
                                <div key={i} className="border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                                    <button 
                                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between text-left text-xs font-black text-gray-800 hover:text-primary-600 transition-colors"
                                    >
                                        <span>{faq.name}</span>
                                        <span className="text-gray-400 font-normal shrink-0 ml-2">
                                            {activeFaq === i ? '−' : '+'}
                                        </span>
                                    </button>
                                    <AnimatePresence>
                                        {activeFaq === i && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="text-gray-500 text-[11px] font-medium leading-relaxed mt-2 pl-1 border-l-2 border-primary-500 bg-gray-50/50 p-2 rounded-lg">
                                                    {faq.acceptedAnswer.text}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trust and Safety Box */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100 shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-amber-200/10 rounded-full blur-xl" />
                        <h3 className="text-sm font-black text-amber-800 mb-2 flex items-center gap-2">
                            <Shield className="text-amber-600" size={18} />
                            Suqafuran Safety Seal
                        </h3>
                        <p className="text-amber-700 text-[11px] font-medium leading-relaxed mb-4">
                            All advertisements, user profiles, and transaction meet-up listings are strictly scanned with our active anti-scam algorithm.
                        </p>
                        <div className="space-y-2 text-[10px] text-amber-800 font-bold">
                            <div className="flex items-center gap-1.5">
                                <Lock size={12} className="text-amber-600" />
                                Meet in well-lit public spaces only
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-amber-600" />
                                Verify product condition before paying
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Star size={12} className="text-amber-600" />
                                Trust listings with 'Verified Merchant' tags
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgrammaticSEOPage;
