"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
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
  const { isAuthenticated } = useAuthStore();
  const openAuthModal = useAuthModal((s) => s.open);

  const [heroQuery, setHeroQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [dirTab, setDirTab] = useState<DirectoryTab>('cities');
  const [dirExpanded, setDirExpanded] = useState(false);

  const dirData = { cities: TOP_CITIES, categories: TOP_CATEGORIES, stores: TOP_STORES };
  const visibleItems = dirExpanded ? dirData[dirTab] : dirData[dirTab].slice(0, 8);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(heroQuery.trim()
      ? `/home?location=${encodeURIComponent(heroQuery.trim())}`
      : '/home');
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return router.push('/home');
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      () => { setIsDetecting(false); router.push('/home'); },
      () => { setIsDetecting(false); router.push('/home'); }
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#1B1B1B] font-sans">
      <AuthModal />

      {/* ══════════════════════════════════════════════════════
          NAV — logo left, Sign In + Sign Up right
      ══════════════════════════════════════════════════════ */}
      <nav className="absolute top-0 inset-x-0 z-50">
        <div className="max-w-full px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Real Suqafuran logo — white version on the colored hero */}
          <Link href="/" className="shrink-0">
            <img
              src="/icon1.png"
              alt="Suqafuran"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </Link>

          {/* Desktop auth */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => openAuthModal('signin')}
              className="text-sm font-black text-white border border-white/70 hover:bg-white/10 px-5 py-2 rounded-full transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="text-sm font-black text-[#0EA5E9] bg-white hover:bg-sky-50 px-5 py-2 rounded-full transition-colors shadow-sm"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile burger */}
          <button
            className="sm:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-sky-600 px-6 py-4 flex flex-col gap-3">
            <button
              onClick={() => { openAuthModal('signin'); setMobileMenuOpen(false); }}
              className="w-full text-sm font-black text-white py-3 rounded-full border border-white/50 hover:bg-white/10"
            >Sign In</button>
            <button
              onClick={() => { openAuthModal('signup'); setMobileMenuOpen(false); }}
              className="w-full text-sm font-black text-sky-600 bg-white py-3 rounded-full hover:bg-sky-50"
            >Sign Up</button>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO — Full-width sky-blue banner (DoorDash-exact layout)
          Food images bleed in from both sides, content centered
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0EA5E9] overflow-hidden">
        {/* Left bleed photo */}
        <div className="absolute inset-y-0 left-0 w-[30%] overflow-hidden pointer-events-none">
          <img
            src="/seller_hero.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-right opacity-90"
            style={{ maskImage: 'linear-gradient(to right, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 60%, transparent 100%)' }}
          />
        </div>

        {/* Right bleed photo */}
        <div className="absolute inset-y-0 right-0 w-[30%] overflow-hidden pointer-events-none">
          <img
            src="/business_hero.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-left opacity-90"
            style={{ maskImage: 'linear-gradient(to left, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 60%, transparent 100%)' }}
          />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 min-h-[420px]">
          {/* Logo — white */}
          <img
            src="/icon1.png"
            alt="Suqafuran"
            className="h-10 w-auto object-contain brightness-0 invert mb-6"
          />

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-2 max-w-xl">
            Africa&apos;s Marketplace for Everything
          </h1>
          <p className="text-white/80 text-sm font-semibold mb-8">
            Verified sellers · Secure escrow · Real-time chat
          </p>

          {/* Search bar — exact DoorDash pill style */}
          <form
            onSubmit={handleSearch}
            className="relative flex items-center bg-white rounded-full shadow-xl w-full max-w-md mx-auto px-5 py-1"
          >
            <MapPin className="h-4 w-4 text-gray-400 shrink-0 mr-3" />
            <input
              type="text"
              placeholder="Enter your city or neighborhood..."
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              className="flex-1 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            />
            <button
              type="submit"
              className="shrink-0 bg-[#0EA5E9] hover:bg-sky-600 text-white p-2.5 rounded-full transition-all ml-2 flex items-center justify-center"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Pills — Sign in for saved address / Use current Location */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={() => isAuthenticated ? router.push('/home') : openAuthModal('signin')}
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
          No emojis, all lucide icons, pastel bubbles
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">

            {/* Tile 1 — Start Selling */}
            <div className="flex flex-col items-center gap-5">
              <div className="w-28 h-28 rounded-full bg-sky-50 flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-sky-500" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#1B1B1B] leading-tight">
                  Become a<br />Seller
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[220px] mx-auto">
                  Post ads for free in minutes and reach thousands of verified buyers across Africa.
                </p>
              </div>
              <button
                onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
                className="text-sm font-black text-white bg-[#0EA5E9] hover:bg-sky-600 px-7 py-3 rounded-full transition-all shadow-md shadow-sky-500/20"
              >
                Become a Seller
              </button>
            </div>

            {/* Tile 2 — Grow Business */}
            <div className="flex flex-col items-center gap-5">
              <div className="w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center">
                <Store className="h-12 w-12 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#1B1B1B] leading-tight">
                  Become a<br />Business Partner
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[220px] mx-auto">
                  Create a storefront, manage products, track orders, and grow your customer base.
                </p>
              </div>
              <button
                onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
                className="text-sm font-black text-white bg-emerald-500 hover:bg-emerald-600 px-7 py-3 rounded-full transition-all shadow-md shadow-emerald-500/20"
              >
                List Your Business
              </button>
            </div>

            {/* Tile 3 — Get App */}
            <div className="flex flex-col items-center gap-5">
              <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center">
                <Smartphone className="h-12 w-12 text-slate-600" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#1B1B1B] leading-tight">
                  Get the best<br />experience
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[220px] mx-auto">
                  Download the Suqafuran app for live chat, offline sync, and push notifications.
                </p>
              </div>
              <button
                onClick={() => router.push('/home')}
                className="text-sm font-black text-[#1B1B1B] border border-[#1B1B1B] px-7 py-3 rounded-full hover:bg-gray-50 transition-all"
              >
                Get the App
              </button>
            </div>

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
                  { icon: <Tag className="h-4 w-4 text-[#0EA5E9]" />, text: 'Free listings, no upfront fees' },
                  { icon: <BadgeCheck className="h-4 w-4 text-emerald-500" />, text: 'Verified seller badge & trust score' },
                  { icon: <ShieldCheck className="h-4 w-4 text-sky-500" />, text: 'Escrow protection on every deal' },
                ].map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <span className="shrink-0">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <div>
                <button
                  onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
                  className="inline-flex items-center text-sm font-black text-white bg-[#0EA5E9] hover:bg-sky-600 px-8 py-4 rounded-full transition-all shadow-md shadow-sky-500/20"
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

      {/* ══════════════════════════════════════════════════════
          SECTION B — "Grow your business"  (mint bg)
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#F0FFF4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-h-[420px]">
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
                  onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
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
                  { icon: <Lock className="h-4 w-4 text-[#0EA5E9]" />, text: 'Escrow holds funds until delivery confirmed' },
                  { icon: <CheckCircle className="h-4 w-4 text-[#0EA5E9]" />, text: 'Identity-verified sellers & trust scores' },
                  { icon: <MessageSquare className="h-4 w-4 text-[#0EA5E9]" />, text: 'Real-time encrypted chat with sellers' },
                  { icon: <Star className="h-4 w-4 text-[#0EA5E9]" />, text: 'Community ratings & buyer reviews' },
                ].map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <span className="shrink-0">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <div>
                <button
                  onClick={() => router.push('/home')}
                  className="inline-flex items-center text-sm font-black text-white bg-[#0EA5E9] hover:bg-sky-600 px-8 py-4 rounded-full transition-all shadow-md shadow-sky-500/20"
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
                    <ShieldCheck className="h-5 w-5 text-[#0EA5E9]" />
                    <span className="font-black text-[#1B1B1B]">Transaction #8821</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-black bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
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
                onClick={() => router.push('/home')}
                className="text-left text-sm font-semibold text-gray-700 hover:text-[#0EA5E9] transition-colors py-1"
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
                className="inline-flex items-center gap-2 text-sm font-black text-[#1B1B1B] hover:text-[#0EA5E9] transition-colors"
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
                onClick={() => router.push('/home')}
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
