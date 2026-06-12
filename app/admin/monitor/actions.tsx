'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Reset-Button im Admin-Monitor (P2 #14): gibt einen steckengebliebenen
 * Report-Lock frei, sodass eine erneute Generierung starten kann.
 */
export function ResetJobButton({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function reset() {
    setState('loading');
    try {
      const res = await fetch('/api/admin/report-retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, action: 'reset-job' }),
      });
      if (!res.ok) throw new Error('failed');
      setState('done');
      router.refresh();
    } catch {
      setState('error');
    }
  }

  return (
    <button
      onClick={reset}
      disabled={state === 'loading' || state === 'done'}
      className="font-mono text-[0.6rem] uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border border-gold/40 text-gold-deep hover:bg-gold hover:text-ink transition disabled:opacity-40"
    >
      {state === 'loading' ? '…' : state === 'done' ? 'zurückgesetzt' : state === 'error' ? 'Fehler' : 'Lock zurücksetzen'}
    </button>
  );
}
