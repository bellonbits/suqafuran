"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sun, Moon, MapPin, Plus, Bell, User, Menu, X, LogOut, Store, Heart, LayoutDashboard, Shield, MessageSquare, Settings, ChevronRight, CircleUser, Home, ShoppingBag, ShoppingCart, Sparkles, Package, LayoutGrid, Bookmark, HelpCircle, ShieldCheck, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';
import { useLocationStore } from '../../store/useLocation';
import { useFavoritesStore } from '../../store/useFavorites';
import { useRealtimeStore } from '../../store/useRealtime';
import { useMobileMenuStore } from '../../store/useMobileMenu';
import { useCart } from '../../store/useCart';
import { useT } from '../../lib/i18n';
import { LocationPickerModal } from './LocationPickerModal';
import NotificationCenter from '../NotificationCenter';
import { NotificationBell } from './NotificationBell';
import api, { resolveMediaUrl } from '../../services/api';
import { UniversalSearchBar } from '../search/UniversalSearchBar';

export const Header: React.FC = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const { city } = useLocationStore();
    const favoritesCount = useFavoritesStore((s) => s.ids?.size ?? 0);
    const cartCount = useCart((s) => s.items.reduce((sum, i) => sum + (i.quantity || 1), 0));
    const unreadNotificationsCount = useRealtimeStore((s) => s.events?.length ?? 0);
    const { isOpen: isMobileMenuOpen, setOpen: setIsMobileMenuOpen } = useMobileMenuStore();
    const t = useT();
    const [searchQuery, setSearchQuery] = useState('');
    // Always default to light theme unless explicitly saved as dark
    const [darkMode, setDarkMode] = useState(
        typeof window !== 'undefined'
            ? localStorage.getItem('theme') === 'dark'
            : false
    );
    const [scrolled, setScrolled] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);
    const [userRole, setUserRole] = useState<'admin' | 'agent' | 'seller' | null>(null);

    // Prevent background scrolling when mobile menu drawer is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleScroll = () => {
                setScrolled(window.scrollY > 10);
            };
            window.addEventListener('scroll', handleScroll, { passive: true });
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            const fetchUserStatus = async () => {
                try {
                    // Check seller status
                    const sellerResponse = await api.get(`/sellers/${user.id}/is-seller`);
                    setIsVerifiedSeller(sellerResponse.data?.is_seller === true);

                    // Check user role (admin, agent, seller, etc.)
                    let detectedRole: 'admin' | 'agent' | 'seller' | null = null;
                    
                    // Try /users/me endpoint
                    const roleResponse = await api.get('/users/me').catch(() => null);
                    if (roleResponse?.data?.role) {
                        detectedRole = roleResponse.data.role;
                    }
                    
                    // Fallback: check email for admin/agent keywords
                    if (!detectedRole && user.email) {
                        if (user.email.includes('admin')) detectedRole = 'admin';
                        else if (user.email.includes('agent')) detectedRole = 'agent';
                    }
                    
                    // Fallback: check user object for role properties
                    if (!detectedRole) {
                        if ((user as any).is_admin || (user as any).role === 'admin') detectedRole = 'admin';
                        else if ((user as any).is_agent || (user as any).role === 'agent') detectedRole = 'agent';
                    }
                    
                    setUserRole(detectedRole);

                } catch (error) {
                    setIsVerifiedSeller(false);
                    setUserRole(null);
                }
            };
            fetchUserStatus();
        } else {
            setIsVerifiedSeller(false);
            setUserRole(null);
        }
    }, [isAuthenticated, user?.id]);

    // Live sync unread message badge count
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setUnreadMessages(0);
            return;
        }

        let isMounted = true;
        const fetchUnreadCount = async () => {
            try {
                const res = await api.get('/messages/conversations');
                if (Array.isArray(res.data) && isMounted) {
                    const total = res.data.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
                    setUnreadMessages(total);
                }
            } catch {
                // Ignore transient network errors
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isAuthenticated, user?.id]);

    const toggleDarkMode = () => {
        const nextMode = !darkMode;
        setDarkMode(nextMode);
        if (nextMode) {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
            const meta = document.querySelector('meta[name="color-scheme"]');
            if (meta) meta.setAttribute('content', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
            const meta = document.querySelector('meta[name="color-scheme"]');
            if (meta) meta.setAttribute('content', 'light');
            localStorage.setItem('theme', 'light');
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
            <header
                style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
                className={`fixed top-0 inset-x-0 z-50 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-neutral-800/60 transition-all duration-200 ${scrolled ? 'shadow-md shadow-slate-900/5 dark:shadow-black/20' : 'shadow-sm'}`}
            >
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-12 md:h-16 flex items-center justify-between gap-2">

                    {/* Left: Logo + Location */}
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                        <Link href="/" className="flex items-center hover:opacity-85 transition-opacity shrink-0">
                            <img src="/icon1.png" alt="Suqafuran" className="h-8 sm:h-9 md:h-10 w-auto object-contain" />
                        </Link>

                        {/* Location Selector - Compact Pill - Visible on all screens */}
                        <button
                            onClick={() => setIsLocationModalOpen(true)}
                            aria-label={city ? `Location: ${city}` : 'Choose location'}
                            className="flex items-center gap-1.5 sm:gap-2 px-2 md:px-3 py-1.5 sm:py-2 rounded-full min-w-0 bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors border border-gray-200 dark:border-neutral-800"
                        >
                            <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-500 shrink-0" />
                            <span className="hidden min-[380px]:inline text-xs font-medium text-gray-700 dark:text-neutral-200 truncate max-w-[64px] sm:max-w-[100px] md:max-w-[150px]">
                                {city || t('Location')}
                            </span>
                        </button>
                    </div>

                    {/* Center: Search Bar - Dominant Element with Universal Search & AI Shopper */}
                    <div className="hidden md:flex items-center flex-1 mx-4 lg:mx-8 max-w-2xl">
                        <UniversalSearchBar
                            placeholder="Search products, shops, services..."
                        />
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1 sm:gap-4 shrink-0">
                        {/* Dark Mode - Icon Only */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors hidden sm:flex"
                            aria-label="Toggle dark mode"
                            title="Toggle dark mode"
                        >
                            {darkMode ? (
                                <Sun className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
                            ) : (
                                <Moon className="w-5 h-5 text-gray-600" />
                            )}
                        </button>

                        {/* Notifications Bell - Visible on All Screens */}
                        <NotificationBell />

                        {/* Messages - Icon Only */}
                        <button
                            onClick={() => router.push('/messages')}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors relative hidden sm:flex items-center justify-center"
                            title="Messages"
                            aria-label="Messages"
                        >
                            <MessageSquare className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
                            {unreadMessages > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
                            )}
                        </button>

                        {/* Favorites / Saved Items */}
                        <button
                            onClick={() => router.push('/favorites')}
                            className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors relative flex items-center justify-center"
                            title="Saved Items"
                            aria-label="Saved items"
                        >
                            <Heart className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
                            {favoritesCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-orange-600 text-white rounded-full">
                                    {favoritesCount}
                                </span>
                            )}
                        </button>

                        {/* Cart / Checkout */}
                        <button
                            onClick={() => router.push('/checkout')}
                            className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors relative flex items-center justify-center"
                            title="Cart & Multi-Seller Checkout"
                            aria-label="Shopping Cart"
                        >
                            <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-black bg-[#0078E8] text-white rounded-full shadow-xs">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </button>

                        {/* Sell Button - Outlined */}
                        {isVerifiedSeller ? (
                            <button
                                onClick={() => router.push('/seller-dashboard/products')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors border border-orange-600 dark:border-orange-500 flex items-center justify-center hidden sm:flex"
                                title="Seller dashboard"
                            >
                                <Plus className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/seller-dashboard')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors border border-orange-600 dark:border-orange-500 flex items-center justify-center hidden sm:flex"
                                title="Start selling"
                            >
                                <Store className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                            </button>
                        )}

                        {/* Auth Section */}
                        {isAuthenticated && user ? (
                            <div className="relative hidden sm:block">
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors flex items-center justify-center"
                                    title="Profile menu"
                                >
                                    {resolveMediaUrl((user as any).avatar_url) ? (
                                        <img
                                            src={resolveMediaUrl((user as any).avatar_url)!}
                                            alt={user.full_name}
                                            className="w-8 h-8 rounded-full object-cover"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                const fallback = e.currentTarget.parentElement?.querySelector('.avatar-header-fallback') as HTMLElement;
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="avatar-header-fallback w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold"
                                        style={{ display: resolveMediaUrl((user as any).avatar_url) ? 'none' : 'flex' }}
                                    >
                                        {user.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                </button>

                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-950 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-800 z-50">
                                        <div className="p-3 border-b border-gray-100 dark:border-neutral-800">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.full_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-neutral-300">{(user as any).phone || user.email}</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => {
                                                    router.push('/account');
                                                    setProfileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded"
                                            >
                                                Profile
                                            </button>

                                            {userRole === 'admin' && (
                                                <button
                                                    onClick={() => {
                                                        router.push('/admin-dashboard');
                                                        setProfileMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded flex items-center gap-2"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    Admin Dashboard
                                                </button>
                                            )}

                                            {(userRole === 'admin' || userRole === 'agent') && (
                                                <button
                                                    onClick={() => {
                                                        router.push('/agent-dashboard');
                                                        setProfileMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded flex items-center gap-2"
                                                >
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    Agent Dashboard
                                                </button>
                                            )}

                                            {isVerifiedSeller && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            router.push('/seller-profile');
                                                            setProfileMenuOpen(false);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded flex items-center gap-2"
                                                    >
                                                        <User className="w-4 h-4" />
                                                        Seller Profile
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            router.push('/seller-dashboard');
                                                            setProfileMenuOpen(false);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded flex items-center gap-2"
                                                    >
                                                        <Store className="w-4 h-4" />
                                                        Seller Dashboard
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setProfileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2">
                                <button
                                    onClick={() => openAuthModal('signin')}
                                    className="px-4 py-2 text-sm font-semibold bg-sky-400 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-600 text-white rounded-lg transition-colors"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => openAuthModal('signup')}
                                    className="px-4 py-2 text-sm font-semibold bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}

                        {/* Search - compact icon on mobile, since the full
                        search bar now lives prominently in the homepage hero
                        instead of being tucked inside the hamburger menu. */}
                        <button
                            onClick={() => router.push('/search')}
                            className="hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                            aria-label="Search"
                            title="Search"
                        >
                            <Search className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
                        </button>

                        {/* Mobile Menu */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Location Modal - Outside header for proper fixed positioning */}
            <LocationPickerModal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
            />

            {/* Modern Mobile Slide-over Drawer */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop (z-[80] strictly overlays all page elements and bottom nav) */}
                    <div
                        className="sm:hidden fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer Content (z-[90] ensures zero overlap from bottom nav) */}
                    <div
                        style={{
                            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
                            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)'
                        }}
                        className="sm:hidden fixed top-0 right-0 bottom-0 z-[90] w-[86%] max-w-sm bg-white dark:bg-neutral-950 shadow-2xl flex flex-col justify-between border-l border-gray-100 dark:border-neutral-800 animate-in slide-in-from-right duration-200"
                    >
                        {/* Drawer Header */}
                        <div className="px-4 pb-3 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center">
                                <img src="/icon1.png" alt="Suqafuran" className="h-7 w-auto object-contain" />
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-900 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Navigation Body */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain">
                            {/* User Profile Card / Guest Banner */}
                            {isAuthenticated && user ? (
                                <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-sm font-black shrink-0 overflow-hidden shadow-sm">
                                        {resolveMediaUrl((user as any).avatar_url) ? (
                                            <img src={resolveMediaUrl((user as any).avatar_url)!} alt={user.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            user.full_name?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user.full_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{(user as any).phone || user.email}</p>
                                        {userRole && (
                                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white uppercase tracking-wider">
                                                {userRole}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800">
                                    <p className="text-xs font-black text-gray-900 dark:text-white">Welcome to Suqafuran</p>
                                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">Explore deals, chat with sellers, and post items.</p>
                                </div>
                            )}

                            {/* Section: Marketplace & Shopping */}
                            <div className="space-y-1">
                                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-400">
                                    Marketplace
                                </p>
                                <button
                                    onClick={() => { router.push('/ai-shopper'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-800 dark:text-neutral-100 hover:bg-[#00BFFF]/10 transition-colors text-xs font-bold"
                                >
                                    <Sparkles className="w-4 h-4 text-[#00BFFF]" />
                                    <span className="flex-1 text-left text-[#00BFFF]">AI Shopper</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#00BFFF]/10 text-[#00BFFF]">AI</span>
                                </button>
                                <button
                                    onClick={() => { router.push('/shops'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-bold"
                                >
                                    <Store className="w-4 h-4 text-gray-500" />
                                    <span className="flex-1 text-left">Explore Shops</span>
                                </button>
                                <button
                                    onClick={() => { router.push('/search'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-bold"
                                >
                                    <LayoutGrid className="w-4 h-4 text-gray-500" />
                                    <span className="flex-1 text-left">Browse Categories</span>
                                </button>
                                <button
                                    onClick={() => { router.push('/orders'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-bold"
                                >
                                    <Package className="w-4 h-4 text-gray-500" />
                                    <span className="flex-1 text-left">My Orders</span>
                                </button>
                                <button
                                    onClick={() => { router.push('/saved-searches'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-bold"
                                >
                                    <Bookmark className="w-4 h-4 text-gray-500" />
                                    <span className="flex-1 text-left">Saved Searches</span>
                                </button>
                            </div>

                            {/* Section: Account & Management */}
                            <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-neutral-800">
                                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-400">
                                    Account
                                </p>
                                <button
                                    onClick={() => { router.push('/account'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-semibold"
                                >
                                    <CircleUser className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                                    <span className="flex-1 text-left">{t('Profile & Verification')}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </button>
                                <button
                                    onClick={() => { router.push('/settings/notifications'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-semibold"
                                >
                                    <Bell className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                                    <span className="flex-1 text-left">{t('Notifications')}</span>
                                    {unreadNotificationsCount > 0 && (
                                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-orange-500 text-white rounded-full">
                                            {unreadNotificationsCount}
                                        </span>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </button>
                                <button
                                    onClick={() => { router.push('/settings'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-semibold"
                                >
                                    <Settings className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                                    <span className="flex-1 text-left">{t('Settings')}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </button>
                                <button
                                    onClick={() => { router.push('/seller-dashboard'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-semibold"
                                >
                                    <Store className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                                    <span className="flex-1 text-left">{t('Seller Hub')}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </button>
                                {isAuthenticated && (userRole === 'admin' || userRole === 'agent') && (
                                    <button
                                        onClick={() => { router.push('/agent-dashboard'); setIsMobileMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-semibold"
                                    >
                                        <LayoutDashboard className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                                        <span className="flex-1 text-left">{t('Agent Dashboard')}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                    </button>
                                )}
                                {isAuthenticated && userRole === 'admin' && (
                                    <button
                                        onClick={() => { router.push('/admin-dashboard'); setIsMobileMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-semibold"
                                    >
                                        <Shield className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                                        <span className="flex-1 text-left">{t('Admin Dashboard')}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                    </button>
                                )}
                            </div>

                            {/* Section: Support & Safety */}
                            <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-neutral-800">
                                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-400">
                                    Support & Trust
                                </p>
                                <button
                                    onClick={() => { router.push('/help-center'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-medium"
                                >
                                    <HelpCircle className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                                    <span className="flex-1 text-left">Help Center</span>
                                </button>
                                <button
                                    onClick={() => { router.push('/safe-trading-tips'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-medium"
                                >
                                    <ShieldCheck className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                                    <span className="flex-1 text-left">Safe Trading Tips</span>
                                </button>
                                <button
                                    onClick={() => { router.push('/terms-of-use'); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors text-xs font-medium"
                                >
                                    <FileText className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                                    <span className="flex-1 text-left">Terms of Use</span>
                                </button>
                            </div>
                        </div>

                        {/* Drawer Footer: Appearance & Auth (Strictly elevated, visible, and comfortable safe-area padding) */}
                        <div
                            style={{
                                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)'
                            }}
                            className="p-4 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-3 shrink-0"
                        >
                            {/* Appearance Theme Toggle */}
                            <div className="flex items-center justify-between pb-1">
                                <span className="text-xs font-bold text-gray-700 dark:text-neutral-300">{t('Appearance')}</span>
                                <div
                                    className="inline-flex items-center rounded-full p-1 bg-slate-100 dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 shadow-xs"
                                    role="radiogroup"
                                    aria-label={t('Appearance')}
                                >
                                    {[
                                        { dark: false, label: t('Light'), Icon: Sun },
                                        { dark: true, label: t('Dark'), Icon: Moon },
                                    ].map(({ dark, label, Icon }) => {
                                        const active = darkMode === dark;
                                        return (
                                            <button
                                                key={label}
                                                type="button"
                                                role="radio"
                                                aria-checked={active}
                                                onClick={() => { if (!active) toggleDarkMode(); }}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                                    active
                                                        ? 'bg-orange-500 text-white shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-800 dark:text-neutral-400'
                                                }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Auth Buttons: Fixed, fully visible, non-clipped */}
                            {isAuthenticated ? (
                                <button
                                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                    className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors font-bold text-xs"
                                >
                                    <LogOut className="w-4 h-4 shrink-0" />
                                    <span>{t('Sign Out')}</span>
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-2.5 pt-1">
                                    <button
                                        onClick={() => { openAuthModal('signin'); setIsMobileMenuOpen(false); }}
                                        className="h-11 text-xs font-bold bg-sky-500 hover:bg-sky-600 active:scale-98 text-white rounded-2xl shadow-sm transition-all flex items-center justify-center"
                                    >
                                        {t('Sign In')}
                                    </button>
                                    <button
                                        onClick={() => { openAuthModal('signup'); setIsMobileMenuOpen(false); }}
                                        className="h-11 text-xs font-bold bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-2xl shadow-sm transition-all flex items-center justify-center"
                                    >
                                        {t('Sign Up')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};
