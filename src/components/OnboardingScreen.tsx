import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    bg: 'linear-gradient(160deg, #7dcce9 0%, #5ab8d6 100%)',
    icon: (
      <svg viewBox="0 0 120 120" fill="none" style={{ width: 200, height: 200 }}>
        <circle cx="60" cy="60" r="55" fill="rgba(255,255,255,0.15)" />
        <rect x="25" y="35" width="70" height="55" rx="8" fill="white" />
        <rect x="33" y="44" width="30" height="22" rx="4" fill="#7dcce9" />
        <rect x="33" y="71" width="20" height="4" rx="2" fill="#e2e8f0" />
        <rect x="33" y="79" width="14" height="3" rx="1.5" fill="#f57e20" />
        <rect x="69" y="44" width="18" height="3" rx="1.5" fill="#e2e8f0" />
        <rect x="69" y="51" width="14" height="3" rx="1.5" fill="#e2e8f0" />
        <rect x="69" y="58" width="16" height="3" rx="1.5" fill="#e2e8f0" />
        <rect x="69" y="71" width="22" height="3" rx="1.5" fill="#e2e8f0" />
        <rect x="69" y="78" width="18" height="3" rx="1.5" fill="#e2e8f0" />
        {/* Shopping bag */}
        <circle cx="85" cy="30" r="14" fill="#f57e20" />
        <path d="M79 30 Q79 25 85 25 Q91 25 91 30" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="77" y="30" width="16" height="12" rx="2" fill="white" opacity="0.9" />
        <path d="M82 35 L84 37 L88 33" stroke="#f57e20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Discover Great Deals',
    subtitle: 'Browse thousands of listings in your city — electronics, fashion, cars, and more.',
    accent: '#5ab8d6',
  },
  {
    bg: 'linear-gradient(160deg, #f57e20 0%, #e06010 100%)',
    icon: (
      <svg viewBox="0 0 120 120" fill="none" style={{ width: 200, height: 200 }}>
        <circle cx="60" cy="60" r="55" fill="rgba(255,255,255,0.15)" />
        {/* Phone */}
        <rect x="35" y="28" width="50" height="65" rx="8" fill="white" />
        <rect x="40" y="35" width="40" height="28" rx="4" fill="#7dcce9" opacity="0.3" />
        {/* Camera icon */}
        <circle cx="60" cy="49" r="10" fill="#7dcce9" opacity="0.6" />
        <circle cx="60" cy="49" r="6" fill="white" opacity="0.8" />
        {/* Form lines */}
        <rect x="40" y="69" width="40" height="4" rx="2" fill="#e2e8f0" />
        <rect x="40" y="77" width="28" height="4" rx="2" fill="#e2e8f0" />
        {/* Price tag */}
        <circle cx="82" cy="35" r="14" fill="#f57e20" />
        <text x="82" y="40" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">$</text>
        {/* Upload arrow */}
        <circle cx="38" cy="90" r="10" fill="#f57e20" />
        <path d="M38 94 L38 87 M35 90 L38 87 L41 90" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Sell Anything Easily',
    subtitle: 'Post your ad in under 2 minutes. Upload photos, set your price, and start getting calls.',
    accent: '#e06010',
  },
  {
    bg: 'linear-gradient(160deg, #1e293b 0%, #334155 100%)',
    icon: (
      <svg viewBox="0 0 120 120" fill="none" style={{ width: 200, height: 200 }}>
        <circle cx="60" cy="60" r="55" fill="rgba(255,255,255,0.08)" />
        {/* Shield */}
        <path d="M60 25 L85 36 L85 58 Q85 78 60 90 Q35 78 35 58 L35 36 Z" fill="#7dcce9" opacity="0.9" />
        <path d="M60 32 L78 41 L78 57 Q78 72 60 82 Q42 72 42 57 L42 41 Z" fill="white" opacity="0.15" />
        {/* Check */}
        <path d="M50 60 L57 67 L72 50" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Stars */}
        <circle cx="88" cy="32" r="9" fill="#f57e20" />
        <text x="88" y="36.5" textAnchor="middle" fill="white" fontSize="11">★</text>
        {/* Verified badge */}
        <circle cx="32" cy="82" r="9" fill="#22c55e" />
        <path d="M28 82 L31 85 L36 79" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Safe & Trusted',
    subtitle: 'All sellers are verified with ID. Ratings, reviews and trust scores keep you protected.',
    accent: '#334155',
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

  const next = () => {
    if (current < SLIDES.length - 1) setCurrent(current + 1);
    else finish();
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
        background: slide.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background 0.5s ease',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)',
        userSelect: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '56px 24px 0' }}>
        {!isLast && (
          <button
            onClick={finish}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              borderRadius: 20,
              color: 'white',
              padding: '6px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Illustration */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          transition: 'all 0.35s ease',
        }}
        key={current}
      >
        {slide.icon}
      </div>

      {/* Text content */}
      <div style={{ width: '100%', padding: '0 32px 32px' }}>
        <h1 style={{
          color: 'white',
          fontSize: 28,
          fontWeight: 800,
          margin: '0 0 12px',
          lineHeight: 1.2,
          textAlign: 'center',
        }}>
          {slide.title}
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.82)',
          fontSize: 15,
          lineHeight: 1.6,
          textAlign: 'center',
          margin: '0 0 36px',
        }}>
          {slide.subtitle}
        </p>

        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? 'white' : 'rgba(255,255,255,0.4)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={next}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            background: 'white',
            color: isLast ? '#1e293b' : slide.accent,
            fontSize: 17,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>

        {isLast && (
          <button
            onClick={() => { finish(); navigate('/login'); }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: 'transparent',
              border: '2px solid rgba(255,255,255,0.5)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 12,
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};
