'use client';

import { useEffect } from 'react';
import { initCacheBuster, addCacheBusterToRequests } from '@/lib/cache-buster';
import { isCapacitorApp } from '@/lib/capacitor-utils';

/**
 * Client component that runs cache-busting logic on page load
 * Clears old service workers, caches, and localStorage
 * Forces fresh content from Vercel
 */
export function CacheBuster() {
  useEffect(() => {
    // Run cache buster on mount
    initCacheBuster();

    // Skip fetch wrapper for native apps (Capacitor) as it can interfere with router & asset loading
    const isNativeApp = isCapacitorApp() || (typeof window !== 'undefined' && (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:'));
    if (!isNativeApp) {
      addCacheBusterToRequests();
    }

    // Also run on visibility change (when tab becomes active)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, bust cache again
        initCacheBuster();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
