'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Recovery-Zustand der Ergebnis-Seite (P2 #12).
 *
 * Wird gezeigt, wenn ein Assessment zwar als abgeschlossen markiert ist, aber
 * Pflichtfelder (Scores/Archetyp/Signatur) fehlen — statt einer weißen oder
 * kaputten Seite. Bietet einen serverseitigen erneuten Finalize-Versuch.
 */
export function ResultRecovery({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retryFinalize() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/finalize`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.missingItemIds && data.expected) {
          throw new Error(
            `Es fehlen noch ${data.expected - (data.submitted ?? 0)} von ${data.expected} Antworten. ` +
            'Bitte beantworte zuerst alle Fragen.'
          );
        }
        throw new Error(data.error ?? 'Die Auswertung konnte nicht abgeschlossen werden.');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-20 md:py-28">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-5 flex items-center gap-3">
        <span className="w-10 h-px bg-gold" /> Auswertung unvollständig
      </div>
      <h1 className="font-display font-light text-[clamp(1.8rem,4.5vw,2.8rem)] leading-[1.08] tracking-[-0.03em] mb-4" style={{ fontVariationSettings: "'opsz' 144" }}>
        Fast geschafft.
      </h1>
      <p className="text-muted leading-[1.6] max-w-[52ch] mb-8">
        Deine Antworten sind gespeichert, aber die Auswertung wurde noch nicht vollständig
        berechnet. Das passiert manchmal, wenn der letzte Schritt unterbrochen wurde. Ein Klick
        schließt die Auswertung serverseitig ab.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={retryFinalize}
          disabled={loading}
          className="inline-flex items-center gap-2 px-7 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-50 disabled:cursor-wait"
        >
          {loading ? 'Wertet aus …' : 'Auswertung abschließen'}
          {!loading && <span className="font-mono">→</span>}
        </button>
        <Link href="/dashboard" className="font-mono text-xs uppercase tracking-[0.12em] text-muted hover:text-ink">
          Zum Dashboard
        </Link>
      </div>

      {error && <p className="mt-6 text-red-600 text-sm font-mono max-w-[52ch]">{error}</p>}
    </div>
  );
}
