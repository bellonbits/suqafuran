"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Sun, Moon, MapPin, Heart, Users, ShieldCheck, LayoutGrid, Plus, ShoppingBag, X, User, Store, Menu, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';
import { useLocationStore } from '../../store/useLocation';
import { useCart } from '../../store/useCart';
import { useT } from '../../lib/i18n';
import { LanguageToggle } from './LanguageToggle';
import { CurrencyToggle } from './CurrencyToggle';
import { LocationPickerModal } from './LocationPickerModal';
import { AuthModal } from '../AuthModal';
import NotificationCenter from '../NotificationCenter';
import api from '../../services/api';

export const Header: React.FC = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const { city } = useLocationStore();
    const { items: cartItems, getTotalCount, updateQuantity, getTotalPrice } = useCart();
    const t = useT();
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [orderMode, setOrderMode] = useState<'delivery' | 'pickup'>('delivery');
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);
    const [sellerLoading, setSellerLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLogo, setShowLogo] = useState(false);
    const cartCount = getTotalCount();

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

    // Scroll listener for logo visibility
    useEffect(() => {
        const handleScroll = () => {
            setShowLogo(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch seller status when user is authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            const fetchSellerStatus = async () => {
                try {
                    setSellerLoading(true);
                    // Use /sellers/check which queries the sellers DB table reliably
                    const response = await api.get('/sellers/check', {
                        params: { user_id: String(user.id) }
                    });
                    setIsVerifiedSeller(response.data?.is_seller === true);
                } catch (error) {
                    // Any error — default to not a seller (don't block UI)
                    setIsVerifiedSeller(false);
                } finally {
                    setSellerLoading(false);
                }
            };
            fetchSellerStatus();
        } else {
            setIsVerifiedSeller(false);
        }
    }, [isAuthenticated, user?.id]);

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

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
                {/* Top Bar - Logo, Search, Quick Actions */}
                <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">

                    {/* Brand Logo - Appears when scrolling down */}
                    <Link href="/" className={`flex items-center gap-2 shrink-0 hover:opacity-90 transition-all duration-300 ${
                        showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute pointer-events-none'
                    }`}>
                        <img src="/icon1.png" alt="Suqafuran Logo" className="h-8 w-auto object-contain" />
                    </Link>

                    {/* Search Bar */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative flex-1 min-w-0 mx-2 sm:mx-3 md:mx-4 max-w-xs sm:max-w-2xl flex items-center"
                    >
                        <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder={t('Search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full min-w-0 rounded-full border border-transparent bg-slate-100 py-2 pl-9 pr-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:bg-white focus:border-gray-200 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-950 shadow-sm"
                        />
                    </form>

                    {/* Right Actions - Responsive */}
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2 lg:gap-3 shrink-0">

                        {/* Location - Hidden on mobile */}
                        <button
                            onClick={() => setIsLocationModalOpen(true)}
                            className="hidden md:flex items-center gap-1.5 text-xs font-black text-gray-800 dark:text-slate-200 hover:opacity-85 cursor-pointer tracking-tight transition-opacity px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-20">{city || t('Select')}</span>
                        </button>

                        {/* Delivery/Pickup - Hidden on mobile */}
                        <div className="hidden lg:flex border border-gray-200 dark:border-slate-800 rounded-full p-0.5 bg-slate-100 dark:bg-slate-950/40">
                            <button
                                onClick={() => setOrderMode('delivery')}
                                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                                    orderMode === 'delivery'
                                        ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {t('Delivery')}
                            </button>
                            <button
                                onClick={() => setOrderMode('pickup')}
                                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                                    orderMode === 'pickup'
                                        ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {t('Pickup')}
                            </button>
                        </div>

                        {/* Dark/Light Mode - Desktop only */}
                        <button
                            onClick={toggleDarkMode}
                            className="hidden lg:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                            {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                        </button>

                        {/* Desktop Account Links - All visible on lg+ */}
                        {isAuthenticated && (
                            <>
                                <Link href="/account" className="hidden lg:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors" title="Account">
                                    <User className="h-4.5 w-4.5" />
                                </Link>
                                <Link href="/favorites" className="hidden lg:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                                    <Heart className="h-4.5 w-4.5" />
                                </Link>
                                <Link href="/following" className="hidden lg:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                                    <Users className="h-4.5 w-4.5" />
                                </Link>
                                {(user?.is_agent || user?.is_admin) && (
                                    <Link href="/agent" className="hidden lg:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors" title="Agent Hub">
                                        <ShieldCheck className="h-4.5 w-4.5" />
                                    </Link>
                                )}
                                {user?.is_admin && (
                                    <Link href="/admin" className="hidden lg:block rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors" title="Admin Console">
                                        <LayoutGrid className="h-4.5 w-4.5" />
                                    </Link>
                                )}
                                {(user?.is_seller || isVerifiedSeller) && (
                                    <Link href="/seller/dashboard" className="hidden lg:block rounded-full p-2 hover:bg-orange-100 text-orange-600 dark:text-orange-400 dark:hover:bg-orange-950 transition-colors" title="Seller Dashboard">
                                        <Store className="h-4.5 w-4.5" />
                                    </Link>
                                )}
                            </>
                        )}

                        {/* Sell Button - Desktop only */}
                        <Link href="/sell" className="hidden lg:flex rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                            <Plus className="h-4.5 w-4.5" />
                        </Link>

                        <LanguageToggle className="!hidden" />
                        <CurrencyToggle className="!hidden" />

                        {/* Cart Button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsCartOpen(!isCartOpen)}
                                className="relative rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
                            >
                                <ShoppingBag className="h-5 w-5" />
                                {cartCount > 0 && (
                                    <span className="absolute right-0 top-0 h-5 w-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications */}
                            <NotificationCenter />

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="sm:hidden rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            {/* Cart Dropdown */}
                            {isCartOpen && (
                                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-800 z-50 max-h-[600px] overflow-y-auto">
                                    <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-5 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Your order</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{cartCount} product{cartCount !== 1 ? 's' : ''}</p>
                                        </div>
                                        <button onClick={() => setIsCartOpen(false)}>
                                            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    <div className="p-5">
                                        {cartCount === 0 ? (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                                                Your cart is empty
                                            </p>
                                        ) : (
                                            <div className="space-y-4">
                                                {cartItems.map((item) => (
                                                    <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100 dark:border-slate-800 last:border-0">
                                                        {/* Product Image */}
                                                        <div className="w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-slate-800 rounded-lg overflow-hidden">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    <ShoppingBag className="w-6 h-6" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Product Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                                                                {item.title}
                                                            </p>
                                                            <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                                                                KSh{(item.price * item.quantity).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Controls */}
                                                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 rounded-full p-1">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-400"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                            <span className="px-1.5 font-bold text-gray-900 dark:text-white text-xs w-4 text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-400"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {cartCount > 0 && (
                                        <div className="border-t border-gray-200 dark:border-slate-800 p-5 space-y-3">
                                            <div className="h-1 bg-orange-500 rounded-full" />
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Nice! You've just saved KSh{Math.round(getTotalPrice() * 0.1).toLocaleString()} 
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setIsCartOpen(false);
                                                    router.push('/checkout');
                                                }}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-full text-base transition-colors"
                                            >
                                                Go to checkout • KSh {getTotalPrice().toLocaleString()}
                                            </button>
                                            <button className="w-full text-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                                ℹ Fees information
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sign In & Sign Up / Logout Actions */}
                        {isAuthenticated ? (
                            <div className="relative pl-2 border-l border-gray-200 dark:border-slate-800">
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                            {user?.full_name || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-sm uppercase shrink-0">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </div>
                                </button>

                                {/* Profile Dropdown Menu */}
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-800 z-50">
                                        <Link
                                            href="/account"
                                            onClick={() => setProfileMenuOpen(false)}
                                            className="block px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-t-xl border-b border-gray-100 dark:border-slate-800"
                                        >
                                            👤 {t('My Profile')}
                                        </Link>
                                        <Link
                                            href="/orders"
                                            onClick={() => setProfileMenuOpen(false)}
                                            className="block px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 border-b border-gray-100 dark:border-slate-800"
                                        >
                                            {t('My Orders')}
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setProfileMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-b-xl"
                                        >
                                            🚪 {t('Sign Out')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-800">
                                <button
                                    onClick={() => {
                                        setAuthMode('signin');
                                        setAuthModalOpen(true);
                                    }}
                                    className="text-sm font-black text-gray-700 hover:text-primary px-2 sm:px-3 py-2 dark:text-slate-200 dark:hover:text-sky-400 cursor-pointer hidden sm:block"
                                >
                                    {t('Sign In')}
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthMode('signup');
                                        setAuthModalOpen(true);
                                    }}
                                    className="btn-premium bg-slate-100 border border-gray-200 px-3 sm:px-5 py-2 text-xs sm:text-sm font-black text-gray-800 hover:bg-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    {t('Sign Up')}
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 absolute top-16 right-0 left-0 z-40 shadow-lg">
                        <div className="divide-y divide-gray-100 dark:divide-slate-800 py-2">
                            {/* Theme Toggle */}
                            <button
                                onClick={() => {
                                    toggleDarkMode();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 text-left flex items-center gap-3"
                            >
                                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>

                            {isAuthenticated && (
                                <>
                                    {/* Account */}
                                    <Link
                                        href="/account"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                                    >
                                        <User className="h-4 w-4" />
                                        {t('My Profile')}
                                    </Link>

                                    {/* Favorites */}
                                    <Link
                                        href="/favorites"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                                    >
                                        <Heart className="h-4 w-4 text-red-500" />
                                        {t('Favorites')}
                                    </Link>

                                    {/* Following */}
                                    <Link
                                        href="/following"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                                    >
                                        <Users className="h-4 w-4" />
                                        Following
                                    </Link>

                                    {/* Agent Hub */}
                                    {(user?.is_agent || user?.is_admin) && (
                                        <Link
                                            href="/agent"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                            Agent Hub
                                        </Link>
                                    )}

                                    {/* Admin Console */}
                                    {user?.is_admin && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                            Admin
                                        </Link>
                                    )}

                                    {/* Seller Dashboard */}
                                    {(user?.is_seller || isVerifiedSeller) && (
                                        <Link
                                            href="/seller/dashboard"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950"
                                        >
                                            <Store className="h-4 w-4" />
                                            Seller Dashboard
                                        </Link>
                                    )}
                                </>
                            )}

                            {/* Sign In / Sign Out */}
                            {isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t('Sign Out')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setAuthMode('signin');
                                        setAuthModalOpen(true);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-3"
                                >
                                    <User className="h-4 w-4" />
                                    {t('Sign In')}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <LocationPickerModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} mode={authMode} />
        </>
    );
};
