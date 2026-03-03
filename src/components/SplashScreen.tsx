import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('out'), 2200);
    const t3 = setTimeout(() => onDone(), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(160deg, #7dcce9 0%, #5ab8d6 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.5s ease',
        opacity: phase === 'out' ? 0 : 1,
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Logo container with scale-in animation */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          transform: phase === 'in' ? 'scale(0.8)' : 'scale(1)',
          opacity: phase === 'in' ? 0 : 1,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        }}
      >
        <img
          src="/suqafuran.svg"
          alt="Suqafuran"
          style={{
            height: 72,
            width: 'auto',
            filter: 'brightness(0) invert(1)',
          }}
        />
        <p style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: 15,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          fontWeight: 500,
          margin: 0,
        }}>
          Buy. Sell. Connect.
        </p>
      </div>

      {/* Pulse dots loader */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          display: 'flex',
          gap: 8,
          opacity: phase === 'hold' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              animation: `splashPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splashPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
