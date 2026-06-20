"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, ShoppingCart, ChevronDown, Sun, Moon, MapPin, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuth';
import { useCartStore } from '../../store/useCart';

const POPULAR_LOCATIONS = [
    "Hodan, Mogadishu",
    "Waberi, Mogadishu",
    "Jigjiga Yar, Hargeisa",
    "Koodbuur, Hargeisa",
    "Garowe, Puntland",
    "Eastleigh, Nairobi",
    "Nairobi CBD, Kenya",
    "Boondheere, Mogadishu",
    "Hamar Weyne, Mogadishu",
    "26 June, Hargeisa",
    "Bosaso, Puntland",
    "Kismayo, Jubaland",
    "Baidoa, Bay",
    "Kilimani, Nairobi",
    "Westlands, Nairobi"
];

export const Header: React.FC = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { getCartCount } = useCartStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [orderMode, setOrderMode] = useState<'delivery' | 'pickup'>('delivery');
    const [location, setLocation] = useState('Select Location');
    const [tempLocation, setTempLocation] = useState('');
    const [filteredLocations, setFilteredLocations] = useState<string[]>(POPULAR_LOCATIONS);
    const [cartCount, setCartCount] = useState(0);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    // Load initial location from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('suqafuran_location');
            if (stored) {
                setLocation(stored);
            }
        }
    }, []);

    // Filter suggestions based on input
    useEffect(() => {
        if (!tempLocation.trim()) {
            setFilteredLocations(POPULAR_LOCATIONS);
        } else {
            const query = tempLocation.toLowerCase();
            const filtered = POPULAR_LOCATIONS.filter(loc => 
                loc.toLowerCase().includes(query)
            );
            setFilteredLocations(filtered);
        }
    }, [tempLocation]);

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

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 h-16">
                <div className="flex h-full w-full items-center justify-between px-4 sm:px-6">
                    
                    {/* Brand Logo & Search Box */}
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
                            <img src="/icon1.png" alt="Suqafuran Logo" className="h-8 w-auto object-contain" />
                        </Link>

                        {/* Round Search Bar Input */}
                        <form 
                            onSubmit={handleSearchSubmit}
                            className="relative flex-1 hidden sm:flex items-center"
                        >
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Suqafuran"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-full border border-transparent bg-slate-100 py-2.5 pl-11 pr-4 text-base font-semibold text-gray-900 outline-none transition-all focus:bg-white focus:border-gray-200 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-950 shadow-sm"
                            />
                        </form>
                    </div>

                    {/* Right side controls matching the exact DoorDash structure */}
                    <div className="flex items-center gap-4 shrink-0">
                        
                        {/* Location selector dropdown */}
                        <button 
                            onClick={() => {
                                setTempLocation(location === 'Select Location' ? '' : location);
                                setIsLocationModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 text-sm font-black text-gray-800 dark:text-slate-200 hover:opacity-85 cursor-pointer tracking-tight"
                        >
                            <span className="p-1 bg-slate-100 rounded-full dark:bg-slate-800">📍</span>
                            <span className="truncate max-w-24 sm:max-w-none">{location}</span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>

                        {/* Delivery / Pickup pills selectors */}
                        <div className="flex border border-gray-200 dark:border-slate-800 rounded-full p-0.5 bg-slate-100 dark:bg-slate-950/40">
                            <button
                                onClick={() => setOrderMode('delivery')}
                                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                                    orderMode === 'delivery' 
                                        ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900' 
                                        : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Delivery
                            </button>
                            <button
                                onClick={() => setOrderMode('pickup')}
                                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                                    orderMode === 'pickup' 
                                        ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900' 
                                        : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Pickup
                            </button>
                        </div>

                        {/* Dark/Light mode theme button */}
                        <button
                            onClick={toggleDarkMode}
                            className="rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                            {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                        </button>

                        {/* Bell Notification with active dot */}
                        <button className="relative rounded-full p-2 hover:bg-slate-100 text-gray-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">
                            <Bell className="h-4.5 w-4.5" />
                            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        </button>

                        {/* Shopping Cart button with red badge */}
                        <button className="relative rounded-full p-2.5 bg-red-500 hover:bg-red-600 text-white shadow shadow-red-500/20 cursor-pointer">
                            <ShoppingCart className="h-4 w-4" />
                            {cartCount > 0 && (
                                <span className="absolute -right-1 -top-1 h-5 w-5 bg-white border border-red-500 text-red-500 rounded-full text-[9px] font-black flex items-center justify-center shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Sign In & Sign Up / Logout Actions */}
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3.5 pl-2 border-l border-gray-200 dark:border-slate-800">
                                <button
                                    onClick={() => logout()}
                                    className="text-sm font-black text-gray-500 hover:text-red-500 dark:text-slate-400"
                                >
                                    Sign Out
                                </button>
                                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-black text-sm uppercase dark:bg-red-500/20">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-800">
                                <Link 
                                    href="/login"
                                    className="text-sm font-black text-gray-700 hover:text-primary px-3 py-2 dark:text-slate-200 dark:hover:text-sky-400"
                                >
                                    Sign In
                                </Link>
                                <Link 
                                    href="/signup"
                                    className="btn-premium bg-slate-100 border border-gray-200 px-5 py-2 text-sm font-black text-gray-800 hover:bg-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 rounded-full"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}

                    </div>
                </div>
            </header>

            {/* Custom Location Search Modal */}
            {isLocationModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLocationModalOpen(false)}>
                    <div 
                        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 space-y-4 animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 font-poppins flex items-center gap-1.5">
                                <MapPin className="h-4.5 w-4.5 text-[#38BDF8]" />
                                <span>Enter Delivery Location</span>
                            </h3>
                            <button 
                                onClick={() => setIsLocationModalOpen(false)}
                                className="rounded-full p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-400 transition-colors"
                            >
                                <X className="h-4.5 w-4.5" />
                            </button>
                        </div>
                        
                        <input
                            type="text"
                            placeholder="Type neighborhood, city or street address..."
                            value={tempLocation}
                            onChange={(e) => setTempLocation(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-semibold outline-none focus:border-[#38BDF8] focus:bg-white dark:text-slate-100 transition-all shadow-inner"
                            autoFocus
                        />

                        {/* Interactive Location Suggestions */}
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin dark:scrollbar-track-slate-950/40">
                            {filteredLocations.length > 0 ? (
                                filteredLocations.map((loc, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setLocation(loc);
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('suqafuran_location', loc);
                                            }
                                            setIsLocationModalOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                        <span className="text-gray-400">📍</span>
                                        <span>{loc}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="text-sm text-gray-400 text-center py-4 font-semibold">
                                    No matching locations found
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="btn-premium bg-slate-50 border border-gray-200 text-gray-600 px-5 py-2.5 text-sm hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const finalLoc = tempLocation.trim() || 'Select Location';
                                    setLocation(finalLoc);
                                    if (typeof window !== 'undefined') {
                                        localStorage.setItem('suqafuran_location', finalLoc);
                                    }
                                    setIsLocationModalOpen(false);
                                }}
                                className="btn-premium bg-[#38BDF8] text-white px-6 py-2.5 text-sm hover:bg-[#0EA5E9] shadow-md shadow-sky-500/20"
                            >
                                Save Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
