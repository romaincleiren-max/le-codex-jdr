// ============================================================================
// LEVEL UP OVERLAY — Animation RPG déclenchée quand level_up_pending passe à true
// Pure CSS, aucune dépendance externe
// ============================================================================

import React, { useEffect, useState } from 'react';

// Particules flottantes générées aléatoirement
function Particle({ delay, x, size, color }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      bottom: '10%',
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      animation: `lvlup-float 2.4s ease-out ${delay}s forwards`,
      opacity: 0,
      pointerEvents: 'none',
    }} />
  );
}

// Chiffre +1 flottant
function FloatingPlus({ delay, x }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      bottom: '25%',
      fontSize: '2.5rem',
      fontWeight: 900,
      color: '#fbbf24',
      fontFamily: 'Cinzel, serif',
      textShadow: '0 0 20px #f59e0b, 0 0 40px #f59e0b',
      animation: `lvlup-rise 2s ease-out ${delay}s forwards`,
      opacity: 0,
      pointerEvents: 'none',
      userSelect: 'none',
    }}>
      +1
    </div>
  );
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  delay: Math.random() * 0.8,
  x: 5 + Math.random() * 90,
  size: `${6 + Math.random() * 10}px`,
  color: ['#fbbf24', '#f59e0b', '#fcd34d', '#ef4444', '#fb923c'][Math.floor(Math.random() * 5)],
}));

const PLUS_SIGNS = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  delay: i * 0.18,
  x: 10 + i * 14,
}));

export default function LevelUpOverlay({ charName, newLevel, onDismiss }) {
  const [phase, setPhase] = useState('enter'); // enter → show → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 3800);
    const t3 = setTimeout(() => onDismiss?.(), 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <>
      {/* Keyframes injectées en style global */}
      <style>{`
        @keyframes lvlup-float {
          0%   { transform: translateY(0) scale(1); opacity: 0.9; }
          80%  { opacity: 0.7; }
          100% { transform: translateY(-180px) scale(0.3); opacity: 0; }
        }
        @keyframes lvlup-rise {
          0%   { transform: translateY(0) scale(0.5); opacity: 0; }
          15%  { opacity: 1; }
          60%  { transform: translateY(-120px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-200px) scale(0.8); opacity: 0; }
        }
        @keyframes lvlup-banner-in {
          0%   { transform: translateY(-60px) scale(0.8); opacity: 0; }
          60%  { transform: translateY(8px) scale(1.04); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes lvlup-glow-pulse {
          0%, 100% { box-shadow: 0 0 40px #f59e0b, 0 0 80px #f59e0b44; }
          50%       { box-shadow: 0 0 80px #fbbf24, 0 0 160px #f59e0b66; }
        }
        @keyframes lvlup-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Fond semi-transparent */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.8s',
          opacity: phase === 'exit' ? 0 : 1,
          cursor: 'pointer',
        }}
      >
        {/* Particules */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {PARTICLES.map(p => <Particle key={p.id} {...p} />)}
          {PLUS_SIGNS.map(p => <FloatingPlus key={p.id} {...p} />)}
        </div>

        {/* Bannière centrale */}
        <div
          style={{
            animation: 'lvlup-banner-in 0.6s cubic-bezier(.22,1,.36,1) forwards, lvlup-glow-pulse 1.6s ease-in-out 0.6s infinite',
            background: 'linear-gradient(135deg, #1c1108 0%, #2d1a08 50%, #1c1108 100%)',
            border: '3px solid #f59e0b',
            borderRadius: '1.5rem',
            padding: '2.5rem 3rem',
            textAlign: 'center',
            maxWidth: '380px',
            width: '90%',
            position: 'relative',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Étoiles décoratives */}
          <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.5rem', lineHeight: 1 }}>
            ✦
          </div>

          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>⬆️</div>

          <div style={{
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em',
            color: '#92400e', textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>
            {charName}
          </div>

          <h2 style={{
            fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Cinzel Decorative, Cinzel, serif',
            background: 'linear-gradient(90deg, #fbbf24, #f97316, #fbbf24)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'lvlup-shimmer 2s linear infinite',
            marginBottom: '0.25rem',
          }}>
            NIVEAU {newLevel}
          </h2>

          <p style={{ color: '#fcd34d', fontSize: '1rem', marginBottom: '1.5rem', fontFamily: 'Cinzel, serif' }}>
            Montée de niveau !
          </p>

          <button
            onClick={onDismiss}
            style={{
              background: 'linear-gradient(135deg, #b45309, #d97706)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.75rem 2rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.05em',
            }}
          >
            ✦ Effectuer la montée de niveau
          </button>

          <p style={{ color: '#78350f', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            (cliquer n'importe où pour fermer)
          </p>
        </div>
      </div>
    </>
  );
}
