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
    return 'Der KI-Reportdienst ist gerade nicht vollständig konfiguriert. Bitte prüfe ANTHROPIC_API_KEY und versuche es danach erneut.';
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
  const [url, setUrl] = useState<string | null>(existingReportUrl ?? null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/report`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(friendlyReportError(data.error ?? 'Fehler beim Erstellen'));
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
          {loading ? 'Wird neu erstellt…' : 'Neu generieren'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-50 disabled:cursor-wait w-fit"
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 rounded-full bg-gold animate-pulse" />
            KI erstellt deinen Report · 30-90 Sek
          </>
        ) : (
          <>Premium-Report jetzt generieren <span className="font-mono">→</span></>
        )}
      </button>
      {loading && (
        <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted max-w-[48ch]">
          Claude analysiert deine Antworten, formuliert personalisierte Interpretationen,
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
          {productTier === 1 ? '7 Seiten · Executive Summary + Axis-Profil + Stärken/Risiken' :
           productTier === 2 ? '11 Seiten · Alle 7 Module + 30-Tage-Plan + Gesprächsleitfaden' :
           '24 Seiten · Vollreport mit 360°-Diskrepanz-Analyse'}
        </div>
      </div>
    </div>
  );
}
