import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
    return (
        <footer 
            style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)'
            }}
            className="border-t border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:!pb-6"
        >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-5">
                    {/* Brand Section */}
                    <div className="col-span-2 md:col-span-1 space-y-3">
                        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
                            <img src="/icon1.png" alt="Suqafuran Logo" className="h-7 w-auto object-contain" />
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                            Africa's trusted online marketplace. Buy, sell, chat, and transact securely directly with local buyers and sellers.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-400 uppercase tracking-wider">
                            Resources
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/search" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Browse Ads
                                </Link>
                            </li>
                            <li>
                                <Link href="/seller-dashboard/products/add" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Post a Listing
                                </Link>
                            </li>
                            <li>
                                <Link href="/seller-dashboard" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Seller Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support & Legal */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-400 uppercase tracking-wider">
                            Support
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/help-center" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/safe-trading-tips" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Safe Trading Tips
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-of-use" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Terms of Use
                                </Link>
                            </li>
                            <li>
                                <Link href="/return-policy" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Return &amp; Refund Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Marketplace */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-400 uppercase tracking-wider">
                            Marketplace
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/orders" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    My Orders
                                </Link>
                            </li>
                            <li>
                                <Link href="/price-alerts" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Price Alerts
                                </Link>
                            </li>
                            <li>
                                <Link href="/saved-searches" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Saved Searches
                                </Link>
                            </li>
                            <li>
                                <Link href="/settings/notifications" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-neutral-200 dark:hover:text-sky-400">
                                    Notifications
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Regions */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-400 uppercase tracking-wider">
                            Regions
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li className="text-xs text-gray-500 dark:text-neutral-300 font-medium">Somalia</li>
                            <li className="text-xs text-gray-500 dark:text-neutral-300 font-medium">Kenya</li>
                            <li className="text-xs text-gray-500 dark:text-neutral-300 font-medium">Ethiopia</li>
                            <li className="text-xs text-gray-500 dark:text-neutral-300 font-medium">Djibouti</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-6 border-t border-gray-100 dark:border-neutral-800 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="text-xs text-gray-400 dark:text-neutral-400 font-medium">
                        &copy; {new Date().getFullYear()} Suqafuran Ltd. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <span className="text-xs text-gray-400 font-bold dark:text-neutral-400">Premium African Tech Design</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
