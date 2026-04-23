'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ItemRenderer, type Item, type AnswerValue } from './item-renderer';

type Props = {
  assessmentId: string;
  items: Item[];
  existingAnswers: Record<number, AnswerValue>;
  startIndex: number;
};

export function AssessmentRunner({
  assessmentId,
  items,
  existingAnswers,
  startIndex,
}: Props) {
  const router = useRouter();
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

  async function persistAnswer(itemId: number, value: AnswerValue) {
    const supabase = createClient();
    const payload = {
      assessment_id: assessmentId,
      item_id: itemId,
      value_numeric: value.value_numeric ?? null,
      value_choice: value.value_choice ?? null,
      value_position: value.value_position ?? null,
    };
    // upsert (unique on assessment_id + item_id)
    const { error } = await supabase
      .from('answers')
      .upsert(payload, { onConflict: 'assessment_id,item_id' });
    if (error) throw error;
  }

  async function updateProgress(newIndex: number) {
    const supabase = createClient();
    const pct = Math.round(((newIndex) / total) * 100);
    await supabase
      .from('assessments')
      .update({
        current_item_index: newIndex,
        progress_pct: pct,
        status: pct >= 100 ? 'completed' : 'in_progress',
        started_at: newIndex === 1 ? new Date().toISOString() : undefined,
      })
      .eq('id', assessmentId);
  }

  async function handleNext() {
    if (!pending || !current) return;
    setSaving(true);
    setError(null);
    try {
      await persistAnswer(current.id, pending);
      const newAnswers = { ...answers, [current.id]: pending };
      setAnswers(newAnswers);

      if (isLast) {
        await updateProgress(total);
        // Trigger scoring on server
        setFinishing(true);
        const res = await fetch(`/api/assessment/${assessmentId}/finalize`, { method: 'POST' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Finalisierung fehlgeschlagen');
        }
        router.push(`/assessment/${assessmentId}/result`);
        router.refresh();
      } else {
        await updateProgress(index + 1);
        setIndex(index + 1);
      }
    } catch (e: any) {
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
