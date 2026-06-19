'use client';

import { useState } from 'react';

type Props = {
  assessmentId: string;
  initialToken: string | null;
  initialEnabled: boolean;
};

export function ShareCardButton({ assessmentId, initialToken, initialEnabled }: Props) {
  const initialUrl =
    initialEnabled && initialToken && typeof window !== 'undefined'
      ? `${window.location.origin}/karte/${initialToken}`
      : null;
  const [enabled, setEnabled] = useState(initialEnabled && Boolean(initialToken));
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enable() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/share`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Fehler');
      setUrl(data.url);
      setEnabled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Teilen fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/share`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Fehler');
      }
      setEnabled(false);
      setUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deaktivieren fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard nicht verfügbar — Nutzer kann den Link manuell markieren */
    }
  }

  if (!enabled || !url) {
    return (
      <div>
        <button
          onClick={enable}
          disabled={loading}
          className="px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition disabled:opacity-60"
        >
          {loading ? 'Wird erstellt …' : 'Profilkarte teilen'}
        </button>
        <p className="text-bone-soft text-[0.72rem] leading-[1.5] mt-3 max-w-[46ch]">
          Erstellt einen öffentlichen Link zu deiner Profilkarte (ohne deine persönlichen Daten). Du kannst ihn jederzeit wieder deaktivieren.
        </p>
        {error && <p className="text-gold-light text-xs mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-[220px] px-4 py-2.5 rounded-full bg-bone text-ink text-sm font-mono"
        />
        <button onClick={copy} className="px-5 py-2.5 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition text-sm">
          {copied ? 'Kopiert ✓' : 'Link kopieren'}
        </button>
      </div>
      <button onClick={disable} disabled={loading} className="mt-3 text-bone-soft text-xs underline hover:text-bone transition disabled:opacity-60">
        {loading ? '…' : 'Teilen deaktivieren'}
      </button>
      {error && <p className="text-gold-light text-xs mt-2">{error}</p>}
    </div>
  );
}
