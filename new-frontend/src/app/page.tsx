"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin, ArrowRight, ShoppingBag, Store, Smartphone,
  Shield, Star, ChevronRight, Zap, Globe2, TrendingUp,
  CheckCircle2, Package, MessageCircle, ChevronDown, Menu, X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuth';
import { useAuthModal } from '../store/useAuthModal';
import { AuthModal } from '../components/shared/AuthModal';

/* ─── Animated counter hook ──────────────────────────────── */
function useCountUp(target: number, duration = 2000, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return value;
}

/* ─── Floating product card widget ───────────────────────── */
const FloatingCard = ({
  emoji, label, price, color, delay, style
}: {
  emoji: string; label: string; price: string; color: string; delay: string; style?: React.CSSProperties
}) => (
  <div
    className="absolute bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/60 dark:border-slate-700/60 rounded-2xl p-3 shadow-xl flex items-center gap-2.5 hover:scale-105 transition-all cursor-default select-none"
    style={{ animation: `floatY 3s ease-in-out ${delay} infinite`, ...style }}
  >
    <span className={`text-xl p-2 rounded-xl ${color}`}>{emoji}</span>
    <div>
      <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 truncate max-w-[80px]">{label}</p>
      <p className="text-[10px] font-black text-sky-600 dark:text-sky-400">{price}</p>
    </div>
  </div>
);

/* ─── Stat counter card ───────────────────────────────────── */
const StatCard = ({ value, suffix, label, icon, active }: { value: number; suffix: string; label: string; icon: React.ReactNode; active: boolean }) => {
  const count = useCountUp(value, 2000, active);
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
      <span className="mb-2 text-white/80">{icon}</span>
      <span className="text-4xl font-black text-white tabular-nums">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-sm font-bold text-white/70 mt-1">{label}</span>
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const openAuthModal = useAuthModal((s) => s.open);

  const [heroQuery, setHeroQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Intersection observer for stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      router.push(`/home?location=${encodeURIComponent(heroQuery.trim())}`);
    } else {
      router.push('/home');
    }
  };

  const handleEnterMarketplace = () => {
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-white overflow-x-hidden">

      {/* ── AuthModal (global, floating) ── */}
      <AuthModal />

      {/* ════════════════════════════════════════════════════════
          TOP NAV — Logo + Sign In / Sign Up
      ════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-[#0B132B]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Suqafuran</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-400">
            <Link href="/home" className="hover:text-sky-500 transition-colors">Marketplace</Link>
            <a href="#how-it-works" className="hover:text-sky-500 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-sky-500 transition-colors">Features</a>
            <a href="#categories" className="hover:text-sky-500 transition-colors">Categories</a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={handleEnterMarketplace}
                className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-black px-5 py-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md shadow-sky-500/25"
              >
                Enter Marketplace →
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('signin')}
                  className="hidden sm:block text-sm font-black text-slate-700 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-black px-5 py-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md shadow-sky-500/25"
                >
                  Sign Up Free
                </button>
              </>
            )}
            <button
              className="md:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-xl px-6 py-4 space-y-3">
            <Link href="/home" className="block text-sm font-bold hover:text-sky-500 transition-colors py-1" onClick={() => setMobileMenuOpen(false)}>Marketplace</Link>
            <a href="#how-it-works" className="block text-sm font-bold hover:text-sky-500 transition-colors py-1" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#features" className="block text-sm font-bold hover:text-sky-500 transition-colors py-1" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#categories" className="block text-sm font-bold hover:text-sky-500 transition-colors py-1" onClick={() => setMobileMenuOpen(false)}>Categories</a>
            {!isAuthenticated && (
              <button
                onClick={() => { openAuthModal('signin'); setMobileMenuOpen(false); }}
                className="block w-full text-sm font-bold text-center py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:border-sky-300 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-emerald-50/40 dark:from-[#0B132B] dark:via-[#0D1A2E] dark:to-[#0B2040]" />
        {/* Decorative blobs */}
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-sky-400/10 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] bg-sky-300/10 dark:bg-sky-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Text + Search */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-full px-4 py-1.5 text-xs font-black tracking-wider uppercase">
                <Globe2 className="h-3.5 w-3.5" />
                Pan-African Marketplace
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white">
                  Buy & Sell{' '}
                  <span className="relative">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-sky-400">
                      Anything
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 8 Q75 2 150 8 Q225 14 298 8" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6"/>
                    </svg>
                  </span>{' '}
                  Across{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-400">
                    Africa
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-semibold leading-relaxed max-w-lg">
                  The trusted marketplace connecting buyers and sellers across Somalia, Kenya, Ethiopia, and beyond — with secure escrow, verified sellers, and real-time chat.
                </p>
              </div>

              {/* Location search bar */}
              <form onSubmit={handleSearch} className="relative flex items-center bg-white dark:bg-slate-800/80 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-200 dark:border-slate-700 p-2 max-w-lg">
                <span className="absolute left-5 text-slate-400">
                  <MapPin className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="Enter your city or neighborhood..."
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  className="flex-1 pl-11 pr-4 py-3.5 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 font-semibold text-sm"
                />
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-black text-sm px-6 py-3.5 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0 shadow-md shadow-sky-500/30"
                >
                  Find Deals
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Quick action pills */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => isAuthenticated ? router.push('/home') : openAuthModal('signin')}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-300 dark:hover:border-sky-700 hover:text-sky-600 dark:hover:text-sky-400 px-4 py-2.5 rounded-full text-xs font-black transition-all hover:scale-105"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {isAuthenticated ? 'Browse Marketplace' : 'Sign in for saved addresses'}
                </button>
                <button
                  onClick={() => router.push('/home')}
                  className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 px-4 py-2.5 rounded-full text-xs font-black transition-all hover:scale-105"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Use Current Location
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {['🧑🏿', '👩🏾', '🧔🏾', '👩🏿', '🧑🏽'].map((emoji, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-sm shadow-sm">
                      {emoji}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 mb-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />)}
                    <span className="font-black text-slate-800 dark:text-slate-100 ml-1">4.9</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs">Trusted by 50,000+ traders</p>
                </div>
              </div>
            </div>

            {/* Right: Visual Collage */}
            <div className="hidden lg:block relative h-[560px]">
              {/* Main phone mockup */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-56 h-[460px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[3rem] p-3 shadow-2xl border border-slate-700/60">
                {/* Screen */}
                <div className="bg-white rounded-[2.4rem] h-full overflow-hidden flex flex-col">
                  {/* Status bar */}
                  <div className="bg-sky-500 px-4 py-2 flex items-center justify-between">
                    <span className="text-[8px] font-black text-white">Suqafuran</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center">
                        <Shield className="h-2 w-2 text-white" />
                      </div>
                    </div>
                  </div>
                  {/* App content */}
                  <div className="flex-1 p-2.5 space-y-2 bg-slate-50">
                    <div className="bg-slate-100 rounded-full py-1.5 px-2.5 flex items-center gap-1 text-[8px] text-slate-400">
                      <MapPin className="h-2.5 w-2.5 text-sky-500" />
                      <span>Mogadishu, Somalia</span>
                    </div>
                    {/* Product cards */}
                    {[
                      { emoji: '💻', name: 'MacBook Pro', price: '$899', badge: 'Verified' },
                      { emoji: '📱', name: 'iPhone 15 Pro', price: '$650', badge: 'Escrow' },
                      { emoji: '🐫', name: 'Somali Camel', price: '$1,200', badge: 'Trusted' },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg flex items-center justify-center text-lg shrink-0">
                          {item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-slate-800 truncate">{item.name}</p>
                          <p className="text-[9px] font-black text-sky-600">{item.price}</p>
                        </div>
                        <span className="text-[7px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                          {item.badge}
                        </span>
                      </div>
                    ))}
                    {/* Live chat bubble */}
                    <div className="bg-sky-500 rounded-2xl rounded-tl-sm p-2 ml-4">
                      <p className="text-[8px] font-bold text-white">Is this still available? 🙏</p>
                    </div>
                    <div className="bg-white rounded-2xl rounded-tr-sm p-2 mr-4 border border-slate-100 shadow-sm">
                      <p className="text-[8px] font-bold text-slate-700">Yes! Secure with escrow ✅</p>
                    </div>
                  </div>
                  {/* Bottom bar */}
                  <div className="bg-white border-t border-slate-100 py-1.5 px-3 flex justify-around">
                    {['🏠', '🔍', '💬', '👤'].map((icon, i) => (
                      <span key={i} className={`text-sm ${i === 0 ? 'scale-110' : 'opacity-50'}`}>{icon}</span>
                    ))}
                  </div>
                </div>
                {/* Home indicator */}
                <div className="w-16 h-1 bg-white/30 rounded-full mx-auto mt-1.5" />
              </div>

              {/* Floating product cards */}
              <FloatingCard emoji="💻" label="MacBook Air" price="$899" color="bg-sky-50" delay="0s" style={{ top: 16, left: -20, width: 148 }} />
              <FloatingCard emoji="🐫" label="Somali Camel" price="$1,200" color="bg-amber-50" delay="1s" style={{ top: 120, right: -24, width: 148 }} />
              <FloatingCard emoji="👟" label="Nike Jordan" price="$140" color="bg-rose-50" delay="2s" style={{ bottom: 60, left: -16, width: 148 }} />
              <FloatingCard emoji="📱" label="iPhone 15 Pro" price="$650" color="bg-emerald-50" delay="1.5s" style={{ bottom: 100, right: -20, width: 148 }} />

              {/* Live badge */}
              <div className="absolute top-0 right-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-500/30">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE DEALS
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 dark:text-slate-600 animate-bounce">
          <span className="text-xs font-bold">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          THREE-PILLAR CTA CARDS (DoorDash-style value props)
      ════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <span className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900 rounded-full px-4 py-1.5 text-xs font-black tracking-wider uppercase">
              <Zap className="h-3.5 w-3.5" />
              Everything you need
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Built for African Traders
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-semibold max-w-2xl mx-auto">
              Whether you're a buyer, seller, or business — Suqafuran has you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Start Selling */}
            <div className="group relative bg-gradient-to-br from-sky-500 to-sky-600 rounded-3xl p-8 overflow-hidden cursor-pointer hover:scale-[1.02] transition-all shadow-xl shadow-sky-500/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-12 translate-x-12" />
              <div className="relative z-10 space-y-5">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Start Selling & Earn</h3>
                  <p className="text-sky-100 font-semibold text-sm leading-relaxed">
                    List items for free in minutes and reach thousands of verified buyers nearby. No upfront fees.
                  </p>
                </div>
                <ul className="space-y-2">
                  {['Free listings', 'Secure payments', 'Instant notifications'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sky-100 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
                  className="flex items-center gap-1.5 bg-white text-sky-600 font-black text-sm px-5 py-2.5 rounded-full hover:bg-sky-50 transition-all group-hover:gap-2.5 hover:scale-105 active:scale-95 w-fit"
                >
                  Become a Seller
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Card 2: Grow Business */}
            <div className="group relative bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 overflow-hidden cursor-pointer hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-12 translate-x-12" />
              <div className="relative z-10 space-y-5">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Store className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Grow Your Business</h3>
                  <p className="text-emerald-100 font-semibold text-sm leading-relaxed">
                    Create a digital storefront, manage your inventory, track orders, and build customer trust at scale.
                  </p>
                </div>
                <ul className="space-y-2">
                  {['Business dashboard', 'Order tracking', 'Analytics & insights'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-emerald-100 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => isAuthenticated ? router.push('/dashboard') : openAuthModal('signup')}
                  className="flex items-center gap-1.5 bg-white text-emerald-600 font-black text-sm px-5 py-2.5 rounded-full hover:bg-emerald-50 transition-all group-hover:gap-2.5 hover:scale-105 active:scale-95 w-fit"
                >
                  Grow Store
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Card 3: Get App */}
            <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-3xl p-8 overflow-hidden cursor-pointer hover:scale-[1.02] transition-all shadow-xl shadow-slate-900/30">
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl -translate-y-12 translate-x-12" />
              <div className="relative z-10 space-y-5">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Smartphone className="h-7 w-7 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Get the Mobile App</h3>
                  <p className="text-slate-400 font-semibold text-sm leading-relaxed">
                    Live chat alerts, precise location matching, offline sync, and push notifications — all on the go.
                  </p>
                </div>
                <ul className="space-y-2">
                  {['iOS & Android', 'Offline sync', 'Push notifications'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl px-4 py-2.5 transition-all text-left hover:scale-105 active:scale-95">
                    <span className="text-lg"></span>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Download on</p>
                      <p className="text-[11px] font-black">App Store</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl px-4 py-2.5 transition-all text-left hover:scale-105 active:scale-95">
                    <span className="text-lg">▶</span>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Get it on</p>
                      <p className="text-[11px] font-black">Google Play</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS SECTION (animated counters)
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-sky-500 via-sky-600 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Africa's Fastest Growing Marketplace
            </h2>
            <p className="text-sky-200 font-semibold">Numbers that speak for themselves</p>
          </div>
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={50000} suffix="+" label="Active Traders" icon={<Globe2 className="h-6 w-6" />} active={statsVisible} />
            <StatCard value={150000} suffix="+" label="Listings Posted" icon={<Package className="h-6 w-6" />} active={statsVisible} />
            <StatCard value={8} suffix="" label="African Countries" icon={<TrendingUp className="h-6 w-6" />} active={statsVisible} />
            <StatCard value={98} suffix="%" label="Satisfaction Rate" icon={<Star className="h-6 w-6" />} active={statsVisible} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <span className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-full px-4 py-1.5 text-xs font-black tracking-wider uppercase">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Simple & Secure
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-sky-200 via-sky-400 to-emerald-400 dark:from-sky-900 dark:via-sky-700 dark:to-emerald-700" />
            {[
              { step: '01', icon: <MapPin className="h-7 w-7" />, title: 'Set Your Location', desc: 'Enter your city or neighborhood to see deals near you.', color: 'from-sky-400 to-sky-500' },
              { step: '02', icon: <ShoppingBag className="h-7 w-7" />, title: 'Browse & Discover', desc: 'Find verified sellers, negotiate prices, and explore categories.', color: 'from-sky-500 to-emerald-500' },
              { step: '03', icon: <MessageCircle className="h-7 w-7" />, title: 'Chat & Negotiate', desc: 'Message sellers directly with real-time encrypted chat.', color: 'from-emerald-400 to-emerald-500' },
              { step: '04', icon: <Shield className="h-7 w-7" />, title: 'Buy with Escrow', desc: 'Pay securely via escrow — funds released on delivery.', color: 'from-emerald-500 to-sky-500' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4 group">
                <div className={`relative w-28 h-28 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-all`}>
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CATEGORIES GRID
      ════════════════════════════════════════════════════════ */}
      <section id="categories" className="py-24 bg-slate-50 dark:bg-[#0B132B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900 rounded-full px-4 py-1.5 text-xs font-black tracking-wider uppercase">
                <Zap className="h-3.5 w-3.5" />
                Browse by category
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Find What You Need
              </h2>
            </div>
            <Link href="/home" className="hidden sm:flex items-center gap-1.5 text-sky-500 hover:text-sky-600 font-black text-sm group">
              View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { emoji: '📱', label: 'Electronics', color: 'from-sky-400 to-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/30' },
              { emoji: '👗', label: 'Fashion', color: 'from-rose-400 to-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' },
              { emoji: '🚗', label: 'Vehicles', color: 'from-amber-400 to-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              { emoji: '🏠', label: 'Real Estate', color: 'from-emerald-400 to-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
              { emoji: '🥬', label: 'Groceries', color: 'from-green-400 to-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
              { emoji: '🐫', label: 'Livestock', color: 'from-orange-400 to-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
              { emoji: '💄', label: 'Beauty', color: 'from-pink-400 to-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30' },
              { emoji: '🛋️', label: 'Home & Garden', color: 'from-teal-400 to-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30' },
              { emoji: '⚽', label: 'Sports', color: 'from-violet-400 to-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
              { emoji: '📚', label: 'Books', color: 'from-indigo-400 to-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
              { emoji: '🔧', label: 'Services', color: 'from-slate-500 to-slate-600', bg: 'bg-slate-100 dark:bg-slate-800/60' },
              { emoji: '🍔', label: 'Food', color: 'from-red-400 to-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={`/home`}
                className={`group flex flex-col items-center gap-3 ${cat.bg} rounded-2xl p-5 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all hover:scale-105 cursor-pointer`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                  {cat.emoji}
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 text-center leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TRUST SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-full px-4 py-1.5 text-xs font-black tracking-wider uppercase">
                  <Shield className="h-3.5 w-3.5" />
                  Trusted & Secure
                </span>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Trade with Complete Confidence
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Our escrow system, seller verification, and buyer protection ensure every transaction is safe — no matter where you are.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: <Shield className="h-5 w-5 text-emerald-500" />, title: 'Escrow Protection', desc: 'Funds held securely until you confirm delivery.', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { icon: <CheckCircle2 className="h-5 w-5 text-sky-500" />, title: 'Verified Sellers', desc: 'Identity-checked sellers with trust scores & badges.', bg: 'bg-sky-50 dark:bg-sky-950/30' },
                  { icon: <MessageCircle className="h-5 w-5 text-violet-500" />, title: 'Encrypted Chat', desc: 'Direct messaging with end-to-end encryption.', bg: 'bg-violet-50 dark:bg-violet-950/30' },
                  { icon: <Star className="h-5 w-5 text-amber-500" />, title: 'Ratings & Reviews', desc: 'Community-driven reputation system you can trust.', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default">
                    <div className={`${item.bg} p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Visual trust card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-white font-black text-lg">Active Transaction</span>
                  <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-black px-3 py-1.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Escrow Active
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Buyer', value: 'Ahmad K.', icon: '👤' },
                    { label: 'Seller', value: 'Amina S. ✓', icon: '🏪' },
                    { label: 'Item', value: 'iPhone 15 Pro', icon: '📱' },
                    { label: 'Amount', value: '$650.00', icon: '💰' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-slate-700/60 last:border-0">
                      <span className="text-slate-400 text-sm font-bold flex items-center gap-2">
                        <span>{row.icon}</span> {row.label}
                      </span>
                      <span className="text-white font-black text-sm">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Payment held in escrow</span>
                    <span>Awaiting delivery</span>
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                  </div>
                </div>
                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Confirm Delivery ✓
                </button>
              </div>
              {/* Decorative badge */}
              <div className="absolute -top-4 -right-4 bg-sky-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg shadow-sky-500/30 rotate-12">
                100% Safe
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FINAL CTA BANNER
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-emerald-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Ready to Trade Across Africa?
            </h2>
            <p className="text-xl text-sky-100 font-semibold max-w-2xl mx-auto">
              Join over 50,000 traders buying and selling securely on Suqafuran every day.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => isAuthenticated ? router.push('/home') : openAuthModal('signup')}
              className="bg-white text-sky-600 font-black text-lg px-10 py-4 rounded-2xl hover:bg-sky-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-sky-900/30"
            >
              {isAuthenticated ? 'Go to Marketplace →' : 'Start For Free →'}
            </button>
            <button
              onClick={() => router.push('/home')}
              className="bg-white/10 backdrop-blur-sm text-white font-black text-lg px-10 py-4 rounded-2xl border border-white/30 hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
            >
              Browse Marketplace
            </button>
          </div>
          <p className="text-sky-200 text-sm font-semibold">
            No credit card required · Free to list · Trusted since 2023
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-black text-sm">S</span>
                </div>
                <span className="text-xl font-black text-white tracking-tight">Suqafuran</span>
              </div>
              <p className="text-sm font-semibold leading-relaxed max-w-xs">
                Africa's trusted marketplace for buying, selling, and trading — with verified sellers and secure escrow.
              </p>
              <div className="flex gap-3">
                {['🇸🇴', '🇰🇪', '🇪🇹', '🇹🇿', '🇺🇬'].map((flag, i) => (
                  <span key={i} className="text-xl" title="Supported country">{flag}</span>
                ))}
              </div>
            </div>
            {/* Links */}
            <div>
              <h4 className="font-black text-white mb-4 text-sm uppercase tracking-wider">Marketplace</h4>
              <ul className="space-y-2.5">
                {['Browse Listings', 'Sell an Item', 'Business Dashboard', 'Track Order', 'Messages'].map(l => (
                  <li key={l}>
                    <Link href="/home" className="text-sm font-semibold hover:text-sky-400 transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white mb-4 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-2.5">
                {['Help Center', 'Buyer Protection', 'Seller Guidelines', 'Escrow Policy', 'Contact Us'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm font-semibold hover:text-sky-400 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-semibold">© 2024 Suqafuran. All rights reserved.</p>
            <div className="flex gap-6 text-xs font-semibold">
              <a href="#" className="hover:text-sky-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-sky-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-sky-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
