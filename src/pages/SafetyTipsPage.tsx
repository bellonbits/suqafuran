import React from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import {
    ShieldAlert, Eye, MessageSquare,
    MapPin
} from 'lucide-react';

const SafetyTipsPage: React.FC = () => {
    const tips = [
        {
            title: 'Meet in Public',
            desc: 'Always meet the seller or buyer in a well-lit, busy public place like a mall or police station.',
            icon: MapPin,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Inspect the Item',
            desc: 'Never pay before you see and test the item yourself. Check for functionality and condition.',
            icon: Eye,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            title: 'Pay on Delivery',
            desc: 'Do not send money in advance via M-Pesa or bank transfer. Pay only after receiving the item.',
            icon: ShieldAlert,
            color: 'text-red-600',
            bg: 'bg-red-50'
        },
        {
            title: 'Use Secure Chat',
            desc: 'Keep all communications within the Suqafuran chat to have a record of your conversation.',
            icon: MessageSquare,
            color: 'text-primary-600',
            bg: 'bg-primary-50'
        }
    ];

    return (
        <PublicLayout>
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-16">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Your Safety is Our Priority</h1>
                        <p className="text-gray-500 text-lg">Follow these simple guidelines to ensure a safe trading experience on Suqafuran.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {tips.map((tip) => (
                            <div key={tip.title} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-6">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", tip.bg)}>
                                    <tip.icon className={cn("h-7 w-7", tip.color)} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tip.title}</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">{tip.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 bg-primary-600 rounded-3xl p-10 text-white relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full translate-x-1/2 translate-y-1/2"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-4 italic">Spot a Scam? Report it Immediately!</h2>
                                <p className="text-primary-100 mb-0 opacity-90">
                                    Our moderation team works 24/7 to remove suspicious listings. If an ad looks too good to be true,
                                    it probably is. Help us keep Suqafuran safe by reporting any suspicious behavior.
                                </p>
                            </div>
                            <button className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-bold whitespace-nowrap hover:bg-primary-50 transition-colors shadow-lg">
                                Report an Issue
                            </button>
                        </div>
                    </div>

                    <div className="mt-20">
                        <h3 className="text-xl font-bold mb-8 text-center uppercase tracking-widest text-gray-400">Common Signs of Scams</h3>
                        <div className="space-y-4">
                            {[
                                'Unrealistically low prices for high-end items.',
                                'Sellers who refuse to meet in person.',
                                'Requests for advanced payment or shipping fees.',
                                'Sellers who ask for personal information like passwords or OTPs.',
                            ].map((sign, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100">
                                    <span className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-sm shrink-0">!</span>
                                    <p className="text-gray-700 text-sm font-medium">{sign}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

import { cn } from '../utils/cn';

export { SafetyTipsPage };
