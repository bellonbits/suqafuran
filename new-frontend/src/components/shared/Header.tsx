"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, ShoppingCart, ChevronDown, Sun, Moon, MapPin, Heart, Users, ShieldCheck, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';
import { useCartStore } from '../../store/useCart';
import { useLocationStore } from '../../store/useLocation';
import { useT } from '../../lib/i18n';
import { LanguageToggle } from './LanguageToggle';
import { CurrencyToggle } from './CurrencyToggle';
import { LocationPickerModal } from './LocationPickerModal';
import { NavDrawer } from './NavDrawer';
import { useSidebarStore } from '../../store/useSidebar';

export const Header: React.FC = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const { getCartCount } = useCartStore();
    const { city } = useLocationStore();
    const t = useT();
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [orderMode, setOrderMode] = useState<'delivery' | 'pickup'>('delivery');
    const [cartCount, setCartCount] = useState(0);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const toggleSidebar = useSidebarStore((s) => s.toggle);

    // Sync cart count on client side to avoid hydration mismatches
    useEffect(() => {
        setCartCount(getCartCount());
    }, [getCartCount()]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isDark = document.documentElement.classList.contains('dark') || 
                           window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(isDark);
            if (isDark) {
                document.documentElement.classList.add('dark');
            }
        }
    }, []);

    const toggleDarkMode = () => {
        const nextMode = !darkMode;
        setDarkMode(nextMode);
        if (nextMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleMenuClick = () => {
        // Desktop has a persistent category sidebar to collapse to icons-only;
        // mobile has none, so the hamburger opens the nav drawer instead.
        const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
        if (isDesktop) {
            toggleSidebar();
        } else {
            setIsDrawerOpen(true);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 h-16">
                <div className="flex h-full w-full items-center justify-between px-4 sm:px-6">
                    
                    {/* Hamburger menu, Brand Logo & Search Box */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-2xl">
                        <button
                            onClick={handleMenuClick}
                            aria-label="Toggle menu"
                            className="shrink-0 p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 cursor-pointer"
                        >
                            <Menu className="h-5.5 w-5.5" />
                        </button>

                        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
                            <img src="/icon1.png" alt="Suqafuran Logo" className="h-8 w-auto object-contain" />
                        </Link>

                        {/* Round Search Bar Input — visible on every breakpoint, capped so it doesn't crowd out the right-side controls on narrow widths */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="relative flex-1 min-w-0 max-w-[160px] sm:max-w-xs md:max-w-sm lg:max-w-md flex items-center"
                        >
                            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 shrink-0" />
                            <input
                                type="text"
                                placeholder={t('Search Suqafuran')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full min-w-0 rounded-full border border-transparent bg-slate-100 py-2 pl-9 pr-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:bg-white focus:border-gray-200 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-950 shadow-sm"
                            />
                        </form>
                    </div>

                    {/* Right side controls matching the exact DoorDash structure */}
                    <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">

                        {/* Location selector — opens the real Google Maps search/current-location picker */}
                        <button
                            onClick={() => setIsLocationModalOpen(true)}
                            className="hidden sm:flex items-center gap-1.5 text-sm font-black text-gray-800 dark:text-slate-200 hover:opacity-85 cursor-pointer tracking-tight min-w-0"
                        >
                            <span className="p-1 bg-slate-100 rounded-full dark:bg-slate-800 shrink-0">
                                <MapPin className="h-3.5 w-3.5" />
                            </span>
                            <span className="truncate max-w-20 sm:max-w-none">{city || t('Select Location')}</span>
                            <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block shrink-0" />
                        </button>

                        {/* Delivery / Pickup pills selectors */}
                        <div className="hidden md:flex border border-gray-200 dark:border-slate-800 rounded-full p-0.5 bg-slate-100 dark:bg-slate-950/40">
                            <button
                                onClick={() => setOrderMode('delivery')}
                                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                                    orderMode === 'delivery'
                                        ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {t('Delivery')}
                            </button>
                            <button
                                onClick={() => setOrderMode('pickup')}
                                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                                    orderMode === 'pickup'
                                        ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {t('Pickup')}
                            </button>
                        </div>

                        <LanguageToggle className="hidden sm:flex" />
                        <CurrencyToggle className="hidden sm:block" />

                        {/* Dark/Light mode theme button */}
                        <button
                            onClick={toggleDarkMode}
                            className="hidden sm:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                            {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                        </button>

                        {isAuthenticated && (
                            <>
                                <Link href="/favorites" className="hidden md:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800">
                                    <Heart className="h-4.5 w-4.5" />
                                </Link>
                                <Link href="/following" className="hidden md:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800">
                                    <Users className="h-4.5 w-4.5" />
                                </Link>
                                {(user?.is_agent || user?.is_admin) && (
                                    <Link href="/agent" className="hidden md:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800" title="Agent Hub">
                                        <ShieldCheck className="h-4.5 w-4.5" />
                                    </Link>
                                )}
                                {user?.is_admin && (
                                    <Link href="/admin" className="hidden md:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800" title="Admin Console">
                                        <LayoutGrid className="h-4.5 w-4.5" />
                                    </Link>
                                )}
                            </>
                        )}

                        {/* Bell Notification with active dot */}
                        <button className="relative rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer shrink-0">
                            <Bell className="h-4.5 w-4.5" />
                            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        </button>

                        {/* Shopping Cart button with red badge */}
                        <button
                            onClick={() => router.push('/cart')}
                            aria-label="View cart"
                            className="relative shrink-0 rounded-full p-2.5 bg-red-500 hover:bg-red-600 text-white shadow shadow-red-500/20 cursor-pointer"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            {cartCount > 0 && (
                                <span className="absolute -right-1 -top-1 h-5 w-5 bg-white border border-red-500 text-red-500 rounded-full text-[9px] font-black flex items-center justify-center shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Sign In & Sign Up / Logout Actions */}
                        {isAuthenticated ? (
                            <div className="hidden md:flex items-center gap-3.5 pl-2 border-l border-gray-200 dark:border-slate-800">
                                <button
                                    onClick={() => logout()}
                                    className="text-sm font-black text-gray-500 hover:text-red-500 dark:text-slate-400"
                                >
                                    {t('Sign Out')}
                                </button>
                                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-black text-sm uppercase dark:bg-red-500/20">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-800">
                                <button
                                    onClick={() => openAuthModal('signin')}
                                    className="text-sm font-black text-gray-700 hover:text-primary px-3 py-2 dark:text-slate-200 dark:hover:text-sky-400 cursor-pointer"
                                >
                                    {t('Sign In')}
                                </button>
                                <button
                                    onClick={() => openAuthModal('signup')}
                                    className="btn-premium bg-slate-100 border border-gray-200 px-5 py-2 text-sm font-black text-gray-800 hover:bg-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 rounded-full"
                                >
                                    {t('Sign Up')}
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </header>

            <LocationPickerModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
            <NavDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        </>
    );
};
