'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ItemRenderer, type Item, type AnswerValue } from '@/components/assessment/item-renderer';
import { HumatrixLogo } from '@/components/logo';

type Props = {
  token: string;
  invitationId: string;
  items: Item[];
  existingAnswers: Record<number, AnswerValue>;
  trainerName: string;
  sport: string;
  club: string;
};

export function TeamcheckRunner({
  token, invitationId, items, existingAnswers, trainerName, sport, club,
}: Props) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(existingAnswers);
  const [pending, setPending] = useState<AnswerValue | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.length;
  const current = items[index];
  const isLast = index === total - 1;
  const progressPct = Math.round(((index + 1) / total) * 100);
  const firstName = trainerName.split(' ')[0];

  useEffect(() => {
    if (started && current) {
      setPending(answers[current.id]);
      setError(null);
    }
  }, [index, started, current, answers]);

  useEffect(() => {
    if (started) {
      const supabase = createClient();
      supabase.from('invitations').update({ status: 'opened' }).eq('id', invitationId).then(() => {});
    }
  }, [started, invitationId]);

  async function persistAnswer(itemId: number, value: AnswerValue) {
    const supabase = createClient();
    const { error: e1 } = await supabase
      .from('invitation_answers')
      .upsert({
        invitation_id: invitationId,
        item_id: itemId,
        value_numeric: value.value_numeric ?? null,
        value_choice: value.value_choice ?? null,
        value_position: value.value_position ?? null,
      }, { onConflict: 'invitation_id,item_id' });
    if (e1) throw e1;
  }

  async function handleNext() {
    if (!pending || !current) return;
    setSaving(true);
    setError(null);
    try {
      await persistAnswer(current.id, pending);
      setAnswers({ ...answers, [current.id]: pending });
      if (isLast) {
        const supabase = createClient();
        await supabase
          .from('invitations')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', invitationId);
        setFinished(true);
      } else {
        setIndex(index + 1);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  function handlePrev() {
    if (index > 0) setIndex(index - 1);
  }

  // INTRO
  if (!started) {
    return (
      <main className="min-h-screen bg-bone flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl">
          <HumatrixLogo />
          <div className="mt-12">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
              TeamCheck · Anonyme Spielerumfrage
            </div>
            <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] tracking-[-0.03em] leading-[1.05] mb-6">
              Wie geht es dir wirklich <em className="font-editorial">in diesem Team?</em>
            </h1>
            <p className="font-editorial italic text-xl text-muted leading-[1.5] mb-6">
              {firstName} möchte verstehen, wie das Team {club ? `bei ${club} ` : ''}wirklich tickt — wie ihr Klima, Druck, Vertrauen und Coaching erlebt.
              Diese Umfrage hilft dabei.
            </p>

            <div className="grid gap-4 mb-8">
              <div className="flex gap-4 items-start">
                <span className="font-mono text-xs text-gold mt-1 shrink-0">01</span>
                <div>
                  <div className="font-medium">100% anonym</div>
                  <div className="text-sm text-muted">Niemand sieht je, wer was geantwortet hat. Auch wir nicht. {firstName} bekommt nur aggregierte Werte aus mindestens 5 Spielern.</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-mono text-xs text-gold mt-1 shrink-0">02</span>
                <div>
                  <div className="font-medium">Ehrlich, nicht freundlich</div>
                  <div className="text-sm text-muted">Es bringt nichts wenn du höflich antwortest. Echte Verbesserung beginnt mit echter Wahrheit.</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-mono text-xs text-gold mt-1 shrink-0">03</span>
                <div>
                  <div className="font-medium">~5 Minuten</div>
                  <div className="text-sm text-muted">Kurz und knackig. Du kannst auch pausieren und später weitermachen.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
            >
              Umfrage starten <span className="font-mono">→</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // FINISHED
  if (finished) {
    return (
      <main className="min-h-screen bg-petrol text-bone flex items-center justify-center px-4 py-12">
        <div className="max-w-xl text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-6">
            ✓ Eingegangen · Anonym
          </div>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] tracking-[-0.03em] leading-[1.05] mb-5">
            Danke. Wirklich.
          </h1>
          <p className="font-editorial italic text-xl text-bone-soft leading-[1.5]">
            Deine Stimme zählt. Sobald genug Spieler geantwortet haben, fließt sie aggregiert in den Team-Report ein — niemand wird je deine Antworten zuordnen können.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-gold-light mt-10">
            Du kannst diese Seite jetzt schließen.
          </p>
        </div>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bone">
        <p className="text-muted">Keine Items verfügbar.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-bone flex flex-col">
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

      <div className="flex-grow max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16 w-full">
        <ItemRenderer
          item={current}
          currentValue={pending}
          onAnswer={(v) => setPending(v)}
        />
        {error && <div className="mt-6 text-red-400 font-mono text-sm">{error}</div>}
      </div>

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
            disabled={!pending || saving}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Speichert …' : isLast ? 'Abschließen' : 'Weiter'}
            {!saving && <span className="font-mono">→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
