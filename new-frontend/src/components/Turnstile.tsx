"use client";

import { useEffect, useRef } from 'react';

interface TurnstileProps {
  onToken: (token: string) => void;
  onError?: () => void;
}

export const Turnstile: React.FC<TurnstileProps> = ({ onToken, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (containerRef.current && (window as any).turnstile) {
        (window as any).turnstile.render('#turnstile-container', {
          sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
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

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onToken, onError]);

  return <div id="turnstile-container" ref={containerRef} className="flex justify-center my-4" />;
};
