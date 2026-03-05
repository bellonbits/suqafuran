import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    gradient: 'linear-gradient(160deg, #7dcce9 0%, #4aafc8 60%, #2d8fab 100%)',
    pattern: '#5ab8d6',
    title: 'Discover Great\nDeals Near You',
    subtitle: 'Browse thousands of listings — electronics, fashion, cars, furniture, and more.',
  },
  {
    gradient: 'linear-gradient(160deg, #1e3a4a 0%, #2d5a70 60%, #7dcce9 100%)',
    pattern: '#2d5a70',
    title: 'Sell Anything\nIn Minutes',
    subtitle: 'Post an ad in under 2 minutes. Upload photos, set your price, get buyers.',
  },
  {
    gradient: 'linear-gradient(160deg, #0f2027 0%, #1a3a4a 50%, #2d6a7a 100%)',
    pattern: '#1a3a4a',
    title: 'Safe, Verified\n& Trusted',
    subtitle: 'Verified sellers, trusted ratings and buyer protection — so you can deal with confidence.',
  },
];

interface OnboardingScreenProps {
  onDone: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const navigate = useNavigate();

  const finish = () => {
    localStorage.setItem('suqafuran-onboarding-seen', '1');
    onDone();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 50 && current < SLIDES.length - 1) setCurrent(c => c + 1);
    if (dx < -50 && current > 0) setCurrent(c => c - 1);
    touchStartX.current = null;
  };

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        background: slide.gradient,
        transition: 'background 0.6s ease',
        userSelect: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Decorative circles (depth effect) */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-20%',
        width: '70vw',
        height: '70vw',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-25%',
        width: '55vw',
        height: '55vw',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />

      {/* Top row: progress bars + skip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '56px 24px 0',
        zIndex: 1,
      }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= current ? 'white' : 'rgba(255,255,255,0.3)',
              transition: 'background 0.4s ease',
            }}
          />
        ))}
        <button
          onClick={finish}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 20,
            color: 'white',
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 8,
            backdropFilter: 'blur(4px)',
            whiteSpace: 'nowrap',
          }}
        >
          Skip
        </button>
      </div>

      {/* Illustration area (centered) */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}>
        {/* Abstract product illustration */}
        <svg viewBox="0 0 280 280" fill="none" style={{ width: '75vw', maxWidth: 300 }} key={current}>
          {/* Background card */}
          <rect x="20" y="40" width="240" height="200" rx="24" fill="rgba(255,255,255,0.12)" />
          <rect x="36" y="56" width="208" height="130" rx="16" fill="rgba(255,255,255,0.15)" />

          {current === 0 && (
            <>
              {/* Discovery / listings */}
              <rect x="52" y="72" width="80" height="80" rx="12" fill="rgba(255,255,255,0.9)" />
              <rect x="60" y="80" width="64" height="44" rx="8" fill="#7dcce9" opacity="0.5" />
              <circle cx="92" cy="102" r="16" fill="#7dcce9" opacity="0.8" />
              <circle cx="92" cy="102" r="9" fill="white" opacity="0.9" />
              <rect x="60" y="132" width="40" height="5" rx="2.5" fill="#64748b" opacity="0.5" />
              <rect x="60" y="141" width="28" height="4" rx="2" fill="#f57e20" opacity="0.7" />

              <rect x="148" y="72" width="80" height="80" rx="12" fill="rgba(255,255,255,0.9)" />
              <rect x="156" y="80" width="64" height="44" rx="8" fill="#f57e20" opacity="0.3" />
              <circle cx="188" cy="102" r="16" fill="#f57e20" opacity="0.6" />
              <circle cx="188" cy="102" r="9" fill="white" opacity="0.9" />
              <rect x="156" y="132" width="40" height="5" rx="2.5" fill="#64748b" opacity="0.5" />
              <rect x="156" y="141" width="32" height="4" rx="2" fill="#7dcce9" opacity="0.7" />

              {/* Search bar */}
              <rect x="52" y="168" width="176" height="32" rx="16" fill="rgba(255,255,255,0.9)" />
              <circle cx="72" cy="184" r="7" stroke="#94a3b8" strokeWidth="2" fill="none" />
              <line x1="77" y1="189" x2="81" y2="193" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              <rect x="88" y="181" width="80" height="6" rx="3" fill="#e2e8f0" />
            </>
          )}

          {current === 1 && (
            <>
              {/* Sell / camera */}
              <rect x="72" y="68" width="136" height="110" rx="16" fill="rgba(255,255,255,0.9)" />
              <rect x="84" y="80" width="112" height="60" rx="10" fill="#7dcce9" opacity="0.25" />
              <circle cx="140" cy="110" r="24" fill="rgba(125,204,233,0.4)" />
              <circle cx="140" cy="110" r="16" fill="white" opacity="0.9" />
              <circle cx="140" cy="110" r="10" fill="#7dcce9" opacity="0.7" />
              <rect x="84" y="150" width="60" height="6" rx="3" fill="#e2e8f0" />
              <rect x="84" y="160" width="40" height="5" rx="2.5" fill="#e2e8f0" />

              {/* Price badge */}
              <circle cx="192" cy="80" r="22" fill="#f57e20" />
              <text x="192" y="85" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">$</text>

              {/* Upload arrow */}
              <circle cx="88" cy="190" r="18" fill="rgba(255,255,255,0.25)" />
              <path d="M88 198 L88 184 M83 189 L88 184 L93 189" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {current === 2 && (
            <>
              {/* Trust / shield */}
              <path d="M140 66 L190 88 L190 126 Q190 160 140 180 Q90 160 90 126 L90 88 Z" fill="rgba(255,255,255,0.9)" />
              <path d="M140 80 L174 96 L174 122 Q174 148 140 164 Q106 148 106 122 L106 96 Z" fill="#7dcce9" opacity="0.35" />
              <path d="M124 126 L134 136 L158 110" stroke="#7dcce9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Star badge */}
              <circle cx="196" cy="80" r="20" fill="#f57e20" />
              <text x="196" y="86" textAnchor="middle" fill="white" fontSize="18">★</text>

              {/* Verified badge */}
              <circle cx="84" cy="178" r="18" fill="#22c55e" />
              <path d="M76 178 L81 183 L92 172" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Users */}
              <circle cx="140" cy="202" r="10" fill="rgba(255,255,255,0.5)" />
              <circle cx="156" cy="202" r="10" fill="rgba(255,255,255,0.4)" />
              <circle cx="124" cy="202" r="10" fill="rgba(255,255,255,0.4)" />
            </>
          )}
        </svg>
      </div>

      {/* Bottom content */}
      <div style={{
        padding: '0 28px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)',
        zIndex: 1,
      }}>
        {/* Title */}
        <h1 style={{
          color: 'white',
          fontSize: 32,
          fontWeight: 800,
          margin: '0 0 14px',
          lineHeight: 1.15,
          letterSpacing: -0.5,
          whiteSpace: 'pre-line',
        }}>
          {slide.title}
        </h1>

        {/* Subtitle */}
        <p style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 15,
          lineHeight: 1.65,
          margin: '0 0 36px',
          maxWidth: 320,
        }}>
          {slide.subtitle}
        </p>

        {/* Sign In button (light) */}
        <button
          onClick={() => { finish(); navigate('/login'); }}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 100,
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            color: 'white',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 12,
            backdropFilter: 'blur(8px)',
            letterSpacing: 0.2,
          }}
        >
          Sign In
        </button>

        {/* Get Started button (dark) */}
        <button
          onClick={() => { if (isLast) { finish(); navigate('/signup'); } else { setCurrent(c => c + 1); } }}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 100,
            background: '#0f172a',
            border: 'none',
            color: 'white',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            letterSpacing: 0.2,
          }}
        >
          {isLast ? 'Get Started' : 'Continue'}
        </button>

        {/* Register link */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 14,
          margin: 0,
          paddingBottom: 8,
        }}>
          Don't have an account?{' '}
          <button
            onClick={() => { finish(); navigate('/signup'); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 14,
              padding: 0,
            }}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};
