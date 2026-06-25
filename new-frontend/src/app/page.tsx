"use client";
// eslint-disable-next-line @next/next/no-img-element

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
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
  const { isAuthenticated } = useAuthStore();
  const openAuthModal = useAuthModal((s) => s.open);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dirTab, setDirTab] = useState<DirectoryTab>('cities');
  const [dirExpanded, setDirExpanded] = useState(false);

  const dirData = {
    cities: TOP_CITIES,
    categories: TOP_CATEGORIES,
    stores: TOP_STORES,
  };
  const visibleItems = dirExpanded ? dirData[dirTab] : dirData[dirTab].slice(0, 8);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B132B] text-[#1B1B1B] dark:text-white font-sans">
      <AuthModal />

      {/* ══════════════════════════════════════════════════════════
          TOP NAV — exact DoorDash layout
      ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white dark:bg-[#0B132B] border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm leading-none">S</span>
            </div>
            <span className="text-[18px] font-black text-[#1B1B1B] dark:text-white tracking-tight uppercase">
              SUQAFURAN
            </span>
          </Link>

          {/* Desktop auth buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => openAuthModal('signin')}
              className="text-sm font-black text-[#1B1B1B] dark:text-white bg-transparent border border-[#1B1B1B] dark:border-white px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="text-sm font-black text-white bg-sky-500 hover:bg-sky-600 px-5 py-2 rounded-full transition-colors shadow-sm"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white dark:bg-[#0B132B] border-t border-gray-100 dark:border-slate-800 px-4 py-4 flex flex-col gap-3">
            <button
              onClick={() => { openAuthModal('signin'); setMobileMenuOpen(false); }}
              className="w-full text-sm font-black py-3 rounded-full border border-[#1B1B1B] dark:border-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => { openAuthModal('signup'); setMobileMenuOpen(false); }}
              className="w-full text-sm font-black text-white bg-sky-500 hover:bg-sky-600 py-3 rounded-full transition-colors"
            >
              Sign Up
            </button>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — THREE VALUE-PROP TILES  (DoorDash style)
          "What are you in the mood for?" equivalent
      ══════════════════════════════════════════════════════════ */}
      <section className="pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">

            {/* Tile 1 — Start Selling */}
            <div className="flex flex-col items-center gap-5">
              {/* Illustration bubble */}
              <div className="w-32 h-32 rounded-full bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center">
                <span className="text-6xl select-none">🛍️</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#1B1B1B] dark:text-white leading-tight">
                  Start Selling<br />& Earn
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                  Post ads for free in minutes and reach thousands of buyers nearby. No upfront fees.
                </p>
              </div>
              <button
                onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
                className="text-sm font-black text-white bg-sky-500 hover:bg-sky-600 px-7 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md shadow-sky-500/25"
              >
                Become a Seller
              </button>
            </div>

            {/* Tile 2 — Grow Business */}
            <div className="flex flex-col items-center gap-5">
              <div className="w-32 h-32 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <span className="text-6xl select-none">🏪</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#1B1B1B] dark:text-white leading-tight">
                  Grow Your<br />Business
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                  Create a digital storefront, manage products, track orders, and build customer trust.
                </p>
              </div>
              <button
                onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
                className="text-sm font-black text-white bg-emerald-500 hover:bg-emerald-600 px-7 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/25"
              >
                List Your Business
              </button>
            </div>

            {/* Tile 3 — Get App */}
            <div className="flex flex-col items-center gap-5">
              <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center">
                <span className="text-6xl select-none">📱</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#1B1B1B] dark:text-white leading-tight">
                  Get the<br />Mobile App
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                  Live chat alerts, location matching, offline sync, and push notifications on the go.
                </p>
              </div>
              <button
                onClick={() => router.push('/home')}
                className="text-sm font-black text-[#1B1B1B] dark:text-white border border-[#1B1B1B] dark:border-white px-7 py-3 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
              >
                Get the App
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — "Start selling and earn" (image + text, pink bg)
          Like DoorDash "Sign up to dash and get paid"
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#FFF8F5] dark:bg-slate-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch min-h-[420px]">
            {/* Text left */}
            <div className="flex flex-col justify-center py-14 pr-0 md:pr-16 order-2 md:order-1">
              <h2 className="text-4xl sm:text-5xl font-black text-[#1B1B1B] dark:text-white leading-tight mb-5">
                Start selling<br />and earn
              </h2>
              <p className="text-base text-gray-600 dark:text-slate-400 leading-relaxed mb-8 max-w-md">
                Whether it's electronics, fashion, food, or livestock — list anything on Suqafuran and connect with thousands of verified buyers across Africa. Sign up in minutes, list for free.
              </p>
              <div>
                <button
                  onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
                  className="inline-flex items-center text-sm font-black text-white bg-sky-500 hover:bg-sky-600 px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md shadow-sky-500/20"
                >
                  Become a Seller
                </button>
              </div>
            </div>
            {/* Photo right */}
            <div className="relative order-1 md:order-2 overflow-hidden min-h-[320px] md:min-h-0">
              <img
                src="/seller_hero.png"
                alt="African marketplace seller"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — "Grow your business" (text right, image left)
          Like DoorDash "Grow your business with DoorDash"
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F0FFF4] dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch min-h-[420px]">
            {/* Photo left */}
            <div className="relative overflow-hidden min-h-[320px] md:min-h-0">
              <img
                src="/business_hero.png"
                alt="African business owner"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>
            {/* Text right */}
            <div className="flex flex-col justify-center py-14 pl-0 md:pl-16">
              <h2 className="text-4xl sm:text-5xl font-black text-[#1B1B1B] dark:text-white leading-tight mb-5">
                Grow your business<br />with Suqafuran
              </h2>
              <p className="text-base text-gray-600 dark:text-slate-400 leading-relaxed mb-8 max-w-md">
                Businesses large and small partner with Suqafuran to reach new customers, increase order volume, and drive more sales — with a full dashboard for orders, analytics, and delivery.
              </p>
              <div>
                <button
                  onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
                  className="inline-flex items-center text-sm font-black text-white bg-emerald-500 hover:bg-emerald-600 px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  Partner with Suqafuran
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — "Trade with confidence" (escrow, image right)
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-[#0B132B]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch min-h-[420px]">
            {/* Text left */}
            <div className="flex flex-col justify-center py-14 pr-0 md:pr-16 order-2 md:order-1">
              <h2 className="text-4xl sm:text-5xl font-black text-[#1B1B1B] dark:text-white leading-tight mb-5">
                Trade with complete<br />confidence
              </h2>
              <p className="text-base text-gray-600 dark:text-slate-400 leading-relaxed mb-8 max-w-md">
                Our escrow protection, verified seller badges, and buyer guarantee mean your money is only released after you confirm delivery. Safe trading across Africa.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: '🔒', label: 'Escrow Protection', desc: 'Funds held until you confirm delivery' },
                  { icon: '✅', label: 'Verified Sellers', desc: 'Identity-checked with trust scores' },
                  { icon: '💬', label: 'Real-time Chat', desc: 'Negotiate directly with sellers' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center shrink-0">{f.icon}</span>
                    <div>
                      <span className="font-black text-sm text-[#1B1B1B] dark:text-white">{f.label} · </span>
                      <span className="text-sm text-gray-500 dark:text-slate-400">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <button
                  onClick={() => router.push('/home')}
                  className="inline-flex items-center text-sm font-black text-white bg-sky-500 hover:bg-sky-600 px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md shadow-sky-500/20"
                >
                  Start Shopping Safely
                </button>
              </div>
            </div>
            {/* Image right */}
            <div className="relative flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-0 order-1 md:order-2">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800" />
              <div className="relative z-10 p-8 w-full flex items-center justify-center">
                {/* Escrow transaction UI */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-72 border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-black text-[#1B1B1B] dark:text-white">Transaction #8821</span>
                    <span className="flex items-center gap-1 text-[10px] font-black bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
                      Escrow Active
                    </span>
                  </div>
                  <div className="space-y-3 mb-4">
                    {[
                      { label: 'Buyer', value: 'Ahmad K.' },
                      { label: 'Seller', value: 'Amina S. ✓' },
                      { label: 'Item', value: 'iPhone 15 Pro' },
                      { label: 'Amount', value: '$650.00' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between text-sm border-b border-gray-100 dark:border-slate-700 pb-2 last:border-0">
                        <span className="text-gray-500 dark:text-slate-400 font-bold">{r.label}</span>
                        <span className="font-black text-[#1B1B1B] dark:text-white">{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-sky-400 to-emerald-500 rounded-full" />
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5 font-bold">Awaiting delivery confirmation</p>
                  </div>
                  <button className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl text-sm hover:bg-emerald-600 transition-colors">
                    Confirm Delivery ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — DIRECTORY  "Get more from your neighborhood"
          Exact DoorDash tab layout: Top Cities / Top Categories / Top Stores
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-[#0B132B] py-16 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1B1B1B] dark:text-white text-center mb-10">
            Get more from your neighborhood
          </h2>

          {/* Tab bar — exact DoorDash underline style */}
          <div className="flex border-b border-gray-200 dark:border-slate-700 mb-8">
            {([
              { key: 'cities', label: 'Top Cities' },
              { key: 'categories', label: 'Top Categories' },
              { key: 'stores', label: 'Top Stores' },
            ] as { key: DirectoryTab; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => { setDirTab(tab.key); setDirExpanded(false); }}
                className={`px-6 py-3 text-sm font-black border-b-2 transition-colors whitespace-nowrap ${
                  dirTab === tab.key
                    ? 'border-[#1B1B1B] dark:border-white text-[#1B1B1B] dark:text-white'
                    : 'border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Directory items grid — 2 columns like DoorDash */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3">
            {visibleItems.map(item => (
              <button
                key={item}
                onClick={() => router.push('/home')}
                className="text-left text-sm font-semibold text-gray-700 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors py-1"
              >
                {item}
              </button>
            ))}
          </div>

          {/* See more / less toggle */}
          {dirData[dirTab].length > 8 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setDirExpanded(!dirExpanded)}
                className="inline-flex items-center gap-2 text-sm font-black text-[#1B1B1B] dark:text-white hover:text-sky-500 transition-colors"
              >
                {dirExpanded ? (
                  <>See less <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>See more <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER — dark background, popular categories grid
          Exact DoorDash dark footer style
      ══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#1B1B1B] dark:bg-slate-950 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">

          {/* Popular Categories heading */}
          <h3 className="text-white font-black mb-6 text-sm">Popular Categories</h3>

          {/* Dense link grid — 4 columns like DoorDash */}
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
            ].map(cat => (
              <button
                key={cat}
                onClick={() => router.push('/home')}
                className="text-left text-xs text-gray-400 hover:text-gray-200 transition-colors py-0.5"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <span className="text-white font-black text-lg uppercase tracking-tight">Suqafuran</span>
            </div>

            {/* Footer links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {['Privacy', 'Terms', 'Accessibility', 'Do Not Sell My Info', 'Careers'].map(l => (
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
