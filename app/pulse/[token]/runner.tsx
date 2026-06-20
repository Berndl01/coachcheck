'use client';

import { useState } from 'react';
import { HumatrixLogo } from '@/components/logo';
import { useT } from '@/components/i18n/locale-provider';

type PulseItem = {
  id: number;
  code: string;
  dimension: string;
  text_de: string;
  reverse_scored: boolean;
};

type Props = {
  token: string;
  cycleNumber: number;
  items: PulseItem[];
  existingResponses: Record<number, number>;
  seasonName: string;
};

export function PulseRunner({
  token, cycleNumber, items, existingResponses, seasonName,
}: Props) {
  const t = useT();
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
      const payload = Object.entries(responses).map(([itemId, val]) => ({
        pulse_item_id: parseInt(itemId, 10),
        value_numeric: val,
      }));
      const res = await fetch(`/api/pulse/${encodeURIComponent(token)}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ responses: payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? t('pulseRunner.errGeneric'));
      }
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? t('pulseRunner.errGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-petrol text-bone flex items-center justify-center px-4 py-12">
        <div className="max-w-xl text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-6">
            {t('pulseRunner.doneKicker').replace('{n}', String(cycleNumber))}
          </div>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] tracking-[-0.03em] leading-[1.05] mb-5">
            {t('pulseRunner.doneTitle')}
          </h1>
          <p className="font-editorial italic text-xl text-bone-soft leading-[1.5]">
            {t('pulseRunner.doneText')}
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
            {t('pulseRunner.headerKicker').replace('{n}', String(cycleNumber)).replace('{season}', seasonName)}
          </div>
          <h1 className="font-display text-3xl md:text-4xl tracking-[-0.02em] leading-[1.1] mb-3">
            {t('pulseRunner.headerH1a')} <em className="font-editorial">{t('pulseRunner.headerH1emph')}</em>
          </h1>
          <p className="text-muted">
            {t('pulseRunner.headerDesc')}
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
          {submitting ? t('pulseRunner.submitting') : !allAnswered ? t('pulseRunner.remaining').replace('{n}', String(items.length - Object.keys(responses).length)) : t('pulseRunner.submit')}
          {!submitting && allAnswered && <span className="font-mono">→</span>}
        </button>
      </div>
    </main>
  );
}
