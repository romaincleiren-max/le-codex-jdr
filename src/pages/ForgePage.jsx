// ============================================================================
// FORGE PAGE — Intégration iframe de la Forge du Héros
// ============================================================================

import React, { useEffect, useRef } from 'react';

export default function ForgePage({ onNavigate }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.data === 'go:initiative') {
        onNavigate('initiative');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onNavigate]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      top: 0,
      zIndex: 10,
      background: '#0D0A05',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <iframe
        ref={iframeRef}
        src="/forge.html"
        title="Forge du Héros"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          display: 'block',
        }}
        allowFullScreen
      />
    </div>
  );
}
