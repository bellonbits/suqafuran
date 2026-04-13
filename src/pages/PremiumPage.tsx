import React from 'react';
import { 
    Zap, Shield, Target, 
    Crown, Star, Check, 
    ArrowRight, Sparkles,
    Gem, TrendingUp, Clock
} from 'lucide-react';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';

export const PremiumPage: React.FC = () => {
    const packages = [
        {
            id: 'top-ad',
            name: 'Top Ad',
            description: 'Get 10x more views by staying at the top of category results.',
            price: 5,
            duration: '7 days',
            icon: Target,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-100',
            features: [
                'Top 3 placement in category',
                'Distinctive "Top" badge',
                'Renewed every 24 hours',
                'Valid for 1 week'
            ]
        },
        {
            id: 'diamond',
            name: 'Diamond Plan',
            description: 'Our most popular plan for professional sellers and high-value items.',
            price: 25,
            duration: '30 days',
            icon: Gem,
            color: 'text-primary-600',
            bgColor: 'bg-primary-50',
            borderColor: 'border-primary-100',
            popular: true,
            features: [
                '20x more views than basic',
                'Priority in search results',
                'Automated daily renewals',
                'Premium "Diamond" badge',
                'Valid for 1 month'
            ]
        },
        {
            id: 'vip',
            name: 'VIP Platinum',
            description: 'Maximum exposure across the entire platform. Sell in hours, not days.',
            price: 99,
            duration: '30 days',
            icon: Crown,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-100',
            features: [
                '100x more views guaranteed',
                'Placement on Homepage',
                'Unlimited ad renewals',
                'Personal Account Manager',
                'Exclusive "VIP" badge'
            ]
        }
    ];

    return (
        <div className="space-y-12 pb-20">
            {/* Hero Section */}
            <div className="relative bg-gray-900 rounded-[2.5rem] p-10 md:p-16 text-white overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
                
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-primary-300 text-xs font-black uppercase tracking-widest mb-6">
                        <Sparkles className="h-3.5 w-3.5" />
                        Premium Solutions
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                        Reach Millions of <span className="text-primary-400">Ready Buyers</span>
                    </h1>
                    <p className="text-lg text-gray-400 mb-10 leading-relaxed font-medium">
                        Suqafuran premium services give your ads the visibility they deserve. 
                        Professional sellers use our boosting plans to sell up to 100x faster.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm font-bold border-r border-white/10 pr-6 mr-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <span>100k+ Boosted Ads</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <span>24/7 Priority Support</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-gray-900">Choose Your Boost Plan</h2>
                    <p className="text-gray-500 font-medium">Pricing is calculated in USD for regional consistency.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {packages.map((pkg) => (
                        <div 
                            key={pkg.id} 
                            className={cn(
                                "group bg-white rounded-[2rem] p-8 border-2 transition-all duration-300 flex flex-col relative",
                                pkg.popular 
                                    ? "border-primary-500 shadow-2xl shadow-primary-200 scale-105 z-10" 
                                    : "border-gray-50 hover:border-gray-200 hover:shadow-xl"
                            )}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8", pkg.bgColor)}>
                                <pkg.icon className={cn("h-8 w-8", pkg.color)} />
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-2">{pkg.name}</h3>
                            <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                                {pkg.description}
                            </p>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-gray-900">${pkg.price}</span>
                                    <span className="text-gray-400 font-bold ml-1 text-sm">/ {pkg.duration}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {pkg.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", pkg.bgColor)}>
                                            <Check className={cn("h-3 w-3", pkg.color)} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button 
                                className={cn(
                                    "w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
                                    pkg.popular 
                                        ? "bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-200" 
                                        : "bg-gray-900 hover:bg-black text-white"
                                )}
                            >
                                Purchase Plan
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Why Boost Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12">
                <div className="space-y-6">
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">
                        Why Boost on <br /><span className="text-primary-600">Suqafuran?</span>
                    </h2>
                    <p className="text-gray-600 font-medium leading-relaxed">
                        With millions of users across the Horn of Africa, your listings can get lost 
                        among the thousands of ads posted every hour. Boosting puts you in the spotlight.
                    </p>
                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Instant Activation</h4>
                                <p className="text-sm text-gray-500">Your boost goes live immediately after payment confirmation.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Performance Tracking</h4>
                                <p className="text-sm text-gray-500">See exactly how many more views and clicks your boost generates.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-100 rounded-[2.5rem] p-8 flex flex-col justify-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <Shield className="h-64 w-64 text-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-primary-600 font-bold mb-2">
                            <Clock className="h-4 w-4" />
                            Real-time Analytics
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-4">Average Boost Results</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Views Increase', value: '450%', width: 'w-full' },
                                { label: 'Call Rate', value: '180%', width: 'w-[40%]' },
                                { label: 'Average Sale Time', value: '-65%', width: 'w-[65%]' },
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold text-gray-700">
                                        <span>{stat.label}</span>
                                        <span className={cn(i === 2 ? "text-green-600" : "text-primary-600")}>{stat.value}</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all duration-1000", i === 2 ? "bg-green-500" : "bg-primary-500", stat.width)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
