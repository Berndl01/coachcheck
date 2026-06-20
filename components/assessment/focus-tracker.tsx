'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/components/i18n/locale-provider';

type Props = {
  planId: string;
  assessmentId: string;
  title: string;
  action: string;
  targetDays: number;
  initialCount: number;
  initialTodayChecked: boolean;
  initialStreak: number;
};

/**
 * Aktionsbereich – Check-in-Schleife (Bestcase §12): aktiver Fokus mit Fortschritt
 * über die Ziel-Tage, Streak, Tages-Check-in und Abschluss.
 */
export function FocusTracker(props: Props) {
  const t = useT();
  const router = useRouter();
  const { planId, assessmentId, title, action, targetDays } = props;

  const [count, setCount] = useState(props.initialCount);
  const [todayChecked, setTodayChecked] = useState(props.initialTodayChecked);
  const [streak, setStreak] = useState(props.initialStreak);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reached = count >= targetDays;
  const dayUnit = (n: number) => (n === 1 ? t('focusTracker.dayOne') : t('focusTracker.dayMany'));

  async function checkIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/action/${planId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t('focusTracker.errGeneric'));
      setTodayChecked(true);
      setCount((c) => c + 1);
      setStreak((s) => s + 1);
      setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('focusTracker.errCheckin'));
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/action/${planId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t('focusTracker.errGeneric'));
      setTodayChecked(false);
      setCount((c) => Math.max(0, c - 1));
      setStreak((s) => Math.max(0, s - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('focusTracker.errUndo'));
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/action/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t('focusTracker.errGeneric'));
      setCompleted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('focusTracker.errComplete'));
    } finally {
      setCompleting(false);
    }
  }

  if (completed) {
    return (
      <div className="bg-bone text-ink rounded-md p-6 flex flex-col border-l-[4px] border-gold">
        <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold-deep mb-2">
          {t('focusTracker.completedKicker')}
        </div>
        <p className="font-display text-2xl tracking-[-0.01em] mb-1" style={{ fontVariationSettings: "'opsz' 144" }}>
          {t('focusTracker.completedTitle').replace('{count}', String(count)).replace('{unit}', dayUnit(count))}
        </p>
        <p className="text-muted text-sm mb-5 max-w-[48ch]">
          {t('focusTracker.completedText')}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/assessment/${assessmentId}/result`}
            className="px-5 py-2.5 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition text-sm"
          >
            {t('focusTracker.newFocus')}
          </Link>
          <button
            onClick={() => router.refresh()}
            className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted hover:text-ink transition"
          >
            {t('focusTracker.done')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ink text-bone rounded-md p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold-light">
          {t('focusTracker.focusLabel')}{title ? ` · ${title}` : ''}
        </div>
        {streak > 0 && (
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold-light whitespace-nowrap">
            🔥 {streak} {dayUnit(streak)}
          </div>
        )}
      </div>

      <p className="text-bone leading-relaxed mb-4 flex-grow">{action}</p>

      {/* Fortschritt */}
      <div className="flex items-center gap-1.5 mb-1">
        {Array.from({ length: targetDays }, (_, i) => (
          <span
            key={i}
            className={`h-2 flex-grow rounded-full ${i < count ? 'bg-gold' : 'bg-bone/15'}`}
          />
        ))}
      </div>
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-bone-soft/70 mb-4">
        {t('focusTracker.progressLine').replace('{count}', String(count)).replace('{target}', String(targetDays))}
      </div>

      {error && <p className="text-sm text-red-300 mb-3">{error}</p>}

      {/* Tages-Check-in */}
      {!todayChecked ? (
        <div className="space-y-2 mb-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('focusTracker.notePlaceholder')}
            maxLength={300}
            className="w-full bg-bone/5 border border-bone/15 rounded-md px-3 py-2 text-sm text-bone placeholder:text-bone-soft/40 focus:outline-none focus:border-gold/50"
          />
          <button
            onClick={checkIn}
            disabled={busy}
            className="w-full px-5 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition disabled:opacity-40"
          >
            {busy ? '…' : t('focusTracker.doneToday')}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-gold-light">
            {t('focusTracker.doneToday')}
          </span>
          <button
            onClick={undo}
            disabled={busy}
            className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-bone-soft/70 hover:text-bone transition disabled:opacity-40"
          >
            {busy ? '…' : t('focusTracker.undo')}
          </button>
        </div>
      )}

      {/* Abschluss + Ergebnislink */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-bone/10">
        <Link
          href={`/assessment/${assessmentId}/result`}
          className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-bone-soft/70 hover:text-bone transition"
        >
          {t('focusTracker.toResult')}
        </Link>
        <button
          onClick={complete}
          disabled={completing}
          className={`font-mono text-[0.62rem] uppercase tracking-[0.1em] px-4 py-2 rounded-full transition disabled:opacity-40 ${
            reached
              ? 'bg-gold text-ink hover:bg-bone'
              : 'border border-bone/30 text-bone-soft hover:bg-bone/10'
          }`}
        >
          {completing ? '…' : reached ? t('focusTracker.finishReached') : t('focusTracker.finish')}
        </button>
      </div>
    </div>
  );
}
