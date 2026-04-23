'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'humatrix_cookie_ack_v1';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no acknowledgment stored
    try {
      const ack = localStorage.getItem(STORAGE_KEY);
      if (!ack) setVisible(true);
    } catch {
      // localStorage blocked → don't show
    }
  }, []);

  function acknowledge() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // nothing — we just hide
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[100]">
      <div className="bg-ink text-bone rounded-md shadow-2xl p-5 border border-gold/20">
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-gold mb-2">
          Cookies & Datenschutz
        </div>
        <p className="text-sm text-bone-soft leading-[1.5] mb-4">
          Wir setzen nur technisch notwendige Cookies ein (Login-Session, kein Tracking, keine Werbung).
          Details in unserer{' '}
          <Link href="/legal/datenschutz" className="text-gold hover:underline">
            Datenschutzerklärung
          </Link>.
        </p>
        <button
          onClick={acknowledge}
          className="inline-flex items-center gap-2 px-5 py-2 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition text-sm"
        >
          Verstanden <span className="font-mono">→</span>
        </button>
      </div>
    </div>
  );
}
