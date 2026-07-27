import React from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import {
    ShieldAlert, Eye, MessageSquare,
    MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SafetyTipsPage: React.FC = () => {
    const { t } = useTranslation();

    const tips = [
        {
            title: t('safety.meetInPublic'),
            desc: t('safety.meetInPublicDesc'),
            icon: MapPin,
            color: 'text-primary-600',
            bg: 'bg-primary-50'
        },
        {
            title: t('safety.inspectItem'),
            desc: t('safety.inspectItemDesc'),
            icon: Eye,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            title: t('safety.payOnDelivery'),
            desc: t('safety.payOnDeliveryDesc'),
            icon: ShieldAlert,
            color: 'text-red-600',
            bg: 'bg-red-50'
        },
        {
            title: t('safety.useSecureChat'),
            desc: t('safety.useSecureChatDesc'),
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
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('safety.title')}</h1>
                        <p className="text-gray-500 text-lg">{t('safety.subtitle')}</p>
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
                                <h2 className="text-2xl font-bold mb-4 italic">{t('safety.reportScamTitle')}</h2>
                                <p className="text-primary-100 mb-0 opacity-90">
                                    {t('safety.reportScamDesc')}
                                </p>
                            </div>
                            <button className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-bold whitespace-nowrap hover:bg-primary-50 transition-colors shadow-lg">
                                {t('safety.reportIssue')}
                            </button>
                        </div>
                    </div>

                    <div className="mt-20">
                        <h3 className="text-xl font-bold mb-8 text-center uppercase tracking-widest text-gray-400">{t('safety.scamSigns')}</h3>
                        <div className="space-y-4">
                            {[
                                t('safety.scam1'),
                                t('safety.scam2'),
                                t('safety.scam3'),
                                t('safety.scam4'),
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
