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
};

/**
 * Rephrase items from "Ich..." to "Mein Trainer..." perspective.
 * Simple heuristics — most Humatrix items start with "Ich" or use "ich" as subject.
 */
function rephraseForFremdbild(text: string, trainerName: string): string {
  const firstName = trainerName.split(' ')[0];
  return text
    .replace(/^Ich (kann|habe|werde|verliere|treffe|hole|schaffe|wirke|mache|formuliere|passe|erkenne|kommuniziere|motiviere|weiß|bleibe|gehe)/i,
      `${firstName} $1`)
    .replace(/^Ich /i, `${firstName} `)
    .replace(/^Mein /i, `${firstName}s `)
    .replace(/\bich\b/gi, firstName)
    .replace(/\bmir\b/gi, 'ihm/ihr')
    .replace(/\bmich\b/gi, 'ihn/sie')
    .replace(/\bmein\b/gi, 'sein/ihr')
    .replace(/\bmeine\b/gi, 'seine/ihre');
}

export function EinschaetzungRunner({
  token, invitationId, items, existingAnswers, trainerName, sport,
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

  // Mark as opened on start
  useEffect(() => {
    if (started) {
      const supabase = createClient();
      supabase
        .from('invitations')
        .update({ status: 'opened' })
        .eq('id', invitationId)
        .then(() => {});
    }
  }, [started, invitationId]);

  async function persistAnswer(itemId: number, value: AnswerValue) {
    const supabase = createClient();
    const payload = {
      invitation_id: invitationId,
      item_id: itemId,
      value_numeric: value.value_numeric ?? null,
      value_choice: value.value_choice ?? null,
      value_position: value.value_position ?? null,
    };
    // upsert
    const { error: e1 } = await supabase
      .from('invitation_answers')
      .upsert(payload, { onConflict: 'invitation_id,item_id' });
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
        // Finalize
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

  // INTRO SCREEN
  if (!started) {
    return (
      <main className="min-h-screen bg-bone flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl">
          <HumatrixLogo />
          <div className="mt-12">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
              360° Spiegel · Anonyme Einschätzung
            </div>
            <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] tracking-[-0.03em] leading-[1.05] mb-6">
              Wie erlebst du <em className="font-editorial">{firstName}</em> als Trainer{sport ? ` im ${sport}` : ''}?
            </h1>
            <p className="font-editorial italic text-xl text-muted leading-[1.5] mb-6">
              {firstName} möchte verstehen, wie das Team {firstName.split(' ')[0]} wirklich wahrnimmt — jenseits von Höflichkeit und Hierarchie.
              Deine ehrliche Einschätzung hilft dabei.
            </p>

            <div className="grid gap-4 mb-8">
              <div className="flex gap-4 items-start">
                <span className="font-mono text-xs text-gold mt-1 shrink-0">01</span>
                <div>
                  <div className="font-medium">100% anonym</div>
                  <div className="text-sm text-muted">{firstName} sieht nie, wer was geantwortet hat. Nur aggregierte Werte (ab 3 Antworten).</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-mono text-xs text-gold mt-1 shrink-0">02</span>
                <div>
                  <div className="font-medium">~10 Minuten</div>
                  <div className="text-sm text-muted">Einschätzungs-Skalen, Szenarien, Spannungsfelder. Du kannst pausieren.</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-mono text-xs text-gold mt-1 shrink-0">03</span>
                <div>
                  <div className="font-medium">Keine Daten von dir</div>
                  <div className="text-sm text-muted">Wir speichern keinen Namen, keine E-Mail. Nur die Einschätzung selbst.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
            >
              Einschätzung starten <span className="font-mono">→</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // FINISHED SCREEN
  if (finished) {
    return (
      <main className="min-h-screen bg-petrol text-bone flex items-center justify-center px-4 py-12">
        <div className="max-w-xl text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-6">
            ✓ Eingegangen
          </div>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] tracking-[-0.03em] leading-[1.05] mb-5">
            Danke. Wirklich.
          </h1>
          <p className="font-editorial italic text-xl text-bone-soft leading-[1.5]">
            Deine Einschätzung ist anonym eingegangen. Sobald genug Stimmen aus dem Team da sind, fließen sie in {firstName}s Premium-Report ein.
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

  // RUNNER (reuses ItemRenderer)
  const rephrasedItem = {
    ...current,
    text_de: rephraseForFremdbild(current.text_de, trainerName),
  };

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
          item={rephrasedItem}
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
