import React from 'react';
import Link from 'next/link';
import { openCookieSettings } from '@/utils/cookieConsent';
import { Cookie } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer 
            style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)'
            }}
            className="border-t border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:!pb-6 text-slate-800 dark:text-neutral-100"
        >
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                {/* ─── Top Grid Sections ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-5">
                    {/* Brand Section */}
                    <div className="col-span-2 md:col-span-1 space-y-3">
                        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
                            <img src="/icon1.png" alt="Suqafuran Logo" className="h-7 w-auto object-contain" />
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                            Africa's trusted online marketplace. Buy, sell, chat, and transact securely directly with local buyers and verified sellers.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h3 className="text-xs font-extrabold text-slate-700 dark:text-neutral-200 uppercase tracking-wider">
                            Resources
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/search" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Browse Ads
                                </Link>
                            </li>
                            <li>
                                <Link href="/seller-dashboard/products/add" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Post a Listing
                                </Link>
                            </li>
                            <li>
                                <Link href="/seller-dashboard" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Seller Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support & Legal */}
                    <div>
                        <h3 className="text-xs font-extrabold text-slate-700 dark:text-neutral-200 uppercase tracking-wider">
                            Support &amp; Legal
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/help-center" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/safe-trading-tips" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Safe Trading Tips
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-of-use" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Terms of Use
                                </Link>
                            </li>
                            <li>
                                <Link href="/return-policy" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Return &amp; Refund Policy
                                </Link>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={openCookieSettings}
                                    className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300 flex items-center gap-1.5 cursor-pointer text-left"
                                >
                                    <Cookie className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                                    <span>Cookie Settings</span>
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Marketplace */}
                    <div>
                        <h3 className="text-xs font-extrabold text-slate-700 dark:text-neutral-200 uppercase tracking-wider">
                            Marketplace
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/orders" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    My Orders
                                </Link>
                            </li>
                            <li>
                                <Link href="/price-alerts" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Price Alerts
                                </Link>
                            </li>
                            <li>
                                <Link href="/saved-searches" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Saved Searches
                                </Link>
                            </li>
                            <li>
                                <Link href="/settings/notifications" className="text-xs font-medium text-slate-700 hover:text-sky-700 dark:text-neutral-300 dark:hover:text-sky-300">
                                    Notifications
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Regions */}
                    <div>
                        <h3 className="text-xs font-extrabold text-slate-700 dark:text-neutral-200 uppercase tracking-wider">
                            Regions
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Somalia</li>
                            <li className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Kenya</li>
                            <li className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Ethiopia</li>
                            <li className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Djibouti</li>
                        </ul>
                    </div>
                </div>

                {/* ─── Mobile App Download Section ───────────────────────────── */}
                <div className="mt-8 pt-7 border-t border-gray-100 dark:border-neutral-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-5 bg-slate-50/80 dark:bg-neutral-900/60 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-neutral-800">
                        <div className="space-y-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#005fb8] bg-sky-100 dark:text-sky-300 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full">
                                    Official Apps
                                </span>
                                <span className="text-xs font-bold text-slate-700 dark:text-neutral-200">
                                    Free on iOS &amp; Android
                                </span>
                            </div>
                            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                Download the Suqafuran Mobile App
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-lg leading-relaxed">
                                Chat directly with local verified sellers, receive instant deal notifications, and manage orders on the go.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                            {/* Google Play Store Badge */}
                            <a
                                href="https://play.google.com/store/apps/details?id=com.suqafuran.app&hl=en"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-black hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-900 dark:text-white border border-slate-200 dark:border-neutral-700 shadow-xs hover:shadow-md transition-all active:scale-95 group cursor-pointer"
                                title="Download Suqafuran on Google Play"
                            >
                                <img
                                    src="/google-play-icon.png"
                                    alt="Google Play"
                                    className="w-7 h-7 object-contain group-hover:scale-110 transition-transform shrink-0"
                                />
                                <div className="text-left">
                                    <span className="block text-[10px] font-bold text-gray-500 dark:text-neutral-400 leading-none uppercase tracking-wider">
                                        GET IT ON
                                    </span>
                                    <span className="block text-sm font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                                        Google Play
                                    </span>
                                </div>
                            </a>

                            {/* Apple App Store Badge */}
                            <a
                                href="https://apps.apple.com/ke/app/suqafuran-buy-sell-online/id6761457184"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-black hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-900 dark:text-white border border-slate-200 dark:border-neutral-700 shadow-xs hover:shadow-md transition-all active:scale-95 group cursor-pointer"
                                title="Download Suqafuran on Apple App Store"
                            >
                                <img
                                    src="/app-store-icon.png"
                                    alt="Apple App Store"
                                    className="w-7 h-7 object-contain group-hover:scale-110 transition-transform shrink-0"
                                />
                                <div className="text-left">
                                    <span className="block text-[10px] font-medium text-gray-500 dark:text-neutral-400 leading-none">
                                        Download on the
                                    </span>
                                    <span className="block text-sm font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                                        App Store
                                    </span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* ─── Bottom Copyright & Controls ───────────────────────────── */}
                <div className="mt-8 border-t border-gray-100 dark:border-neutral-800 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium">
                        &copy; {new Date().getFullYear()} Suqafuran Ltd. All rights reserved.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 dark:text-neutral-300">
                        <button
                            type="button"
                            onClick={openCookieSettings}
                            className="hover:text-sky-700 dark:hover:text-sky-300 cursor-pointer font-semibold transition-colors"
                        >
                            Cookie Preferences
                        </button>
                        <span>•</span>
                        <Link href="/terms-of-use" className="hover:text-sky-700 dark:hover:text-sky-300 font-semibold transition-colors">
                            Privacy &amp; Terms
                        </Link>
                        <span>•</span>
                        <span className="font-bold text-slate-700 dark:text-neutral-300">Premium African Tech Design</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
