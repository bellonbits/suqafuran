export interface CookiePreferences {
  necessary: boolean; // Always true (core authentication, security, cart)
  functional: boolean; // Preferences like language, market location, theme
  analytics: boolean; // Site usage, search performance, error tracking
  marketing: boolean; // Relevant deals, promotions, advertising
}

export interface CookieConsentRecord {
  consented: boolean;
  timestamp: string;
  version: string;
  preferences: CookiePreferences;
}

const STORAGE_KEY = 'suqafuran_cookie_consent';
const CONSENT_VERSION = '1.0';

export const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: false,
  marketing: false,
};

export const ALL_ACCEPTED_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: true,
  marketing: true,
};

export const MINIMAL_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

/**
 * Read the current stored cookie consent from localStorage
 */
export function getCookieConsent(): CookieConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentRecord;
    // Always ensure necessary is true
    parsed.preferences.necessary = true;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Check if the user has already made a cookie choice
 */
export function hasUserConsented(): boolean {
  const consent = getCookieConsent();
  return Boolean(consent && consent.consented);
}

/**
 * Save user cookie preferences
 */
export function saveCookieConsent(preferences: Partial<CookiePreferences>, consented = true): CookieConsentRecord {
  const record: CookieConsentRecord = {
    consented,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
    preferences: {
      necessary: true,
      functional: preferences.functional ?? true,
      analytics: preferences.analytics ?? false,
      marketing: preferences.marketing ?? false,
    },
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent('suqafuran_cookie_consent_changed', { detail: record }));
    } catch (e) {
      console.warn('Failed to save cookie consent to localStorage', e);
    }
  }

  return record;
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): CookieConsentRecord {
  return saveCookieConsent(ALL_ACCEPTED_PREFERENCES, true);
}

/**
 * Deny non-essential cookies (keep only strictly necessary)
 */
export function denyNonEssentialCookies(): CookieConsentRecord {
  return saveCookieConsent(MINIMAL_PREFERENCES, true);
}

/**
 * Trigger the Cookie Settings modal to open from anywhere in the application
 */
export function openCookieSettings(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('suqafuran_open_cookie_settings'));
  }
}

/**
 * Subscribe to cookie consent updates
 */
export function subscribeToCookieConsent(
  callback: (consent: CookieConsentRecord) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<CookieConsentRecord>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener('suqafuran_cookie_consent_changed', handler);
  return () => {
    window.removeEventListener('suqafuran_cookie_consent_changed', handler);
  };
}

