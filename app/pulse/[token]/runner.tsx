'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HumatrixLogo } from '@/components/logo';

type PulseItem = {
  id: number;
  code: string;
  dimension: string;
  text_de: string;
  reverse_scored: boolean;
};

type Props = {
  token: string;
  cycleId: string;
  cycleNumber: number;
  items: PulseItem[];
  existingResponses: Record<number, number>;
  seasonName: string;
};

export function PulseRunner({
  token, cycleId, cycleNumber, items, existingResponses, seasonName,
}: Props) {
  const [responses, setResponses] = useState<Record<number, number>>(existingResponses);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allAnswered = items.every((i) => responses[i.id] != null);

  function setValue(itemId: number, val: number) {
    setResponses({ ...responses, [itemId]: val });
  }

  async function submit() {
    if (!allAnswered) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const records = Object.entries(responses).map(([itemId, val]) => ({
        pulse_cycle_id: cycleId,
        pulse_item_id: parseInt(itemId, 10),
        value_numeric: val,
        respondent_token: token,
      }));
      const { error: e1 } = await supabase
        .from('pulse_responses')
        .upsert(records, { onConflict: 'pulse_cycle_id,pulse_item_id,respondent_token' });
      if (e1) throw e1;
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? 'Fehler');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-petrol text-bone flex items-center justify-center px-4 py-12">
        <div className="max-w-xl text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-6">
            ✓ Pulse #{cycleNumber} eingegangen · Anonym
          </div>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] tracking-[-0.03em] leading-[1.05] mb-5">
            Danke. Wirklich.
          </h1>
          <p className="font-editorial italic text-xl text-bone-soft leading-[1.5]">
            Bis zum nächsten Pulse-Check ist Ruhe — du bekommst dann automatisch wieder einen Link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bone py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <HumatrixLogo />

        <div className="mt-8 mb-8">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-2">
            Pulse-Check #{cycleNumber} · {seasonName}
          </div>
          <h1 className="font-display text-3xl md:text-4xl tracking-[-0.02em] leading-[1.1] mb-3">
            Wie war diese Phase <em className="font-editorial">für dich?</em>
          </h1>
          <p className="text-muted">
            8 schnelle Fragen, ~2 Minuten. Alles anonym aggregiert ab 5 Antworten.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {items.map((item, idx) => {
            const current = responses[item.id];
            return (
              <div key={item.id} className="bg-bone-soft p-5 rounded-md border border-bone-line">
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-gold-deep mb-2">
                  Frage {String(idx + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                </div>
                <p className="font-display text-lg tracking-[-0.01em] leading-[1.3] mb-4">
                  {item.text_de}
                </p>
                <div className="flex justify-between mb-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                  <span>{item.reverse_scored ? 'Trifft voll zu' : 'Trifft nicht zu'}</span>
                  <span>{item.reverse_scored ? 'Trifft nicht zu' : 'Trifft voll zu'}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const isActive = current === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setValue(item.id, n)}
                        className={`aspect-square flex items-center justify-center rounded-full border-2 font-display text-xl font-light transition-all ${
                          isActive
                            ? 'bg-gold border-gold text-ink scale-110'
                            : 'bg-bone border-bone-line text-muted hover:border-gold hover:text-gold'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {error && <div className="text-red-600 text-sm font-mono mb-4">{error}</div>}

        <button
          onClick={submit}
          disabled={!allAnswered || submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Wird gesendet …' : !allAnswered ? `Noch ${items.length - Object.keys(responses).length} offen` : 'Pulse-Check absenden'}
          {!submitting && allAnswered && <span className="font-mono">→</span>}
        </button>
      </div>
    </main>
  );
}
