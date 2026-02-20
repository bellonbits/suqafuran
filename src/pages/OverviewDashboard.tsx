import React from 'react';

import { useAuthStore } from '../store/useAuthStore';
import {
    PlusCircle, ShoppingBag, MessageCircle,
    Heart, TrendingUp, ShieldCheck
} from 'lucide-react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';

import { dashboardService } from '../services/dashboardService';
import { useQuery } from '@tanstack/react-query';

const OverviewDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const firstName = user?.full_name?.split(' ')[0] || 'User';

    const { data: realStats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: dashboardService.getStats,
    });

    const stats = [
        { label: 'My Listings', value: realStats?.listings.toString() || '0', icon: ShoppingBag, color: 'text-primary-600', bg: 'bg-primary-50' },
        { label: 'Active Messages', value: realStats?.messages.toString() || '0', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Saved Ads', value: realStats?.favorites.toString() || '0', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Profile Views', value: realStats?.views || '0', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-10">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-gray-900">Hello, {firstName} 👋</h1>
                        {user?.is_verified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider border border-primary-100">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Verified
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1 italic">Welcome back to your marketplace manager.</p>
                </div>
                <Link to="/post-ad">
                    <Button className="rounded-xl h-12 px-8 gap-2 shadow-lg shadow-primary-200">
                        <PlusCircle className="h-5 w-5" />
                        Sell an Item
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-inner", stat.bg)}>
                            <stat.icon className={cn("h-6 w-6", stat.color)} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Action Center */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Verification Card */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 bg-primary-100/50 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck className="h-8 w-8 text-primary-600" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 tracking-tight">Become a Verified Seller</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Verified sellers receive a special badge, rank higher in search results, and
                            build more trust with potential buyers.
                        </p>
                    </div>
                    {user?.is_verified ? (
                        <div className="bg-green-50 text-green-700 px-6 py-3 rounded-xl border border-green-100 flex items-center justify-center gap-2 font-bold transition-all hover:bg-green-100 cursor-default">
                            <ShieldCheck className="h-5 w-5" />
                            Verification Active
                        </div>
                    ) : (
                        <Link to="/verification">
                            <Button variant="outline" className="w-fit rounded-xl border-2 font-bold px-8">Start Verification</Button>
                        </Link>
                    )}
                </div>

                {/* Tips Card */}
                <div className="bg-primary-600 p-8 rounded-3xl text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-3 tracking-tight italic">Tips for Selling Faster</h3>
                        <ul className="space-y-4 mt-6">
                            {[
                                'Use clear, high-quality photos',
                                'Set a competitive market price',
                                'Respond to messages promptly',
                                'Write a detailed description'
                            ].map((tip, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-primary-50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-400"></div>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Link to="/help" className="mt-8 text-xs font-bold uppercase tracking-widest text-primary-200 hover:text-white transition-colors relative z-10">
                        View Seller Guide →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export { OverviewDashboard };
