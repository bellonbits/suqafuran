import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 pb-16 md:pb-0">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Brand Section */}
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
                            <img src="/icon1.png" alt="Suqafuran Logo" className="h-8 w-auto object-contain" />
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed pt-1">
                            Africa's trusted online marketplace. Buy, sell, chat, and transact securely directly with local buyers and sellers.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Resources
                        </h3>
                        <ul className="mt-4 space-y-2">
                            <li>
                                <Link href="/search" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-slate-300 dark:hover:text-sky-400">
                                    Browse Ads
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard/products" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-slate-300 dark:hover:text-sky-400">
                                    Post a Listing
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-slate-300 dark:hover:text-sky-400">
                                    Seller Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support & Legal */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Support
                        </h3>
                        <ul className="mt-4 space-y-2">
                            <li>
                                <Link href="/help" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-slate-300 dark:hover:text-sky-400">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/safety" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-slate-300 dark:hover:text-sky-400">
                                    Safe Trading Tips
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-xs font-medium text-gray-600 hover:text-primary dark:text-slate-300 dark:hover:text-sky-400">
                                    Terms of Use
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Regions */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Regions
                        </h3>
                        <ul className="mt-4 space-y-2">
                            <li className="text-xs text-gray-500 dark:text-slate-400 font-medium">Somalia</li>
                            <li className="text-xs text-gray-500 dark:text-slate-400 font-medium">Kenya</li>
                            <li className="text-xs text-gray-500 dark:text-slate-400 font-medium">Ethiopia</li>
                            <li className="text-xs text-gray-500 dark:text-slate-400 font-medium">Djibouti</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-gray-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                        &copy; {new Date().getFullYear()} Suqafuran Ltd. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <span className="text-xs text-gray-400 font-bold dark:text-slate-500">Premium African Tech Design</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
