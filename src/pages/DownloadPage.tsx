import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Apple, Download, ChevronRight, CheckCircle, Star, Users, ShoppingBag, Zap } from 'lucide-react';


const DownloadPage: React.FC = () => {
    const { t } = useTranslation();
    const [apkClicked, setApkClicked] = useState(false);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{ background: 'linear-gradient(145deg, #f0f4ff 0%, #e8f5e9 100%)' }}
        >
            {/* Card */}
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div
                    className="relative px-6 pt-8 pb-6 text-center overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary-500, #2e7d32) 0%, var(--color-primary-400, #43a047) 100%)' }}
                >
                    {/* Decorative circles */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute -bottom-4 -left-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

                    {/* App icon */}
                    <div className="relative z-10 w-20 h-20 mx-auto mb-4 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden">
                        <img src="/pwa-icon-512.png" alt="Suqafuran" className="w-14 h-14 object-contain" />
                    </div>
                    <h1 className="relative z-10 text-2xl font-black text-white tracking-tight">Suqafuran</h1>
                    <p className="relative z-10 text-sm text-white/80 mt-1 font-medium">{t('download.heroSubtitle')}</p>

                    {/* Rating row */}
                    <div className="relative z-10 flex items-center justify-center gap-1 mt-3">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                        ))}
                        <span className="text-white/80 text-xs ml-1 font-semibold">{t('download.rating')}</span>
                    </div>
                </div>

                {/* Download buttons */}
                <div className="px-5 py-6 space-y-3">

                    {/* App Store */}
                    <a
                        href="https://apps.apple.com/ke/app/suqafuran-buy-sell-online/id6761457184"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                            <Apple className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t('footer.downloadApp')}</p>
                            <p className="text-base font-bold text-gray-900 -mt-0.5">{t('download.appStore')}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                    </a>

                    {/* Google Play — Coming Soon */}
                    <div className="relative flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 opacity-70 cursor-not-allowed select-none">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-gray-100 flex items-center justify-center">
                            {/* Google Play triangle icon */}
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                                <path d="M3.18 23.82A2 2 0 0 1 2 22V2A2 2 0 0 1 3.18.18L13.9 12 3.18 23.82z" fill="#4285F4"/>
                                <path d="M17.83 15.89L5.44 23.1l8.46-8.46 3.93 1.25z" fill="#34A853"/>
                                <path d="M22.13 13.28a1.8 1.8 0 0 1 0 3.44L18.2 19l-4.3-7 4.3-7 3.93 2.28a1.8 1.8 0 0 1 0 6z" fill="#FBBC05"/>
                                <path d="M5.44.9l12.39 7.2L13.9 12 5.44.9z" fill="#EA4335"/>
                            </svg>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t('footer.getUsOn')}</p>
                            <p className="text-base font-bold text-gray-900 -mt-0.5">{t('download.googlePlay')}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">{t('download.comingSoon')}</span>
                    </div>

                    {/* Direct APK */}
                    <a
                        href="/suqafuran.apk"
                        download="suqafuran.apk"
                        onClick={() => setApkClicked(true)}
                        className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl border border-primary-200 bg-primary-50 hover:bg-primary-100 active:scale-[0.98] transition-all group"
                        style={{ borderColor: 'var(--color-primary-200, #c8e6c9)', background: 'var(--color-primary-50, #f1f8e9)' }}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary-500, #2e7d32), var(--color-primary-400, #43a047))' }}
                        >
                            {apkClicked ? <CheckCircle className="w-5 h-5 text-white" /> : <Download className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{t('download.androidDirect')}</p>
                            <p className="text-base font-bold text-gray-900 -mt-0.5">
                                {apkClicked ? t('download.downloading') : t('download.downloadApk')}
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                    </a>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 text-center">
                    <a href="https://suqafuran.com" className="text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors">
                        suqafuran.com
                    </a>
                </div>
            </div>

            {/* Mini stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-sm">
                {[
                    { icon: Users, label: t('download.activeUsers'), value: '50k+' },
                    { icon: ShoppingBag, label: t('download.listings'), value: '100k+' },
                    { icon: Zap, label: t('download.dailyDeals'), value: '5k+' },
                ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm">
                        <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--color-primary-500, #2e7d32)' }} />
                        <p className="text-base font-black text-gray-900">{value}</p>
                        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export { DownloadPage };
