import React, { useState } from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import {
    HelpCircle, MessageCircle, Shield,
    ArrowLeft, Search, ChevronDown, ChevronUp,
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
        <PublicLayout>
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-primary-600 to-primary-700 text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -ml-48 -mt-48"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-400 rounded-full blur-3xl -mr-48 -mb-48"></div>
                </div>

                <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-primary-100 hover:text-white mb-8 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Previous Page
                    </button>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Help Center</h1>
                    <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Find answers to common questions about buying, selling, and staying safe on Suqafuran.
                    </p>

                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-primary-300 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search for help (e.g. 'how to sell', 'verification'...)"
                            className="w-full h-16 pl-14 pr-6 rounded-2xl border-none bg-white/10 backdrop-blur-md text-white placeholder:text-primary-200 focus:bg-white focus:text-gray-900 focus:ring-4 focus:ring-primary-400/20 transition-all outline-none text-lg shadow-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Category Navigation */}
            <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                                    activeCategory === cat.id
                                        ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                                        : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                <cat.icon className="h-4 w-4" />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <MessageCircle className="h-6 w-6 text-primary-600" />
                        {activeCategory === 'all' ? 'Frequently Asked Questions' : `${categories.find(c => c.id === activeCategory)?.label} Questions`}
                    </h2>

                    {filteredFaqs.length > 0 ? (
                        <div className="space-y-4">
                            {filteredFaqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "bg-white rounded-2xl border transition-all overflow-hidden",
                                        expandedFaq === index
                                            ? "border-primary-200 shadow-lg shadow-primary-50"
                                            : "border-gray-100 hover:border-primary-100 hover:shadow-sm"
                                    )}
                                >
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left group"
                                    >
                                        <span className={cn(
                                            "font-bold transition-colors",
                                            expandedFaq === index ? "text-primary-600" : "text-gray-900 group-hover:text-primary-600"
                                        )}>
                                            {faq.question}
                                        </span>
                                        {expandedFaq === index ? (
                                            <ChevronUp className="h-5 w-5 text-primary-600 shrink-0" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400 shrink-0 group-hover:text-primary-600" />
                                        )}
                                    </button>
                                    {expandedFaq === index && (
                                        <div className="px-6 pb-6 text-gray-600 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="pt-2 border-t border-gray-50 mt-2">
                                                {faq.answer}
                                            </div>
                                            <div className="mt-4 flex items-center gap-4">
                                                <button className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline">
                                                    Was this helpful? <span className="text-gray-400 font-normal ml-2 hover:text-green-600">Yes</span> <span className="text-gray-400 font-normal hover:text-red-500">No</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Search className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                            <p className="text-gray-500">We couldn't find any help articles matching "{searchQuery}"</p>
                            <Button
                                variant="ghost"
                                className="mt-4 font-bold text-primary-600"
                                onClick={() => setSearchQuery('')}
                            >
                                Clear search and see all topics
                            </Button>
                        </div>
                    )}
                </div>

                {/* Safety Banner */}
                <div className="max-w-4xl mx-auto mt-20 mb-10">
                    <div className="bg-orange-50 rounded-[32px] p-8 md:p-12 border border-orange-100 flex flex-col md:flex-row items-center gap-8 group">
                        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 shrink-0 group-hover:scale-110 transition-transform">
                            <Shield className="h-10 w-10" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Trade safely on Suqafuran</h3>
                            <p className="text-gray-600 mb-4">Read our comprehensive safety guide to learn how to identify scams and protect yourself while buying and selling.</p>
                            <Button className="bg-orange-600 hover:bg-orange-700 text-white border-none rounded-full px-8 gap-2 group-hover:gap-3 transition-all">
                                View Safety Tips
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Technical Support Section */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="bg-gray-900 text-white rounded-[40px] p-10 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-4">Live Chat Support</h3>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Need technical help? Our support team is available from 8 AM to 8 PM to assist you with any platform issues.
                            </p>
                            <Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 h-12 font-extrabold w-full sm:w-auto">
                                Start Live Chat
                            </Button>
                        </div>
                        <MessageCircle className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5 group-hover:text-white/10 transition-colors" />
                    </div>

                    <div className="bg-primary-50 rounded-[40px] p-10 border border-primary-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Contact via Email</h3>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                For inquiries about accounts, payments, or reporting suspicious activity, send us an email anytime.
                            </p>
                            <Button className="bg-primary-600 text-white border-none rounded-full px-8 h-12 font-bold w-full sm:w-auto" onClick={() => window.location.href = 'mailto:support@suqafuran.com'}>
                                support@suqafuran.com
                            </Button>
                        </div>
                        <CreditCard className="absolute -bottom-10 -right-10 h-64 w-64 text-primary-600/5 group-hover:text-primary-600/10 transition-colors" />
                    </div>
                </div>
            </div>
        </PublicLayout>
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
