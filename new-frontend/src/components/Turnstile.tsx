"use client";

import { useEffect, useRef } from 'react';

interface TurnstileProps {
  onToken: (token: string) => void;
  onError?: () => void;
}

export const Turnstile: React.FC<TurnstileProps> = ({ onToken, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sitekey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!sitekey) {
      console.error('Turnstile sitekey is not configured. Please set NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY environment variable.');
      return;
    }

    // Only load script if it hasn't been loaded already
    if ((window as any).turnstile) {
      // Script already loaded, render immediately
      if (containerRef.current) {
        (window as any).turnstile.render('#turnstile-container', {
          sitekey: sitekey,
          theme: 'light',
          callback: (token: string) => {
            onToken(token);
          },
          'error-callback': () => {
            onError?.();
          },
        });
      }
      return;
    }

    // Check if script is already in DOM
    if (document.querySelector('script[src*="turnstile"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (containerRef.current && (window as any).turnstile) {
        (window as any).turnstile.render('#turnstile-container', {
          sitekey: sitekey,
          theme: 'light',
          callback: (token: string) => {
            onToken(token);
          },
          'error-callback': () => {
            onError?.();
          },
        });
      }
    };
  }, [sitekey, onToken, onError]);

  if (!sitekey) {
    return <div className="text-red-500 text-xs p-2 text-center">Verification service not configured</div>;
  }

  return <div id="turnstile-container" ref={containerRef} className="flex justify-center my-4" />;
};
