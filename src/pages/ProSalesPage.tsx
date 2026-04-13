import React from 'react';
import { ShoppingCart, Zap, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

export const ProSalesPage: React.FC = () => {

    const features = [
        { title: 'Priority Support', desc: 'Get faster responses from our support team.', icon: ShieldCheck },
        { title: 'Boosted Visibility', desc: 'Your ads appear 10x more often in search results.', icon: Zap },
        { title: 'Advanced Analytics', desc: 'Deep dive into your buyer demographics.', icon: TrendingUp },
    ];

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10 max-w-xl">
                    <h1 className="text-4xl font-black mb-4">Supercharge Your Sales</h1>
                    <p className="text-primary-100 mb-8 leading-relaxed">
                        Join Suqafuran Pro and get access to enterprise-grade tools to scale your business. 
                        Professional sellers sell up to 5x faster.
                    </p>
                    <Button className="bg-white text-primary-600 hover:bg-primary-50 rounded-xl px-10 h-14 font-black text-lg gap-2 border-none">
                        Go Pro Now
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
                {/* Abstract Background Design */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature) => (
                    <div key={feature.title} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-6">
                            <feature.icon className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <ShoppingCart className="h-16 w-16 text-gray-100 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">Manage Pro Subscriptions</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                    Track your active promotions, subscription renewals, and billing history all in one place.
                </p>
                <div className="mt-8 flex gap-4">
                    <Link to="/wallet">
                        <Button variant="outline" className="rounded-xl px-8 border-2">Check Balance</Button>
                    </Link>
                    <Button className="rounded-xl px-8">Upgrade Plans</Button>
                </div>
            </div>
        </div>
    );
};
