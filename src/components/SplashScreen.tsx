import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Phase transitions
    const t1 = setTimeout(() => setPhase('hold'), 500);
    const t2 = setTimeout(() => setPhase('out'), 3200);
    const t3 = setTimeout(() => onDone(), 3800);

    // Progress bar simulation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + (100 / 30); // Reach 100 in ~3 seconds
      });
    }, 100);

    return () => { 
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); 
      clearInterval(interval);
    };
  }, [onDone]);

  // Brand Colors
  const PRIMARY = '#0ea5e9'; // Sky 500
  const SECONDARY = '#f57e20'; // Orange
  const DARK = '#0c4a6e'; // Sky 900
  const LIGHT = '#7dd3fc'; // Sky 300

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: DARK,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: phase === 'out' ? 0 : 1,
      pointerEvents: phase === 'out' ? 'none' : 'all',
      overflow: 'hidden',
    }}>
      
      {/* Dynamic Background Blobs */}
      <div className="blob" style={{
        position: 'absolute', top: '-10%', right: '-10%',
        width: '80vw', height: '80vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${PRIMARY}33 0%, transparent 70%)`,
        filter: 'blur(60px)',
        animation: 'float 10s ease-in-out infinite alternate',
      }} />
      <div className="blob" style={{
        position: 'absolute', bottom: '-15%', left: '-15%',
        width: '90vw', height: '90vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${SECONDARY}15 0%, transparent 70%)`,
        filter: 'blur(80px)',
        animation: 'float 12s ease-in-out infinite alternate-reverse',
      }} />

      {/* Main Logo Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        transform: phase === 'in' ? 'scale(0.8) translateY(20px)' : 'scale(1) translateY(0)',
        opacity: phase === 'in' ? 0 : 1,
        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease',
        zIndex: 10,
      }}>
        
        {/* Animated Logo Container */}
        <div style={{
          position: 'relative',
          width: 140,
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Pulsing Outer Ring */}
          <div style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            border: `2px solid ${PRIMARY}`,
            opacity: 0.3,
            animation: 'pulseRing 2s ease-out infinite',
          }} />
          
          {/* Glass Card for Logo */}
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '32px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.1)',
            animation: 'logoFloat 3s ease-in-out infinite',
          }}>
            <img 
              src="/icon1.png" 
              alt="Suqafuran" 
              style={{ width: 90, height: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} 
            />
          </div>
        </div>

        {/* Text Brand */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            color: 'white',
            fontSize: 32,
            fontWeight: 900,
            margin: 0,
            letterSpacing: -1,
            textShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            Suqafuran
          </h1>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 8,
            marginTop: 4 
          }}>
            <div style={{ width: 12, height: 2, background: SECONDARY, borderRadius: 1 }} />
            <p style={{
              color: LIGHT,
              fontSize: 12,
              letterSpacing: 4,
              textTransform: 'uppercase',
              fontWeight: 700,
              margin: 0,
            }}>
              Connect · Trade · Prosper
            </p>
            <div style={{ width: 12, height: 2, background: SECONDARY, borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* Modern Loader at Bottom */}
      <div style={{
        position: 'absolute',
        bottom: '12%',
        width: '60%',
        maxWidth: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        opacity: phase === 'hold' ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        {/* Track */}
        <div style={{
          width: '100%',
          height: 4,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Fill with Shimmer */}
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${PRIMARY}, ${LIGHT}, ${PRIMARY})`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
            borderRadius: 2,
            transition: 'width 0.3s ease-out',
            boxShadow: `0 0 10px ${PRIMARY}`,
          }} />
        </div>
        <span style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          Initializing Marketplace...
        </span>
      </div>

      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(5%, 5%) scale(1.1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
