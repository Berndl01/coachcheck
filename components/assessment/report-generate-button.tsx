'use client';

import { useState } from 'react';

type Props = {
  assessmentId: string;
  existingReportUrl?: string | null;
  productTier: number;
};

function friendlyReportError(message: string) {
  const m = message.toLowerCase();
  if (m.includes('anthropic') || m.includes('ai generation') || m.includes('api_key')) {
    return 'Der Reportdienst ist gerade nicht vollständig konfiguriert. Bitte versuche es in einem Moment erneut.';
  }
  if (m.includes('pdf render') || m.includes('font')) {
    return 'Das PDF konnte gerade nicht erzeugt werden. Bitte prüfe die PDF-Konfiguration und versuche es danach erneut.';
  }
  if (m.includes('upload') || m.includes('storage') || m.includes('bucket')) {
    return 'Das PDF wurde erzeugt, konnte aber nicht gespeichert werden. Bitte prüfe den Supabase Storage Bucket reports.';
  }
  return message || 'Der Report konnte gerade nicht erstellt werden.';
}

export function ReportGenerateButton({ assessmentId, existingReportUrl, productTier }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [url, setUrl] = useState<string | null>(existingReportUrl ?? null);

  async function pollUntilReady(): Promise<void> {
    for (let i = 0; i < 60; i++) { // max ~3 Min
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/assessment/${assessmentId}/report-status`);
        const data = await res.json();
        if (data.status === 'ready' && data.signedUrl) { setUrl(data.signedUrl); return; }
        if (data.status === 'failed') {
          if (data.retryable) { setRetrying(true); await generate(2); return; }
          throw new Error(friendlyReportError(data.error ?? 'Fehler'));
        }
      } catch (e) {
        throw e instanceof Error ? e : new Error('Fehler beim Abrufen des Report-Status');
      }
    }
    throw new Error('Der Report dauert ungewöhnlich lange. Bitte lade die Seite in einer Minute neu.');
  }

  async function generate(retriesLeft = 2) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/report`, { method: 'POST' });
      const data = await res.json();
      if (res.status === 409 && data.inProgress) {
        // Ein Lauf ist bereits aktiv (z. B. zweiter Tab/Reload) → pollen statt
        // einen zweiten teuren Lauf zu starten.
        await pollUntilReady();
        return;
      }
      // Dienst kurzzeitig nicht verfügbar → kurzer automatischer erneuter Versuch.
      if (res.status === 503 && data.retryable && retriesLeft > 0) {
        setRetrying(true);
        await new Promise((r) => setTimeout(r, 4000));
        await generate(retriesLeft - 1);
        return;
      }
      if (!res.ok) throw new Error(friendlyReportError(data.error ?? 'Fehler beim Erstellen'));
      setRetrying(false);
      setUrl(data.signedUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }

  if (url) {
    return (
      <div className="flex flex-wrap gap-3 items-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-4 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition"
        >
          Report herunterladen <span className="font-mono">↓</span>
        </a>
        <button
          onClick={() => { setUrl(null); generate(); }}
          disabled={loading}
          className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink disabled:opacity-30"
        >
          {loading ? 'Wird aktualisiert…' : 'Download-Link neu abrufen'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => generate()}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-50 disabled:cursor-wait w-fit"
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 rounded-full bg-gold animate-pulse" />
            {retrying ? 'Wird noch erstellt · einen Moment …' : 'Dein Report wird erstellt · 30-90 Sek'}
          </>
        ) : (
          <>Premium-Report jetzt generieren <span className="font-mono">→</span></>
        )}
      </button>
      {loading && (
        <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted max-w-[48ch]">
          CoachCheck wertet deine Antworten aus, erstellt deine personalisierten Interpretationen,
          rendert das PDF und schickt es dir per Mail. Bleib kurz dran.
        </div>
      )}
      {error && (
        <div className="text-red-600 text-sm font-mono">
          {error}
        </div>
      )}
      <div className="grid gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted mt-2 max-w-[62ch]">
        <div>
          Bitte erst starten, wenn du ungestört bist und den Kontext oben gespeichert hast. Die Erstellung kann je nach Paket 30-90 Sekunden dauern.
        </div>
        <div>
          {productTier === 1 ? 'ab 7 Seiten · Executive Summary + Axis-Profil + Stärken/Risiken' :
           productTier === 2 ? 'ab 12 Seiten · Alle 7 Module + Entwicklungsprogramm + Gesprächsleitfaden' :
           productTier === 3 ? 'ab 15 Seiten · Vollreport mit 360°-Diskrepanz-Analyse' :
           'ab 17 Seiten · Vollreport mit 360° + TeamCheck'}
        </div>
      </div>
    </div>
  );
}
