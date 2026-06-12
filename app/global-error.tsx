'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  // Global error can't use custom fonts (layout is broken), so plain inline styles
  return (
    <html lang="de">
      <body
        style={{
          fontFamily: '-apple-system, Segoe UI, sans-serif',
          background: '#FAFAF8',
          color: '#1B1C1E',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 560, padding: '32px 24px', textAlign: 'center' }}>
          {/* Inline SVG thinking head */}
          <div style={{ marginBottom: 32 }}>
            <svg
              width="140"
              height="150"
              viewBox="0 0 400 440"
              style={{ display: 'inline-block' }}
            >
              <defs>
                <linearGradient id="ge-pulse" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#33343A">
                    <animate attributeName="stop-color" values="#33343A; #B38E45; #33343A" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#B38E45">
                    <animate attributeName="stop-color" values="#B38E45; #143F3A; #B38E45" dur="3s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
              </defs>
              <g stroke="url(#ge-pulse)" strokeWidth="3" fill="none">
                <line x1="140" y1="40" x2="260" y2="40" />
                <line x1="140" y1="40" x2="60" y2="130" />
                <line x1="260" y1="40" x2="340" y2="130" />
                <line x1="60" y1="130" x2="60" y2="270" />
                <line x1="340" y1="130" x2="340" y2="270" />
                <line x1="60" y1="270" x2="120" y2="360" />
                <line x1="340" y1="270" x2="280" y2="360" />
                <line x1="120" y1="360" x2="200" y2="420" />
                <line x1="280" y1="360" x2="200" y2="420" />
                <line x1="150" y1="140" x2="250" y2="140" />
                <line x1="170" y1="205" x2="230" y2="205" />
                <line x1="170" y1="205" x2="200" y2="270" />
                <line x1="230" y1="205" x2="200" y2="270" />
                <line x1="200" y1="340" x2="200" y2="420" />
              </g>
              <g fill="#1B1C1E">
                {[[140, 40], [260, 40], [60, 130], [340, 130], [150, 140], [250, 140], [170, 205], [230, 205], [60, 270], [340, 270], [200, 270], [200, 340], [120, 360], [280, 360], [200, 420]].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="7" />
                ))}
              </g>
            </svg>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, color: '#8A6A2E', textTransform: 'uppercase', marginBottom: 14 }}>
            Unerwarteter Fehler
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.5px', lineHeight: 1.15, margin: '0 0 14px' }}>
            Sorry — unser Kopf arbeitet gerade an der Lösung.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: '#767471', marginBottom: 28 }}>
            Wir haben den Fehler erkannt und sind dran. Bitte hab einen Moment Geduld.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#1B1C1E',
              color: '#FAFAF8',
              border: 'none',
              padding: '14px 28px',
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Nochmal versuchen →
          </button>
          {error.digest && (
            <div style={{ marginTop: 28, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, color: '#9A9793', textTransform: 'uppercase' }}>
              Referenz: {error.digest}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
