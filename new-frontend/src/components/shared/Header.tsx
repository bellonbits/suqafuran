"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sun, Moon, MapPin, Plus, Bell, User, Menu, X, LogOut, Store, ShoppingCart, LayoutDashboard, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';
import { useLocationStore } from '../../store/useLocation';
import { useCart } from '../../store/useCart';
import { useT } from '../../lib/i18n';
import { LocationPickerModal } from './LocationPickerModal';
import NotificationCenter from '../NotificationCenter';
import api from '../../services/api';

export const Header: React.FC = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const { city } = useLocationStore();
    const { getTotalCount } = useCart();
    const t = useT();
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);
    const [userRole, setUserRole] = useState<'admin' | 'agent' | 'seller' | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const cartCount = getTotalCount();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isDark = document.documentElement.classList.contains('dark') ||
                           window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(isDark);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            const fetchUserStatus = async () => {
                try {
                    // Check seller status
                    const sellerResponse = await api.get('/sellers/check', {
                        params: { user_id: String(user.id) }
                    });
                    setIsVerifiedSeller(sellerResponse.data?.is_seller === true);

                    // Check user role (admin, agent, seller, etc.)
                    const roleResponse = await api.get('/users/me').catch(() => null);
                    if (roleResponse?.data?.role) {
                        setUserRole(roleResponse.data.role);
                    }
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
            <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm">
                {/* Main Header */}
                <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 w-full max-w-full mx-auto h-20">
                    
                    {/* Logo */}
                    <Link href="/" className="flex items-center shrink-0 hover:opacity-85 transition-opacity">
                        <img src="/icon1.png" alt="Suqafuran" className="h-8 w-auto object-contain" />
                    </Link>

                    {/* Center: Location + Search + Button */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        
                        {/* Location Selector - Pill */}
                        <button
                            onClick={() => setIsLocationModalOpen(true)}
                            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shrink-0 border border-gray-200 dark:border-slate-700"
                        >
                            <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-500 shrink-0" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate max-w-[100px]">
                                {city || 'Location'}
                            </span>
                        </button>

                        {/* Search Bar */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex items-center flex-1 min-w-0 max-w-3xl"
                        >
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="What are you looking for?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm font-medium placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                />
                            </div>
                            
                            {/* Search Button */}
                            <button
                                type="submit"
                                className="ml-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-full font-semibold text-sm transition-colors shrink-0 shadow-sm"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        
                        {/* Dark Mode */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? (
                                <Sun className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                            ) : (
                                <Moon className="w-5 h-5 text-gray-600" />
                            )}
                        </button>

                        {/* Notifications */}
                        <div className="relative hidden sm:block">
                            <button
                                onClick={() => {}}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative"
                            >
                                <Bell className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                        </div>

                        {/* Cart Pill Button */}
                        <button
                            onClick={() => router.push('/checkout')}
                            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-orange-600 text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors font-semibold text-sm"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Cart</span>
                            {cartCount > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-orange-600 text-white rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Sell/Listing Pill Button */}
                        {isVerifiedSeller ? (
                            <button
                                onClick={() => router.push('/seller-dashboard/products')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-orange-600 text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors font-semibold text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Sell</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/seller-dashboard')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-orange-600 text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors font-semibold text-sm"
                            >
                                <Store className="w-4 h-4" />
                                <span>Sell</span>
                            </button>
                        )}

                        {/* Auth Section */}
                        {isAuthenticated && user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <User className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                </button>
                                
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 z-50">
                                        <div className="p-3 border-b border-gray-100 dark:border-slate-800">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.full_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => {
                                                    router.push('/account');
                                                    setProfileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
                                            >
                                                Profile
                                            </button>

                                            {/* Admin Dashboard */}
                                            {userRole === 'admin' && (
                                                <button
                                                    onClick={() => {
                                                        router.push('/admin-dashboard');
                                                        setProfileMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded flex items-center gap-2"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    Admin Dashboard
                                                </button>
                                            )}

                                            {/* Agent Dashboard */}
                                            {(userRole === 'admin' || userRole === 'agent') && (
                                                <button
                                                    onClick={() => {
                                                        router.push('/agent-dashboard');
                                                        setProfileMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded flex items-center gap-2"
                                                >
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    Agent Dashboard
                                                </button>
                                            )}

                                            {/* Seller Dashboard */}
                                            {isVerifiedSeller && (
                                                <button
                                                    onClick={() => {
                                                        router.push('/seller-dashboard');
                                                        setProfileMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded flex items-center gap-2"
                                                >
                                                    <Store className="w-4 h-4" />
                                                    Seller Dashboard
                                                </button>
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openAuthModal('signin')}
                                    className="px-4 py-2.5 text-sm font-semibold bg-sky-400 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-600 text-white rounded-full transition-colors hidden sm:inline-block"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => openAuthModal('signup')}
                                    className="px-4 py-2.5 text-sm font-semibold bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-full transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}

                        {/* Mobile Menu */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Location Modal */}
                <LocationPickerModal
                    isOpen={isLocationModalOpen}
                    onClose={() => setIsLocationModalOpen(false)}
                />
            </header>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="sm:hidden bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 py-4 space-y-3">
                    <button
                        onClick={() => setIsLocationModalOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">{city || 'Select Location'}</span>
                    </button>
                    <button
                        onClick={() => router.push('/checkout')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-600 text-orange-600 hover:bg-orange-50 transition-colors font-semibold text-sm"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Cart ({cartCount})</span>
                    </button>
                    {!isAuthenticated && (
                        <>
                            <button
                                onClick={() => {
                                    openAuthModal('signin');
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full px-4 py-2 text-sm font-semibold bg-sky-400 text-white rounded-full hover:bg-sky-500 transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => {
                                    openAuthModal('signup');
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full px-4 py-2 text-sm font-semibold bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            )}
        </>
    );
};
