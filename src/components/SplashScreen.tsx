import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 350);
    const t2 = setTimeout(() => setPhase('out'), 2300);
    const t3 = setTimeout(() => onDone(), 2750);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(160deg, #5bb3ea 0%, var(--color-primary-500) 60%, #c1ebff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.45s cubic-bezier(0.4,0,0.2,1)',
        opacity: phase === 'out' ? 0 : 1,
        pointerEvents: phase === 'out' ? 'none' : 'all',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-20%',
        width: '70vw', height: '70vw', borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-20%',
        width: '60vw', height: '60vw', borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none',
      }} />

      {/* Animated rings */}
      {phase === 'hold' && [1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.4)',
            animation: `ringPulse 2s ease-out ${i * 0.4}s infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Logo + tagline */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          transform: phase === 'in' ? 'scale(0.75) translateY(20px)' : 'scale(1) translateY(0)',
          opacity: phase === 'in' ? 0 : 1,
          transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
          zIndex: 1,
        }}
      >
        {/* Logo on a frosted circle */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid rgba(255,255,255,0.5)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          <img
            src="/icon1.png"
            alt="Suqafuran"
            style={{ height: 72, width: 'auto' }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'white',
            fontSize: 22,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -0.3,
          }}>
            Suqafuran
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 12,
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            fontWeight: 600,
            margin: '4px 0 0',
          }}>
            Buy · Sell · Connect
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 48,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.25)',
          overflow: 'hidden',
          opacity: phase === 'hold' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div style={{
          height: '100%',
          borderRadius: 2,
          background: 'white',
          animation: phase === 'hold' ? 'progressFill 1.8s ease forwards' : 'none',
        }} />
      </div>

      <style>{`
        @keyframes ringPulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
};
