import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Cookie, 
  ShieldCheck, 
  Sliders, 
  X, 
  Check, 
  Info, 
  Lock, 
  Sparkles, 
  BarChart3, 
  SlidersHorizontal 
} from 'lucide-react';
import {
  CookiePreferences,
  CookieConsentRecord,
  getCookieConsent,
  hasUserConsented,
  acceptAllCookies,
  denyNonEssentialCookies,
  saveCookieConsent,
  DEFAULT_PREFERENCES,
} from '@/utils/cookieConsent';

export const CookieConsentBanner: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Current working preferences in the settings modal
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setMounted(true);

    const consent = getCookieConsent();
    if (consent) {
      setPreferences(consent.preferences);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }

    // Listen for custom trigger to open settings (e.g. from footer link)
    const handleOpenSettings = () => {
      const current = getCookieConsent();
      if (current) {
        setPreferences(current.preferences);
      }
      setShowSettingsModal(true);
    };

    window.addEventListener('suqafuran_open_cookie_settings', handleOpenSettings);
    return () => {
      window.removeEventListener('suqafuran_open_cookie_settings', handleOpenSettings);
    };
  }, []);

  const handleAcceptAll = () => {
    const record = acceptAllCookies();
    setPreferences(record.preferences);
    setShowBanner(false);
    setShowSettingsModal(false);
  };

  const handleDenyNonEssential = () => {
    const record = denyNonEssentialCookies();
    setPreferences(record.preferences);
    setShowBanner(false);
    setShowSettingsModal(false);
  };

  const handleSavePreferences = () => {
    const record = saveCookieConsent(preferences, true);
    setPreferences(record.preferences);
    setShowBanner(false);
    setShowSettingsModal(false);
  };

  const togglePreference = (key: keyof Omit<CookiePreferences, 'necessary'>) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!mounted) return null;

  return (
    <>
      {/* ─── Floating Cookie Consent Banner ──────────────────────────────── */}
      {showBanner && !showSettingsModal && (
        <div 
          className="fixed bottom-3 inset-x-3 sm:bottom-5 sm:right-5 sm:left-auto sm:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
          role="region"
          aria-label="Cookie consent banner"
        >
          <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 text-slate-800 dark:text-neutral-100 flex flex-col gap-4">
            
            {/* Header info */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0078E8]/10 dark:bg-[#0078E8]/20 text-[#0078E8] flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>We Value Your Privacy &amp; Cookies</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed mt-1">
                  Suqafuran uses cookies and related technologies to ensure secure transactions, maintain your active session, remember your regional preferences, and provide relevant marketplace recommendations.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer mr-auto"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Cookie Settings</span>
              </button>

              <button
                type="button"
                onClick={handleDenyNonEssential}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 transition-colors cursor-pointer border border-slate-200 dark:border-neutral-700"
              >
                Deny Non-Essential
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-5 py-2 rounded-xl text-xs font-black bg-[#0078E8] hover:bg-[#0066c7] text-white transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cookie Settings Preferences Modal ──────────────────────────── */}
      {showSettingsModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setShowSettingsModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
          >
            <div
              className="w-full max-w-xl max-h-[88vh] bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col min-h-0 overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#0078E8]/10 text-[#0078E8] flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 id="cookie-settings-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Cookie Preferences
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Manage how Suqafuran stores and processes cookies on your device
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-xl font-bold cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Categories List */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5">
                
                {/* 1. Strictly Necessary (Always On) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-700/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Strictly Necessary Cookies
                      </h4>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      Always Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-neutral-300 mt-2 leading-relaxed">
                    Essential for website security, authentication login sessions, shopping cart tracking, and prevention of fraudulent activities. These cookies cannot be disabled.
                  </p>
                </div>

                {/* 2. Functional & Preferences */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-700/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Functional &amp; Regional Preferences
                      </h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={() => togglePreference('functional')}
                        className="sr-only peer"
                        aria-label="Toggle Functional cookies"
                      />
                      <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0078E8]" />
                    </label>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-neutral-300 mt-2 leading-relaxed">
                    Allows the marketplace to remember your preferences such as dark mode, preferred Kenyan market location (e.g., Eastleigh Market), and recent search filters.
                  </p>
                </div>

                {/* 3. Analytics & Performance */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-700/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Analytics &amp; Performance
                      </h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={() => togglePreference('analytics')}
                        className="sr-only peer"
                        aria-label="Toggle Analytics cookies"
                      />
                      <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0078E8]" />
                    </label>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-neutral-300 mt-2 leading-relaxed">
                    Helps us measure site traffic, identify search performance bottlenecks, optimize page load speed, and understand which features buyers find most valuable.
                  </p>
                </div>

                {/* 4. Marketing & Targeted Deals */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-700/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Cookie className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Marketing &amp; Personalized Offers
                      </h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={() => togglePreference('marketing')}
                        className="sr-only peer"
                        aria-label="Toggle Marketing cookies"
                      />
                      <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0078E8]" />
                    </label>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-neutral-300 mt-2 leading-relaxed">
                    Used to deliver customized seller promotions, featured deals matching your shopping interests, and assess advertising campaign effectiveness.
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Your consent choice will be securely stored for 12 months. You can modify these settings at any time by clicking "Cookie Settings" in the website footer.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDenyNonEssential}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Reject Non-Essential
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#0078E8] hover:bg-[#0078E8]/10 transition-colors cursor-pointer"
                  >
                    Accept All
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-300 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-[#0078E8] hover:bg-[#0066c7] text-white transition-all shadow-xs hover:shadow-md cursor-pointer"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
