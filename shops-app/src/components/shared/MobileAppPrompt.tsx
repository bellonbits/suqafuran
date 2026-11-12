import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, ExternalLink, Smartphone } from 'lucide-react';
import { isCapacitorApp } from '@/lib/capacitor-utils';

const STORAGE_KEY = 'suqafuran_app_prompt_dismissed_until';
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.suqafuran.app&hl=en';
const APP_STORE_URL = 'https://apps.apple.com/ke/app/suqafuran-buy-sell-online/id6761457184';

export const MobileAppPrompt: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    setMounted(true);

    // If running inside Capacitor native mobile app, never show the "Get App" prompt
    if (isCapacitorApp()) return;

    // Detect user platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isMobile = isIOS || isAndroid || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || window.innerWidth <= 768;

    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('other');

    // Only auto-show for mobile web users
    if (isMobile) {
      try {
        const dismissedUntil = localStorage.getItem(STORAGE_KEY);
        if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
          // Slight delay after page load for smooth experience
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 1400);
          return () => clearTimeout(timer);
        }
      } catch {
        // Fallback if localStorage is disabled
        setIsOpen(true);
      }
    }

    // Custom event listener so any button (e.g., "Open App" in mobile header) can trigger this modal
    const handleOpenPrompt = () => {
      setIsOpen(true);
    };

    window.addEventListener('suqafuran_open_app_prompt', handleOpenPrompt);
    return () => {
      window.removeEventListener('suqafuran_open_app_prompt', handleOpenPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_DURATION_MS));
    } catch {
      // Ignore storage errors
    }
  };

  if (!mounted || !isOpen || isCapacitorApp()) return null;

  const targetUrl = platform === 'ios' ? APP_STORE_URL : GOOGLE_PLAY_URL;
  const storeLabel = platform === 'ios' ? 'Apple App Store' : 'Google Play';
  const buttonLabel = platform === 'ios' ? 'Get on App Store' : platform === 'android' ? 'Get on Google Play' : 'Get the Suqafuran App';

  return createPortal(
    <div 
      className="fixed inset-0 z-[999998] bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Get the Suqafuran App"
    >
      <div 
        className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 text-slate-900 dark:text-white flex flex-col items-center text-center animate-in slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Bar */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-700 mb-4 sm:hidden" />

        {/* Close Button (X) */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-500 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close app prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {/* App Icon (Squircle shape with shadow) */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-white p-2 shadow-lg shadow-sky-500/10 border border-slate-100 dark:border-neutral-200 flex items-center justify-center overflow-hidden">
            <img 
              src="/app-logo.png" 
              alt="Suqafuran App Icon" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to Google Play or App Store icon if /app-logo.png fails
                (e.target as HTMLImageElement).src = platform === 'ios' ? '/app-store-icon.png' : '/google-play-icon.png';
              }}
            />
          </div>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-700 text-[9px] font-black uppercase text-white shadow-xs">
            Free
          </span>
        </div>

        {/* Rating Stars & Official Badge */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 mb-2">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
          <span className="font-bold text-slate-800 dark:text-neutral-200">4.9 ★</span>
          <span className="text-slate-400">•</span>
          <span>Official App</span>
        </div>

        {/* Headline */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Get the app to keep using Suqafuran
        </h3>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 mt-2 max-w-xs leading-relaxed">
          Search faster, chat directly with verified sellers, track orders, and get instant deal alerts on your phone.
        </p>

        {/* Main CTA Button (High-contrast full-width pill) */}
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDismiss}
          className="mt-6 w-full py-3.5 px-6 rounded-full bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-98 transition-all cursor-pointer"
        >
          {platform === 'ios' ? (
            <img src="/app-store-icon.png" alt="" className="w-5 h-5 object-contain" />
          ) : (
            <img src="/google-play-icon.png" alt="" className="w-5 h-5 object-contain" />
          )}
          <span>{buttonLabel}</span>
          <ExternalLink className="w-4 h-4 ml-0.5 opacity-70" />
        </a>

        {/* Secondary Store Link (If user is on Android show iOS or vice-versa) */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-600 dark:text-neutral-300">
          <span>Available on:</span>
          <a
            href={GOOGLE_PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-bold text-[#005fb8] dark:text-sky-300"
          >
            Google Play
          </a>
          <span>•</span>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-bold text-[#005fb8] dark:text-sky-300"
          >
            App Store
          </a>
        </div>

        {/* Secondary Dismiss Button ("Continue in browser") */}
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-4 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer py-1"
        >
          Continue in browser
        </button>
      </div>
    </div>,
    document.body
  );
};

