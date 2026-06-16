'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ItemRenderer, type Item, type AnswerValue } from './item-renderer';
import { AssessmentIntro } from './assessment-intro';

type Props = {
  assessmentId: string;
  items: Item[];
  existingAnswers: Record<number, AnswerValue>;
  startIndex: number;
  productName?: string | null;
};

export function AssessmentRunner({
  assessmentId,
  items,
  existingAnswers,
  startIndex,
  productName,
}: Props) {
  const router = useRouter();
  // Intro-Screen vor dem Fragebogen: erklärt Dauer, Themen und Ablauf, damit
  // man weiß, was kommt. Wird übersprungen, sobald gestartet wurde.
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(startIndex);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(existingAnswers);
  const [pending, setPending] = useState<AnswerValue | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.length;
  const current = items[index];
  const isLast = index === total - 1;
  const progressPct = Math.round(((index + 1) / total) * 100);

  // pending reset when item changes
  useEffect(() => {
    setPending(answers[current?.id]);
    setError(null);
  }, [index, current?.id, answers]);

  /**
   * Antwort serverseitig speichern. Der Runner schreibt NICHT mehr direkt in
   * Supabase — Format-Validierung, Tier-Zugehörigkeit und Fortschritt laufen
   * über die API-Route. Der Client setzt insbesondere NIE status='completed'.
   */
  async function persistAnswer(itemId: number, value: AnswerValue, nextIndex: number) {
    const res = await fetch(`/api/assessment/${assessmentId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: itemId,
        value_numeric: value.value_numeric ?? null,
        value_choice: value.value_choice ?? null,
        value_position: value.value_position ?? null,
        current_item_index: nextIndex,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Antwort konnte nicht gespeichert werden');
    }
  }

  async function handleNext() {
    if (!pending || !current) return;
    setSaving(true);
    setError(null);
    try {
      // beim letzten Item bleibt der Resume-Index auf dem letzten Item stehen,
      // sonst rückt er eins weiter.
      const nextIndex = isLast ? index : index + 1;
      await persistAnswer(current.id, pending, nextIndex);
      const newAnswers = { ...answers, [current.id]: pending };
      setAnswers(newAnswers);

      if (isLast) {
        // Abschluss AUSSCHLIESSLICH serverseitig. Schlägt /finalize fehl,
        // bleibt das Assessment 'in_progress' und wir navigieren NICHT weiter.
        setFinishing(true);
        const res = await fetch(`/api/assessment/${assessmentId}/finalize`, { method: 'POST' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.missingItemIds && Array.isArray(data.missingItemIds) && data.expected) {
            throw new Error(
              `Es fehlen noch ${data.expected - (data.submitted ?? 0)} von ${data.expected} Antworten. ` +
              'Bitte beantworte alle Fragen, um die Auswertung abzuschließen.'
            );
          }
          throw new Error(data.error ?? 'Finalisierung fehlgeschlagen');
        }
        router.push(`/assessment/${assessmentId}/result`);
        router.refresh();
      } else {
        setIndex(index + 1);
      }
    } catch (e: any) {
      setFinishing(false);
      setError(e.message ?? 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  function handlePrev() {
    if (index > 0) setIndex(index - 1);
  }

  if (!current) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted">Keine Items verfügbar.</p>
      </div>
    );
  }

  // Vor dem Start: Intro-Screen mit Dauer, Themen und Ablauf.
  if (!started) {
    return (
      <AssessmentIntro
        items={items}
        productName={productName}
        resuming={startIndex > 0 || Object.keys(existingAnswers).length > 0}
        onStart={() => setStarted(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-ink text-bone flex flex-col">
      {/* Progress header */}
      <div className="sticky top-0 z-40 bg-ink/90 backdrop-blur border-b border-ink-line">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center gap-6">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-dark whitespace-nowrap">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <div className="flex-grow h-0.5 bg-ink-line rounded overflow-hidden">
            <div
              className="h-full bg-gold transition-[width] duration-500"
              style={{ width: `${progressPct}%`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-gold whitespace-nowrap">
            {progressPct} %
          </span>
        </div>
      </div>

      {/* Item body */}
      <div className="flex-grow max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16 w-full">
        <ItemRenderer
          item={current}
          currentValue={pending}
          onAnswer={(v) => setPending(v)}
        />

        {error && <div className="mt-6 text-red-400 font-mono text-sm">{error}</div>}
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-ink border-t border-ink-line">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={index === 0 || saving}
            className="font-mono text-xs uppercase tracking-[0.12em] px-4 py-3 rounded-full border border-ink-line text-bone-soft hover:bg-bone hover:text-ink hover:border-bone disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            ← Zurück
          </button>

          <button
            onClick={handleNext}
            disabled={!pending || saving || finishing}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {finishing ? 'Wertet aus …' : saving ? 'Speichert …' : isLast ? 'Abschließen' : 'Weiter'}
            {!saving && !finishing && <span className="font-mono">→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
