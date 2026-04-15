import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SLIDES = [
  {
    gradient: 'linear-gradient(160deg, var(--color-primary-500) 0%, var(--color-primary-400) 60%, var(--color-primary-300) 100%)',
    title: 'Discover Great\nDeals Near You',
    titleKey: 'onboarding.slide1Title',
    subtitle: 'Browse thousands of listings — electronics, fashion, cars, furniture, and more.',
    subtitleKey: 'onboarding.slide1Subtitle',
  },
  {
    gradient: 'linear-gradient(160deg, #1e3a4a 0%, #2d5a70 60%, var(--color-primary-500) 100%)',
    title: 'Sell Anything\nIn Minutes',
    titleKey: 'onboarding.slide2Title',
    subtitle: 'Post an ad in under 2 minutes. Upload photos, set your price, get buyers.',
    subtitleKey: 'onboarding.slide2Subtitle',
  },
  {
    gradient: 'linear-gradient(160deg, #0f2027 0%, #1a3a4a 50%, #2d6a7a 100%)',
    title: 'Safe, Verified\n& Trusted',
    titleKey: 'onboarding.slide3Title',
    subtitle: 'Verified sellers, trusted ratings and buyer protection — so you can deal with confidence.',
    subtitleKey: 'onboarding.slide3Subtitle',
  },
];

interface OnboardingScreenProps {
  onDone: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        // 100dvh = dynamic viewport height — shrinks when address bar shows on iOS Safari
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        background: slide.gradient,
        transition: 'background 0.5s ease',
        userSelect: 'none',
        // Prevent any internal scroll — everything must fit on one screen
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-20%',
        width: '70vw', height: '70vw', borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '10%', left: '-25%',
        width: '55vw', height: '55vw', borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
      }} />

      {/* ── TOP: safe-area-aware progress + skip ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        // env(safe-area-inset-top) handles notch / Dynamic Island on all iPhones
        paddingTop: 'calc(env(safe-area-inset-top, 44px) + 14px)',
        paddingLeft: 20,
        paddingRight: 20,
        zIndex: 1,
        flexShrink: 0,
      }}>
        {SLIDES.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= current ? 'white' : 'rgba(255,255,255,0.28)',
            transition: 'background 0.35s ease',
            cursor: 'pointer',
          }} />
        ))}
        <button onClick={finish} style={{
          background: 'rgba(255,255,255,0.18)',
          border: 'none', borderRadius: 20,
          color: 'white',
          // clamp(min, preferred, max) — scales between screen sizes
          padding: 'clamp(4px,1.2vh,8px) clamp(12px,3.5vw,18px)',
          fontSize: 'clamp(11px,3.5vw,14px)',
          fontWeight: 600, cursor: 'pointer', marginLeft: 6,
          backdropFilter: 'blur(4px)', whiteSpace: 'nowrap',
        }}>
          {t('onboarding.skip', 'Skip')}
        </button>
      </div>

      {/* ── MIDDLE: illustration — flexes to fill available height ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // clamp keeps illustration from being too big on large screens
        // or too small on iPhone SE / mini
        padding: 'clamp(16px,4vh,40px) 24px',
        minHeight: 0,
      }}>
        <svg
          viewBox="0 0 280 280"
          fill="none"
          key={current}
          style={{
            // min(75vw, 42vh) — respects both narrow and short screens
            width: 'min(75vw, 42vh)',
            maxWidth: 300,
            height: 'auto',
          }}
        >
          <rect x="20" y="40" width="240" height="200" rx="24" fill="rgba(255,255,255,0.12)" />
          <rect x="36" y="56" width="208" height="130" rx="16" fill="rgba(255,255,255,0.15)" />

          {current === 0 && (
            <>
              <rect x="52" y="72" width="80" height="80" rx="12" fill="rgba(255,255,255,0.9)" />
              <rect x="60" y="80" width="64" height="44" rx="8" fill="var(--color-primary-500)" opacity="0.5" />
              <circle cx="92" cy="102" r="16" fill="var(--color-primary-500)" opacity="0.8" />
              <circle cx="92" cy="102" r="9" fill="white" opacity="0.9" />
              <rect x="60" y="132" width="40" height="5" rx="2.5" fill="#64748b" opacity="0.5" />
              <rect x="60" y="141" width="28" height="4" rx="2" fill="#f57e20" opacity="0.7" />

              <rect x="148" y="72" width="80" height="80" rx="12" fill="rgba(255,255,255,0.9)" />
              <rect x="156" y="80" width="64" height="44" rx="8" fill="#f57e20" opacity="0.3" />
              <circle cx="188" cy="102" r="16" fill="#f57e20" opacity="0.6" />
              <circle cx="188" cy="102" r="9" fill="white" opacity="0.9" />
              <rect x="156" y="132" width="40" height="5" rx="2.5" fill="#64748b" opacity="0.5" />
              <rect x="156" y="141" width="32" height="4" rx="2" fill="var(--color-primary-500)" opacity="0.7" />

              <rect x="52" y="168" width="176" height="32" rx="16" fill="rgba(255,255,255,0.9)" />
              <circle cx="72" cy="184" r="7" stroke="#94a3b8" strokeWidth="2" fill="none" />
              <line x1="77" y1="189" x2="81" y2="193" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              <rect x="88" y="181" width="80" height="6" rx="3" fill="#e2e8f0" />
            </>
          )}

          {current === 1 && (
            <>
              <rect x="72" y="68" width="136" height="110" rx="16" fill="rgba(255,255,255,0.9)" />
              <rect x="84" y="80" width="112" height="60" rx="10" fill="var(--color-primary-500)" opacity="0.25" />
              <circle cx="140" cy="110" r="24" fill="rgba(125,204,233,0.4)" />
              <circle cx="140" cy="110" r="16" fill="white" opacity="0.9" />
              <circle cx="140" cy="110" r="10" fill="var(--color-primary-500)" opacity="0.7" />
              <rect x="84" y="150" width="60" height="6" rx="3" fill="#e2e8f0" />
              <rect x="84" y="160" width="40" height="5" rx="2.5" fill="#e2e8f0" />
              <circle cx="192" cy="80" r="22" fill="#f57e20" />
              <text x="192" y="85" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">$</text>
              <circle cx="88" cy="190" r="18" fill="rgba(255,255,255,0.25)" />
              <path d="M88 198 L88 184 M83 189 L88 184 L93 189" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {current === 2 && (
            <>
              <path d="M140 66 L190 88 L190 126 Q190 160 140 180 Q90 160 90 126 L90 88 Z" fill="rgba(255,255,255,0.9)" />
              <path d="M140 80 L174 96 L174 122 Q174 148 140 164 Q106 148 106 122 L106 96 Z" fill="var(--color-primary-500)" opacity="0.35" />
              <path d="M124 126 L134 136 L158 110" stroke="var(--color-primary-500)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="196" cy="80" r="20" fill="#f57e20" />
              <text x="196" y="86" textAnchor="middle" fill="white" fontSize="18">★</text>
              <circle cx="84" cy="178" r="18" fill="var(--color-primary-500)" />
              <path d="M76 178 L81 183 L92 172" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="140" cy="202" r="10" fill="rgba(255,255,255,0.5)" />
              <circle cx="156" cy="202" r="10" fill="rgba(255,255,255,0.4)" />
              <circle cx="124" cy="202" r="10" fill="rgba(255,255,255,0.4)" />
            </>
          )}
        </svg>
      </div>

      {/* ── BOTTOM: text + buttons — safe-area-aware, never clips ── */}
      <div style={{
        flexShrink: 0,
        padding: 'clamp(0px,2vh,16px) clamp(20px,6vw,32px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + clamp(12px,3vh,28px))',
        zIndex: 1,
      }}>
        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 'clamp(12px,2.5vh,20px)' }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? 20 : 6,
              height: 6, borderRadius: 3,
              background: i === current ? 'white' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* Title */}
        <h1 style={{
          color: 'white',
          // clamp: min 22px on tiny screens, scales up, max 34px on large
          fontSize: 'clamp(22px, 6vw, 34px)',
          fontWeight: 800,
          margin: '0 0 clamp(8px,1.8vh,14px)',
          lineHeight: 1.15,
          letterSpacing: -0.5,
          whiteSpace: 'pre-line',
        }}>
          {t(slide.titleKey, slide.title)}
        </h1>

        {/* Subtitle */}
        <p style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 'clamp(13px,3.8vw,15px)',
          lineHeight: 1.6,
          margin: '0 0 clamp(16px,3.5vh,32px)',
          maxWidth: 340,
        }}>
          {t(slide.subtitleKey, slide.subtitle)}
        </p>

        {/* Sign In button */}
        <button
          onClick={() => { finish(); navigate('/login'); }}
          style={{
            width: '100%',
            padding: 'clamp(12px,3.2vh,17px)',
            borderRadius: 100,
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            color: 'white',
            fontSize: 'clamp(14px,4vw,16px)',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 10,
            backdropFilter: 'blur(8px)',
            letterSpacing: 0.2,
          }}
        >
          {t('auth.signIn', 'Sign In')}
        </button>

        {/* Continue / Get Started button */}
        <button
          onClick={() => { if (isLast) { finish(); navigate('/signup'); } else { setCurrent(c => c + 1); } }}
          style={{
            width: '100%',
            padding: 'clamp(12px,3.2vh,17px)',
            borderRadius: 100,
            background: '#0f172a',
            border: 'none',
            color: 'white',
            fontSize: 'clamp(14px,4vw,16px)',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 'clamp(10px,2vh,18px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            letterSpacing: 0.2,
          }}
        >
          {isLast ? t('onboarding.getStarted', 'Get Started') : t('onboarding.continue', 'Continue')}
        </button>

        {/* Register link */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 'clamp(12px,3.5vw,14px)',
          margin: 0,
        }}>
          {t('onboarding.noAccount', "Don't have an account?")}{' '}
          <button
            onClick={() => { finish(); navigate('/signup'); }}
            style={{
              background: 'none', border: 'none',
              color: 'white', fontWeight: 700, cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 'clamp(12px,3.5vw,14px)',
              padding: 0,
            }}
          >
            {t('onboarding.register', 'Register')}
          </button>
        </p>
      </div>
    </div>
  );
};
