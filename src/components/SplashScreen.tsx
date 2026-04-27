import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('out'), 2600);
    const t3 = setTimeout(() => onDone(), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  // exact header/hero color
  const PRIMARY = '#0ea5e9';
  const DARK    = '#0284c7';
  const LIGHT   = '#38bdf8';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: `linear-gradient(175deg, ${LIGHT} 0%, ${PRIMARY} 45%, ${DARK} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)',
      opacity: phase === 'out' ? 0 : 1,
      pointerEvents: phase === 'out' ? 'none' : 'all',
      overflow: 'hidden',
    }}>

      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '-25%', right: '-25%',
        width: '80vw', height: '80vw', borderRadius: '50%',
        background: 'rgba(255,255,255,0.10)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-25%',
        width: '70vw', height: '70vw', borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '-10%',
        width: '30vw', height: '30vw', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }} />

      {/* Pulsing rings around logo */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.3)',
          animation: `ringPulse 2.4s ease-out ${i * 0.5}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Main content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        transform: phase === 'in' ? 'scale(0.78) translateY(24px)' : 'scale(1) translateY(0)',
        opacity: phase === 'in' ? 0 : 1,
        transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
        zIndex: 1,
      }}>

        {/* Logo circle */}
        <div style={{
          width: 130,
          height: 130,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.45)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}>
          <img
            src="/icon1.png"
            alt="Suqafuran"
            style={{ width: 90, height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* App name */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'white',
            fontSize: 30,
            fontWeight: 900,
            margin: 0,
            letterSpacing: -0.5,
            textShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            Suqafuran
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 11,
            letterSpacing: 3.5,
            textTransform: 'uppercase',
            fontWeight: 600,
            margin: '6px 0 0',
          }}>
            Buy · Sell · Connect
          </p>
        </div>
      </div>

      {/* Bottom loader */}
      <div style={{
        position: 'absolute',
        bottom: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        opacity: phase === 'hold' ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        {/* Dot loader */}
        <div style={{ display: 'flex', gap: 7 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              animation: `dotBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ringPulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(3.2); opacity: 0; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.5; }
          40%            { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
