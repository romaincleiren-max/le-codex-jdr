// ============================================================================
// BESTIAIRE PAGE — Iframe vers forge.html?bestiaire=1
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BestiaireRoutePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10,
      background: '#0D0A05',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        height: '52px',
        background: 'linear-gradient(90deg, #0f0a04 0%, #1a1208 50%, #0f0a04 100%)',
        borderBottom: '1px solid rgba(217,119,6,0.35)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
          opacity: 0.6,
        }} />

        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.9rem',
            background: 'rgba(30,20,8,0.8)',
            border: '1px solid rgba(217,119,6,0.4)',
            borderRadius: '0.6rem',
            color: '#fcd34d',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Cinzel, serif',
          }}>
          ← Retour
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <span style={{ fontSize: '1.1rem' }}>🐉</span>
          <span style={{
            fontFamily: 'Cinzel Decorative, Cinzel, serif',
            fontWeight: 900,
            fontSize: '0.95rem',
            background: 'linear-gradient(90deg, #fbbf24, #f97316, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.05em',
          }}>
            Bestiaire
          </span>
          <span style={{ fontSize: '1.1rem' }}>🐉</span>
        </div>

        <div style={{ width: '90px' }} />
      </div>

      <iframe
        src="/forge.html?bestiaire=1"
        title="Bestiaire"
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
        allowFullScreen
      />
    </div>
  );
}
