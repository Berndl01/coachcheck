'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Kostenloser Wiederholungstest bei nicht interpretierbarer Antwortqualität.
 * Setzt die Session serverseitig zurück (Antworten gelöscht, Status zurück auf
 * in_progress) und schickt den Trainer zurück in den Fragebogen. Kein neuer Kauf.
 */
export function ResultRetake({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/retake`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? 'Wiederholung konnte nicht gestartet werden.');
        setBusy(false);
        return;
      }
      router.push(`/assessment/${assessmentId}`);
    } catch {
      setError('Wiederholung konnte nicht gestartet werden.');
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={start}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-60"
      >
        {busy ? 'Wird vorbereitet…' : 'Kostenlos wiederholen'} <span className="font-mono">→</span>
      </button>
      {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
    </div>
  );
}
