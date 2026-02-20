import React, { useState } from 'react';
import {
    HelpCircle, MessageCircle, Shield,
    Search, ChevronDown, ChevronUp,
    ShoppingBag, User, ShieldCheck, CreditCard,
    ExternalLink
} from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

interface FAQ {
    question: string;
    answer: string;
    category: string;
}

const faqs: FAQ[] = [
    // Buying
    {
        category: 'buying',
        question: 'How do I buy an item on Suqafuran?',
        answer: 'Buying is simple! Browse or search for items, click on a listing you like, and use the "Chat" or "Reveal Phone" buttons to contact the seller directly. Always meet in person in a safe, public place to inspect the item before paying.'
    },
    {
        category: 'buying',
        question: 'Are the prices negotiable?',
        answer: 'Many sellers are open to offers. You can discuss the price with the seller through our in-app chat or by calling them. Look for the "Negotiable" tag on listings.'
    },
    // Selling
    {
        category: 'selling',
        question: 'How do I post an ad?',
        answer: 'Click the "Post New Ad" button in your dashboard or the "Sell Now" button in the header. Choose a category, upload clear photos, add a descriptive title and price, then click "Post Listing". It\'s free!'
    },
    {
        category: 'selling',
        question: 'How can I sell my items faster?',
        answer: 'To sell faster: 1. Use high-quality photos. 2. Write a detailed description. 3. Set a fair, competitive price. 4. Become a "Verified Seller" to build more trust with buyers.'
    },
    // Safety
    {
        category: 'safety',
        question: 'How do I stay safe while trading?',
        answer: 'Safety is our priority. Always meet in public places (like malls or cafes), never send money before seeing the item, and trust your instincts. If a deal seems too good to be true, it probably is.'
    },
    {
        category: 'safety',
        question: 'What is the Verified Seller program?',
        answer: 'Our Verified Seller program badges sellers who have provided official ID documentation. This helps buyers identify trustworthy partners. You can apply for verification in your account settings.'
    },
    // Account
    {
        category: 'account',
        question: 'How do I change my password?',
        answer: 'Go to "Account Settings" from your dashboard sidebar. In the "Security" tab, you can update your password and manage your active sessions.'
    },
    {
        category: 'account',
        question: 'I forgot my password, what should I do?',
        answer: 'On the login page, click "Forgot Password?". Enter your email address, and we\'ll send you a secure link to reset it.'
    }
];

const HelpCenterPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const categories = [
        { id: 'all', label: 'All Topics', icon: HelpCircle },
        { id: 'buying', label: 'Buying', icon: ShoppingBag },
        { id: 'selling', label: 'Selling', icon: TagIcon },
        { id: 'safety', label: 'Safety', icon: ShieldCheck },
        { id: 'account', label: 'Account', icon: User },
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
                    <h1 className="text-3xl font-bold mb-4">How can we help you?</h1>
                    <p className="text-primary-100 mb-8 max-w-2xl">
                        Find answers to common questions about buying, selling, and staying safe on Suqafuran.
                    </p>

                    <div className="relative max-w-xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search for help (e.g. 'how to sell', 'verification'...)"
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
                    <h3 className="font-bold text-gray-900 px-4 mb-2">Categories</h3>
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
                                {activeCategory === 'all' ? 'Frequently Asked Questions' : `${categories.find(c => c.id === activeCategory)?.label}`}
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
                                                        Was this helpful? <span className="text-gray-400 font-normal ml-2 hover:text-green-600 cursor-pointer">Yes</span> <span className="text-gray-400 font-normal hover:text-red-500 cursor-pointer">No</span>
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
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">No results found</h3>
                                    <p className="text-gray-500 text-sm">We couldn't find any help articles matching "{searchQuery}"</p>
                                    <Button
                                        variant="ghost"
                                        className="mt-4 font-bold text-primary-600"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        Clear search
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
                                <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
                                <p className="text-sm text-gray-500 mb-3">Available 8 AM - 8 PM</p>
                                <button className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">Start Chat</button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Safety Tips</h3>
                                <p className="text-sm text-gray-500 mb-3">Learn to trade safely</p>
                                <button className="text-sm font-bold text-green-600 hover:text-green-700 hover:underline flex items-center gap-1">
                                    Read Guide <ExternalLink className="h-3 w-3" />
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
