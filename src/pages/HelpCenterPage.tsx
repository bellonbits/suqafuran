import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    HelpCircle, MessageCircle, Shield,
    Search, ChevronDown, ChevronUp,
    ShoppingBag, User, ShieldCheck,
    ExternalLink
} from 'lucide-react';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';

interface FAQ {
    question: string;
    answer: string;
    category: string;
}

const HelpCenterPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const faqs: FAQ[] = [
        { category: 'buying', question: t('help.faqBuy1Q'), answer: t('help.faqBuy1A') },
        { category: 'buying', question: t('help.faqBuy2Q'), answer: t('help.faqBuy2A') },
        { category: 'selling', question: t('help.faqSell1Q'), answer: t('help.faqSell1A') },
        { category: 'selling', question: t('help.faqSell2Q'), answer: t('help.faqSell2A') },
        { category: 'safety', question: t('help.faqSafety1Q'), answer: t('help.faqSafety1A') },
        { category: 'safety', question: t('help.faqSafety2Q'), answer: t('help.faqSafety2A') },
        { category: 'account', question: t('help.faqAccount1Q'), answer: t('help.faqAccount1A') },
        { category: 'account', question: t('help.faqAccount2Q'), answer: t('help.faqAccount2A') },
    ];

    const categories = [
        { id: 'all', label: t('help.allTopics'), icon: HelpCircle },
        { id: 'buying', label: t('help.buying'), icon: ShoppingBag },
        { id: 'selling', label: t('help.selling'), icon: TagIcon },
        { id: 'safety', label: t('help.safety'), icon: ShieldCheck },
        { id: 'account', label: t('help.account'), icon: User },
    ];

    const filteredFaqs = faqs.filter(faq => {
        const matchesQuery = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
        return matchesQuery && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-primary-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-4">{t('help.heroTitle')}</h1>
                    <p className="text-primary-100 mb-8 max-w-2xl">
                        {t('help.heroSubtitle')}
                    </p>

                    <div className="relative max-w-xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('help.searchPlaceholder')}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border-none bg-white text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-primary-500/30 transition-all outline-none shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation - Visible on Desktop */}
                <div className="hidden lg:block space-y-2">
                    <h3 className="font-bold text-gray-900 px-4 mb-2">{t('help.categories')}</h3>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                                activeCategory === cat.id
                                    ? "bg-white text-primary-600 shadow-sm border border-gray-100"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <cat.icon className={cn("h-5 w-5", activeCategory === cat.id ? "text-primary-600" : "text-gray-400")} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Mobile Navigation - Scrollable */}
                <div className="lg:hidden col-span-full overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    <div className="flex gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                                    activeCategory === cat.id
                                        ? "bg-primary-600 text-white border-primary-600"
                                        : "bg-white text-gray-600 border-gray-200"
                                )}
                            >
                                <cat.icon className="h-4 w-4" />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main FAQ Content */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-primary-600" />
                                {activeCategory === 'all' ? t('help.faqTitle') : `${categories.find(c => c.id === activeCategory)?.label}`}
                            </h2>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, index) => (
                                    <div key={index} className="group transition-colors hover:bg-gray-50/50">
                                        <button
                                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                            className="w-full px-6 py-5 flex items-center justify-between text-left"
                                        >
                                            <span className={cn(
                                                "font-medium transition-colors",
                                                expandedFaq === index ? "text-primary-700" : "text-gray-900"
                                            )}>
                                                {faq.question}
                                            </span>
                                            {expandedFaq === index ? (
                                                <ChevronUp className="h-5 w-5 text-primary-600 shrink-0" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-400 shrink-0 group-hover:text-primary-600 transition-colors" />
                                            )}
                                        </button>
                                        {expandedFaq === index && (
                                            <div className="px-6 pb-6 text-gray-600 leading-relaxed text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                                <p>{faq.answer}</p>
                                                <div className="mt-4 flex items-center gap-4">
                                                    <button className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline">
                                                        {t('help.wasHelpful')} <span className="text-gray-400 font-normal ml-2 hover:text-green-600 cursor-pointer">{t('help.yes')}</span> <span className="text-gray-400 font-normal hover:text-red-500 cursor-pointer">{t('help.no')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <Search className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{t('help.noResults')}</h3>
                                    <p className="text-gray-500 text-sm">{t('help.noResultsDesc')} "{searchQuery}"</p>
                                    <Button
                                        variant="ghost"
                                        className="mt-4 font-bold text-primary-600"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        {t('help.clearSearch')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Support Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                <MessageCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">{t('help.liveChat')}</h3>
                                <p className="text-sm text-gray-500 mb-3">{t('help.liveChatHours')}</p>
                                <button className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">{t('help.startChat')}</button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">{t('help.safetyTipsTitle')}</h3>
                                <p className="text-sm text-gray-500 mb-3">{t('help.safetyTipsDesc')}</p>
                                <button className="text-sm font-bold text-green-600 hover:text-green-700 hover:underline flex items-center gap-1">
                                    {t('help.readGuide')} <ExternalLink className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Custom Icon for Selling
const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
        <path d="M7 7h.01" />
    </svg>
);

export { HelpCenterPage };
