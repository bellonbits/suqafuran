"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Zap, Building2, ChevronDown, ChevronUp,
  ShieldCheck, BarChart3, Tag, Package, TrendingUp, Palette,
  Upload, Users, Headphones, Phone, Loader, Crown, Sparkles, ArrowRight
} from 'lucide-react';
import { SubscriptionCard } from '@/components/seller/SubscriptionCard';
import { UpgradeModal } from '@/components/seller/UpgradeModal';
import { useAuthStore } from '@/store/useAuth';
import api from '@/services/api';

const PLANS = [
  {
    id: 'free',
    name: 'Free Shop',
    price: 0,
    annualPrice: 0,
    tagline: 'Get started selling',
    icon: Package,
    highlighted: false,
    badge: null,
    trial: null,
    ctaText: 'Current Plan',
    features: [
      'Up to 20 products',
      'Basic messaging',
      'Standard shop page',
      'Community support',
    ],
    color: 'gray',
  },
  {
    id: 'starter',
    name: 'Starter Pro',
    price: 750,
    annualPrice: 8000,
    tagline: 'Grow your sales & brand',
    icon: Zap,
    highlighted: false,
    badge: 'Popular',
    trial: 7,
    ctaText: 'Start 7-Day Free Trial',
    features: [
      'Up to 200 products',
      'Analytics dashboard',
      'Verified shop badge',
      'Customer discount codes',
      'Priority email support (24h)',
    ],
    color: 'blue',
  },
  {
    id: 'business',
    name: 'Business VIP',
    price: 2500,
    annualPrice: 26000,
    tagline: 'Scale your wholesale & retail',
    icon: Building2,
    highlighted: true,
    badge: 'Best Value',
    trial: null,
    ctaText: 'Upgrade to Business',
    features: [
      'Unlimited products',
      'Top search ranking placement',
      'Custom shop banner & branding',
      'Bulk Excel/CSV product import',
      'Up to 3 staff manager accounts',
      'Dedicated WhatsApp VIP support',
    ],
    color: 'sky',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800/80 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800/40"
      >
        <span className="font-extrabold text-slate-800 dark:text-white text-xs md:text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-xs text-slate-500 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-800 pt-3 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get(`/subscriptions/sellers/${user.id}/features`)
      .then((res) => setCurrentPlan(res.data?.plan_name ?? 'free'))
      .catch(() => setCurrentPlan('free'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading plan options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Header ── */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs font-black">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SUQAFURAN SELLER PLANS</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Choose Your Plan
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
          Unlock unlimited listings, verified merchant badge, and priority search ranking to grow your shop.
        </p>

        {/* Annual / Monthly toggle */}
        <div className="inline-flex items-center gap-3 mt-4 bg-slate-100/80 dark:bg-neutral-900 p-1 rounded-2xl border border-slate-200/60 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !annual ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              annual ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            <span>Annual</span>
            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              annual ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}>
              Save 15%
            </span>
          </button>
        </div>
      </div>

      {/* ── Available Plans Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan.toLowerCase() === plan.id;
          const price = annual ? Math.round(plan.annualPrice / 12) : plan.price;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-white dark:bg-neutral-900 rounded-3xl p-6 border transition-all ${
                plan.highlighted
                  ? 'border-sky-500 shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/20'
                  : 'border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500 text-white shadow-md">
                  {plan.badge}
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  plan.highlighted
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-200'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400">{plan.tagline}</p>
                </div>
              </div>

              <div className="mb-5 pb-4 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {price === 0 ? "Free" : `KSh ${price.toLocaleString()}`}
                  </span>
                  {price > 0 && <span className="text-xs text-slate-400">/month</span>}
                </div>
                {annual && plan.annualPrice > 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    Billed KSh {plan.annualPrice.toLocaleString()} / year
                  </p>
                )}
                {plan.trial && (
                  <p className="text-[11px] text-sky-600 dark:text-sky-400 font-bold mt-1">
                    Includes {plan.trial}-day free trial
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6 text-xs">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-slate-700 dark:text-neutral-200 font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowUpgradeModal(true)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-2xl text-xs font-black transition-all shadow-sm ${
                  isCurrent
                    ? 'bg-slate-100 dark:bg-neutral-800 text-slate-400 cursor-not-allowed'
                    : plan.highlighted
                    ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20 active:scale-95'
                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-slate-900 active:scale-95'
                }`}
              >
                {isCurrent ? 'Current Plan' : plan.ctaText}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── FAQs Section ── */}
      <div className="space-y-3 pt-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
        <div className="space-y-2.5">
          <FAQItem q="Can I cancel anytime?" a="Yes, you can cancel your subscription at any time with one click. Your access continues until the end of your billing cycle." />
          <FAQItem q="How do I pay with M-Pesa?" a="We accept direct M-Pesa STK push. Enter your Safaricom phone number and enter your PIN on your handset when prompted." />
          <FAQItem q="What is the Verified Merchant Badge?" a="The verified badge is displayed on your store profile and listings, demonstrating to buyers that your identity and business have been confirmed." />
          <FAQItem q="Can I upgrade or downgrade my tier?" a="Yes, you can upgrade at any time to immediately unlock higher product limits and marketing perks." />
        </div>
      </div>

      <UpgradeModal sellerId={user.id} isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
