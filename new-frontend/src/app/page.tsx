"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin, ArrowRight, User, Navigation,
  ShoppingBag, Store, Smartphone,
  Shield, ShieldCheck, MessageSquare, Star,
  CheckCircle, ChevronDown, ChevronUp,
  Menu, X, Package, BarChart3, Truck,
  Tag, Lock, BadgeCheck,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuth';
import { useAuthModal } from '../store/useAuthModal';
import { AuthModal } from '../components/shared/AuthModal';

/* ─────────────────────────────────────────────────────────────
   DIRECTORY DATA
───────────────────────────────────────────────────────────── */
const TOP_CITIES = [
  'Mogadishu', 'Nairobi', 'Hargeisa', 'Garowe',
  'Kismayo', 'Mombasa', 'Baidoa', 'Berbera',
  'Addis Ababa', 'Dar es Salaam',
];
const TOP_CATEGORIES = [
  'Electronics', 'Fashion & Clothing', 'Vehicles & Auto', 'Real Estate',
  'Food & Groceries', 'Livestock & Animals', 'Beauty & Health', 'Sports',
  'Furniture & Home', 'Books & Education',
];
const TOP_STORES = [
  'Amaan Electronics', 'Fast Courier Services', 'Somali Agriculture Hub',
  'Mogadishu Tech Stop', 'Hargeisa Fashion Outlet', 'Pantry Essentials Co.',
  'Nairobi Gadgets Hub', 'Safari Motors', 'Berbera Fish Market', 'Tech Valley KE',
];

type DirectoryTab = 'cities' | 'categories' | 'stores';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const openAuthModal = useAuthModal((s) => s.open);

  const [heroQuery, setHeroQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [dirTab, setDirTab] = useState<DirectoryTab>('cities');
  const [dirExpanded, setDirExpanded] = useState(false);

  // Mobile layout state variables
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showSmartBanner, setShowSmartBanner] = useState(true);
  const [showBottomBanner, setShowBottomBanner] = useState(true);

  // Google Places Autocomplete
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowStickyHeader(true);
      } else {
        setShowStickyHeader(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!searchInputRef.current || !window.google) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        componentRestrictions: { country: ['ke', 'so'] },
        types: ['geocode'],
      }
    );

    const handlePlaceChanged = () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        setHeroQuery(place.formatted_address);
      }
    };

    if (autocompleteRef.current) {
      autocompleteRef.current.addListener('place_changed', handlePlaceChanged);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearListeners(autocompleteRef.current, 'place_changed');
      }
    };
  }, []);

  const dirData = { cities: TOP_CITIES, categories: TOP_CATEGORIES, stores: TOP_STORES };
  const visibleItems = dirExpanded ? dirData[dirTab] : dirData[dirTab].slice(0, 8);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    router.push(heroQuery.trim()
      ? `/shops?location=${encodeURIComponent(heroQuery.trim())}`
      : '/shops');
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return router.push('/shops');
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      () => { setIsDetecting(false); router.push('/shops'); },
      () => { setIsDetecting(false); router.push('/shops'); }
    );
  };

  // Redirect authenticated users to shops
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/shops');
    }
  }, [isAuthenticated, router]);

  // Don't render landing page if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-[#1B1B1B] font-sans">
      <style>{`
        .pac-container {
          background-color: #fff;
          position: absolute;
          z-index: 1000;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-top: 4px;
          font-size: 14px;
        }
        .pac-item {
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid #e5e7eb;
        }
        .pac-item:last-child {
          border-bottom: none;
        }
        .pac-item:hover {
          background-color: #f3f4f6;
        }
        .pac-item-selected {
          background-color: #e0f2fe;
        }
        .pac-matched {
          color: #6cd4ff;
          font-weight: 600;
        }
      `}</style>
      <Script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAk6rrT_DxxSanx0pwKjLruI-XhgN_zsko&libraries=places"
        strategy="lazyOnload"
        onLoad={() => {
          // Script is loaded, autocomplete will initialize
        }}
      />
      <AuthModal />

      {/* ══════════════════════════════════════════════════════
          MOBILE SMART APP BANNER (at the very top)
      ══════════════════════════════════════════════════════ */}
      {showSmartBanner && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between gap-3 sm:hidden relative z-50">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => setShowSmartBanner(false)}
              className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
            {/* App Icon */}
            <div className="w-8 h-8 rounded-lg bg-[#e0f7ff] flex items-center justify-center border border-[#c0eeff] shrink-0 overflow-hidden p-1.5">
              <img src="/icon1.png" alt="Suqafuran App" className="w-full h-full object-contain" />
            </div>
            {/* App Details */}
            <div className="min-w-0">
              <h4 className="text-[11px] font-black text-gray-900 leading-tight truncate">Browse faster in the app</h4>
              <p className="text-[9px] text-gray-400 font-bold leading-tight truncate">Secure Escrow · Real-Time Chat</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-2 w-2 text-orange-400 fill-orange-400" />
                ))}
                <span className="text-[7.5px] text-gray-400 font-bold ml-1">20M ratings</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/shops')}
            className="bg-[#6cd4ff] hover:bg-[#5bc0e8] text-white text-[10px] font-black px-4 py-1.5 rounded-full shrink-0 shadow-sm"
          >
            Open
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STICKY MOBILE HEADER — appears on scroll (DoorDash style)
      ══════════════════════════════════════════════════════ */}
      <div className={`fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 shadow-sm px-4 py-2.5 flex items-center justify-between gap-3 transition-transform duration-300 sm:hidden ${showStickyHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <button
          onClick={() => {
            const form = document.querySelector('form');
            if (form) {
              form.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const input = form.querySelector('input');
              if (input) input.focus();
            }
          }}
          className="flex-1 flex items-center bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200/50 text-left min-w-0"
        >
          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mr-2" />
          <span className="text-[11px] font-semibold text-gray-400 truncate flex-grow">Enter delivery address...</span>
          <div className="shrink-0 bg-[#6cd4ff] text-white p-1 rounded-full flex items-center justify-center">
            <ArrowRight className="h-3 w-3" />
          </div>
        </button>

        <button
          onClick={() => openAuthModal('signin')}
          className="text-xs font-black text-gray-700 whitespace-nowrap px-1"
        >
          Login
        </button>

        <button
          onClick={() => router.push('/shops')}
          className="text-xs font-black text-white bg-[#6cd4ff] hover:bg-[#5bc0e8] px-4 py-2 rounded-full whitespace-nowrap shadow-sm"
        >
          Open App
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE BOTTOM FLOATING APP PROMO BANNER
      ══════════════════════════════════════════════════════ */}
      {showBottomBanner && (
        <div className="fixed bottom-4 inset-x-4 z-50 bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center justify-between gap-3 sm:hidden animate-fade-in-up">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* App Icon */}
            <div className="w-9 h-9 rounded-xl bg-[#e0f7ff] flex items-center justify-center border border-[#c0eeff] shrink-0 p-1.5">
              <img src="/icon1.png" alt="Suqafuran" className="w-full h-full object-contain" />
            </div>
            {/* Text */}
            <div className="min-w-0">
              <h4 className="text-xs font-black text-gray-900 leading-tight">Browse faster in the app</h4>
              <p className="text-[10px] text-gray-500 font-semibold leading-tight truncate">Secure escrow & instant updates</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 text-orange-400 fill-orange-400" />
                ))}
                <span className="text-[8.5px] text-gray-400 font-bold ml-1">20M ratings</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push('/shops')}
              className="bg-[#6cd4ff] hover:bg-[#5bc0e8] text-white text-[11px] font-black px-3.5 py-2 rounded-full shadow-md shadow-[#6cd4ff]/20 whitespace-nowrap"
            >
              Continue in app
            </button>
            <button
              onClick={() => setShowBottomBanner(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full border border-gray-100 shrink-0"
              aria-label="Close app promotion"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          NAV — logo left, Sign In + Sign Up right
      ══════════════════════════════════════════════════════ */}
      <nav className={`absolute inset-x-0 z-40 transition-all ${showSmartBanner ? 'top-12' : 'top-0'}`}>
        <div className="max-w-full px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Real Suqafuran logo — hidden when scrolling down */}
          <Link href="/" className={`shrink-0 transition-all duration-300 ${showStickyHeader ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <img
              src="/icon1.png"
              alt="Suqafuran"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </Link>

          {/* Desktop auth */}
          <div className="hidden sm:flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <Link href="/account" className="flex items-center gap-2 text-sm font-black text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <span className="hidden md:inline">{user.full_name}</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="text-sm font-black text-white border border-white/70 hover:bg-white/10 px-5 py-2 rounded-full transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('signin')}
                  className="text-sm font-black text-white border border-white/70 hover:bg-white/10 px-5 py-2 rounded-full transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="text-sm font-black text-[#6cd4ff] bg-white hover:bg-[#e0f7ff] px-5 py-2 rounded-full transition-colors shadow-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile top-right auth (exactly like DoorDash Login & Open App) */}
          <div className="flex sm:hidden items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <Link href="/account" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="text-xs font-black text-white bg-white/15 hover:bg-white/25 px-3 py-2 rounded-full transition-colors border border-white/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('signin')}
                  className="text-xs font-black text-white bg-white/15 hover:bg-white/25 px-4 py-2 rounded-full transition-colors border border-white/20"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/shops')}
                  className="text-xs font-black text-[#6cd4ff] bg-white hover:bg-[#e0f7ff] px-4 py-2 rounded-full transition-colors shadow-sm"
                >
                  Open App
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO — Full-width sky-blue banner (DoorDash-exact layout)
          Food images bleed in from both sides, content centered
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-[#6cd4ff] overflow-hidden">
        <style>{`
          @keyframes float-up-1 {
            0%, 100% { transform: translateY(0) rotate(8deg); }
            50% { transform: translateY(-20px) rotate(9deg); }
          }
          @keyframes float-up-2 {
            0%, 100% { transform: translateY(0) rotate(-8deg); }
            50% { transform: translateY(-15px) rotate(-9deg); }
          }
          @keyframes float-down-1 {
            0%, 100% { transform: translateY(0) rotate(-6deg); }
            50% { transform: translateY(20px) rotate(-7deg); }
          }
          @keyframes float-down-2 {
            0%, 100% { transform: translateY(0) rotate(6deg); }
            50% { transform: translateY(15px) rotate(7deg); }
          }
          .float-up-1 { animation: float-up-1 5s ease-in-out infinite; }
          .float-up-2 { animation: float-up-2 6s ease-in-out infinite; }
          .float-down-1 { animation: float-down-1 5.5s ease-in-out infinite; }
          .float-down-2 { animation: float-down-2 6.5s ease-in-out infinite; }
        `}</style>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 pb-36 min-h-[600px]">
          {/* Logo — Optimized size */}
          <img
            src="/icon1.png"
            alt="Suqafuran"
            className={`h-16 sm:h-20 md:h-24 w-auto object-contain mb-6 sm:mb-8 md:mb-10 transition-all duration-300 ${
              showStickyHeader ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
            }`}
          />

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-2 max-w-2xl">
            Africa&apos;s Marketplace for Everything
          </h1>
          <p className="text-white/80 text-sm font-semibold mb-8">
            Verified sellers · Secure escrow · Real-time chat
          </p>

          {/* Search bar — exact DoorDash pill style */}
          <form
            onSubmit={handleSearch}
            className="relative flex items-center bg-white rounded-full shadow-xl w-full max-w-xl mx-auto px-5 py-1"
          >
            <MapPin className="h-4 w-4 text-gray-400 shrink-0 mr-3" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Enter your city or neighborhood..."
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              className="flex-1 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              autoComplete="off"
            />
            <button
              type="submit"
              className="shrink-0 bg-[#6cd4ff] hover:bg-[#5bc0e8] text-white p-2.5 rounded-full transition-all ml-2 flex items-center justify-center"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Pills — Sign in for saved address / Use current Location */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={() => isAuthenticated ? router.push('/shops') : openAuthModal('signin')}
              className="flex items-center gap-2 border border-white/60 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              Sign in for saved address
            </button>
            <button
              onClick={handleCurrentLocation}
              disabled={isDetecting}
              className="flex items-center gap-2 border border-white/60 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              {isDetecting ? 'Detecting...' : 'Use current Location'}
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          THREE VALUE-PROP TILES — exactly like DoorDash below the hero
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

            {/* Tile 1 — Become a Seller */}
            <Link
              href={isAuthenticated ? '/seller-dashboard' : '/?auth=signup'}
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  openAuthModal('signup');
                }
              }}
              className="group flex flex-col items-center bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full text-center"
            >
              <div className="w-12 h-12 bg-[#6cd4ff]/10 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-6 h-6 text-[#6cd4ff]" />
              </div>
              <h3 className="text-xl font-black text-[#1B1B1B] mb-2 leading-tight">
                Become a Seller
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-[240px] mx-auto flex-grow">
                Post ads for free in minutes and reach thousands of verified buyers across Africa.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-black text-[#6cd4ff] group-hover:text-[#6cd4ff] transition-colors mt-auto">
                Start selling <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            {/* Tile 2 — Become a Partner */}
            <Link
              href={isAuthenticated ? '/seller-dashboard' : '/?auth=signup'}
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  openAuthModal('signup');
                }
              }}
              className="group flex flex-col items-center bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full text-center"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <Store className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-[#1B1B1B] mb-2 leading-tight">
                Become a Partner
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-[240px] mx-auto flex-grow">
                Create a digital storefront, manage products, and grow your customer base with ease.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-black text-emerald-500 group-hover:text-emerald-600 transition-colors mt-auto">
                Sign up your business <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            {/* Tile 3 — Get the App */}
            <Link
              href="/home"
              className="group flex flex-col items-center bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full text-center"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="text-xl font-black text-[#1B1B1B] mb-2 leading-tight">
                Get the App
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-[240px] mx-auto flex-grow">
                Download the Suqafuran app for live chat, offline sync, and push notifications.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-black text-slate-700 group-hover:text-slate-900 transition-colors mt-auto">
                Get the app <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION A — "Start selling and earn"  (pink bg)
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#FFF8F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-h-[420px]">
            {/* Text left */}
            <div className="flex flex-col justify-center py-14 pr-0 md:pr-16 order-2 md:order-1">
              <h2 className="text-4xl sm:text-5xl font-black text-[#1B1B1B] leading-tight mb-5">
                Start selling<br />and earn
              </h2>
              <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-md">
                Whether it&apos;s electronics, fashion, food, or livestock — list anything on Suqafuran and connect with thousands of verified buyers across Africa. Sign up in minutes, list for free.
              </p>
              {/* Feature bullets — lucide icons, no emojis */}
              <ul className="space-y-2 mb-8">
                {[
                  { icon: <Tag className="h-4 w-4 text-[#6cd4ff]" />, text: 'Free listings, no upfront fees' },
                  { icon: <BadgeCheck className="h-4 w-4 text-emerald-500" />, text: 'Verified seller badge & trust score' },
                  { icon: <ShieldCheck className="h-4 w-4 text-[#6cd4ff]" />, text: 'Escrow protection on every deal' },
                ].map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <span className="shrink-0">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <div>
                <button
                  onClick={() => isAuthenticated ? router.push('/seller-dashboard') : openAuthModal('signup')}
                  className="inline-flex items-center text-sm font-black text-white bg-[#6cd4ff] hover:bg-[#5bc0e8] px-8 py-4 rounded-full transition-all shadow-md shadow-[#6cd4ff]/20"
                >
                  Become a Seller
                </button>
              </div>
            </div>
            {/* Photo right */}
            <div className="relative order-1 md:order-2 flex items-center justify-center min-h-[350px] md:min-h-0 py-6">
              <img
                src="/seller_hero.png"
                alt="African marketplace seller"
                className="max-h-[400px] w-full object-cover rounded-2xl transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION B — "Grow your business"  (mint bg)
          ══════════════════════════════════════════════════════ */}
      <section className="bg-[#F0FFF4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center min-h-[420px]">
            {/* Photo left */}
            <div className="relative flex items-center justify-center min-h-[350px] md:min-h-0 py-6">
              <img
                src="/business_hero.png"
                alt="African business owner"
                className="max-h-[400px] w-full object-cover rounded-2xl transition-transform duration-300 hover:scale-105"
              />
            </div>
            {/* Text right */}
            <div className="flex flex-col justify-center py-14 pl-0 md:pl-16">
              <h2 className="text-4xl sm:text-5xl font-black text-[#1B1B1B] leading-tight mb-5">
                Grow your business<br />with Suqafuran
              </h2>
              <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-md">
                Businesses large and small partner with Suqafuran to reach new customers, increase order volume, and drive more sales.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  { icon: <BarChart3 className="h-4 w-4 text-emerald-500" />, text: 'Analytics & revenue dashboard' },
                  { icon: <Package className="h-4 w-4 text-emerald-500" />, text: 'Product & inventory management' },
                  { icon: <Truck className="h-4 w-4 text-emerald-500" />, text: 'Order tracking & delivery status' },
                ].map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <span className="shrink-0">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <div>
                <button
                  onClick={() => isAuthenticated ? router.push('/seller-dashboard') : openAuthModal('signup')}
                  className="inline-flex items-center text-sm font-black text-white bg-emerald-500 hover:bg-emerald-600 px-8 py-4 rounded-full transition-all shadow-md shadow-emerald-500/20"
                >
                  Partner with Suqafuran
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION C — "Trade with confidence"  (white)
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-h-[420px]">
            {/* Text left */}
            <div className="flex flex-col justify-center py-14 pr-0 md:pr-16 order-2 md:order-1">
              <h2 className="text-4xl sm:text-5xl font-black text-[#1B1B1B] leading-tight mb-5">
                Trade with complete<br />confidence
              </h2>
              <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-md">
                Our escrow protection holds funds until you confirm delivery. Every seller is identity-checked with a trust score and verified badge.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  { icon: <Lock className="h-4 w-4 text-[#6cd4ff]" />, text: 'Escrow holds funds until delivery confirmed' },
                  { icon: <CheckCircle className="h-4 w-4 text-[#6cd4ff]" />, text: 'Identity-verified sellers & trust scores' },
                  { icon: <MessageSquare className="h-4 w-4 text-[#6cd4ff]" />, text: 'Real-time encrypted chat with sellers' },
                  { icon: <Star className="h-4 w-4 text-[#6cd4ff]" />, text: 'Community ratings & buyer reviews' },
                ].map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <span className="shrink-0">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <div>
                <button
                  onClick={() => router.push('/shops')}
                  className="inline-flex items-center text-sm font-black text-white bg-[#6cd4ff] hover:bg-[#5bc0e8] px-8 py-4 rounded-full transition-all shadow-md shadow-[#6cd4ff]/20"
                >
                  Start Shopping Safely
                </button>
              </div>
            </div>

            {/* Escrow UI card — right */}
            <div className="relative overflow-hidden min-h-[320px] md:min-h-0 order-1 md:order-2 bg-slate-50 flex items-center justify-center p-8">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100">
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#6cd4ff]" />
                    <span className="font-black text-[#1B1B1B]">Transaction #8821</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-black bg-[#c0eeff] text-sky-700 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-[#e0f7ff]0 rounded-full animate-pulse" />
                    Escrow Active
                  </span>
                </div>
                {/* Rows */}
                <div className="space-y-3 mb-5">
                  {[
                    { icon: <User className="h-3.5 w-3.5" />, label: 'Buyer', value: 'Ahmad K.' },
                    { icon: <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />, label: 'Seller', value: 'Amina S. (Verified)' },
                    { icon: <Smartphone className="h-3.5 w-3.5" />, label: 'Item', value: 'iPhone 15 Pro' },
                    { icon: <Shield className="h-3.5 w-3.5" />, label: 'Amount', value: '$650.00' },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2.5 last:border-0">
                      <span className="flex items-center gap-1.5 text-gray-500 font-semibold">
                        {r.icon} {r.label}
                      </span>
                      <span className="font-black text-[#1B1B1B]">{r.value}</span>
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1.5">
                    <span>Funds held in escrow</span>
                    <span>Awaiting delivery</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full" />
                  </div>
                </div>
                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                  Confirm Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DIRECTORY — "Get more from your neighborhood"
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1B1B1B] text-center mb-10">
            Get more from your neighborhood
          </h2>

          {/* Tab bar */}
          <div className="flex border-b border-gray-200 mb-8">
            {([
              { key: 'cities',      label: 'Top Cities' },
              { key: 'categories',  label: 'Top Categories' },
              { key: 'stores',      label: 'Top Stores' },
            ] as { key: DirectoryTab; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setDirTab(tab.key); setDirExpanded(false); }}
                className={`px-6 py-3 text-sm font-black border-b-2 transition-colors whitespace-nowrap ${
                  dirTab === tab.key
                    ? 'border-[#1B1B1B] text-[#1B1B1B]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Link grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3">
            {visibleItems.map((item) => (
              <button
                key={item}
                onClick={() => router.push('/shops')}
                className="text-left text-sm font-semibold text-gray-700 hover:text-[#6cd4ff] transition-colors py-1"
              >
                {item}
              </button>
            ))}
          </div>

          {/* See more toggle */}
          {dirData[dirTab].length > 8 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setDirExpanded(!dirExpanded)}
                className="inline-flex items-center gap-2 text-sm font-black text-[#1B1B1B] hover:text-[#6cd4ff] transition-colors"
              >
                {dirExpanded
                  ? <><ChevronUp className="h-4 w-4" /> See less</>
                  : <>See more <ChevronDown className="h-4 w-4" /></>}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER — dark, popular categories
      ══════════════════════════════════════════════════════ */}
      <footer className="bg-[#1B1B1B] text-gray-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          <h3 className="text-white font-black mb-6 text-sm">Popular Categories</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2 mb-12">
            {[
              'Electronics Near Me', 'Fashion Delivery', 'Groceries Near Me',
              'Livestock Market', 'Real Estate Somalia', 'Vehicles Kenya',
              'Beauty & Health', 'Sports Equipment', 'Books & Education',
              'Furniture & Home', 'Services Near Me', 'Food Delivery',
              'Verified Sellers', 'Escrow Trading', 'Business Registration',
              'Mobile App Download', 'Mogadishu Market', 'Nairobi Marketplace',
              'Hargeisa Deals', 'Garowe Shopping', 'Kismayo Market',
              'Mombasa Deals', 'Electronics Wholesale', 'Clothing Export',
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => router.push('/shops')}
                className="text-left text-xs text-gray-400 hover:text-gray-200 transition-colors py-0.5"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <Link href="/">
              <img
                src="/icon1.png"
                alt="Suqafuran"
                className="h-7 w-auto object-contain brightness-0 invert opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {['Privacy', 'Terms', 'Accessibility', 'Careers', 'Help Center'].map((l) => (
                <a key={l} href="#" className="text-xs text-gray-400 hover:text-gray-200 transition-colors">
                  {l}
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500">© 2024 Suqafuran Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
