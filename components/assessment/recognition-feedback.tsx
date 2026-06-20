'use client';

import { useState } from 'react';
import { useT } from '@/components/i18n/locale-provider';

type Props = {
  assessmentId: string;
  initialRecognition: number | null;
  initialHelpful: string | null;
};

export function RecognitionFeedback({ assessmentId, initialRecognition, initialHelpful }: Props) {
  const t = useT();
  // Schlüssel bleiben stabil (DB), nur Labels lokalisiert.
  const SECTIONS: { key: string; label: string }[] = [
    { key: 'profil', label: t('recognitionFeedback.sectionProfil') },
    { key: 'signatur', label: t('recognitionFeedback.sectionSignatur') },
    { key: 'staerken', label: t('recognitionFeedback.sectionStaerken') },
    { key: 'druck', label: t('recognitionFeedback.sectionDruck') },
    { key: 'naechster_schritt', label: t('recognitionFeedback.sectionNaechster') },
  ];

  const [recognition, setRecognition] = useState<number | null>(initialRecognition);
  const [helpful, setHelpful] = useState<string | null>(initialHelpful);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(initialRecognition !== null);
  const [editing, setEditing] = useState(initialRecognition === null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (recognition === null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recognition, most_helpful: helpful }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t('recognitionFeedback.errGeneric'));
      setDone(true);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('recognitionFeedback.errSave'));
    } finally {
      setSaving(false);
    }
  }

  if (done && !editing) {
    return (
      <div className="bg-bone-soft border border-bone-line rounded-md p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-gold-deep mb-1">
            {t('recognitionFeedback.doneKicker')}
          </div>
          <p className="text-sm text-muted">
            {t('recognitionFeedback.recognitionLabel')} <strong className="text-ink">{recognition}/10</strong>
            {helpful && (
              <> · {t('recognitionFeedback.helpfulPrefix')} {SECTIONS.find((s) => s.key === helpful)?.label}</>
            )}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-3 py-2 border border-bone-line rounded-full hover:bg-bone transition"
        >
          {t('recognitionFeedback.change')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bone-soft border border-bone-line rounded-md p-6 md:p-8">
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold-deep mb-2">
        {t('recognitionFeedback.kicker')}
      </div>
      <h3 className="font-display text-xl tracking-[-0.01em] mb-1">
        {t('recognitionFeedback.h3')}
      </h3>
      <p className="text-sm text-muted mb-5">{t('recognitionFeedback.scale')}</p>

      <div className="flex flex-wrap gap-1.5 mb-7">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            onClick={() => setRecognition(n)}
            aria-pressed={recognition === n}
            className={`w-10 h-10 rounded-md font-mono text-sm transition ${
              recognition === n
                ? 'bg-ink text-bone'
                : 'bg-bone border border-bone-line text-ink hover:border-gold'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted mb-2">
        {t('recognitionFeedback.helpfulQ')} <span className="normal-case tracking-normal">{t('recognitionFeedback.optional')}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-7">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setHelpful(helpful === s.key ? null : s.key)}
            aria-pressed={helpful === s.key}
            className={`px-3 py-1.5 rounded-full font-mono text-[0.65rem] uppercase tracking-[0.1em] transition ${
              helpful === s.key
                ? 'bg-gold text-ink'
                : 'bg-bone border border-bone-line text-ink hover:border-gold'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button
        onClick={submit}
        disabled={recognition === null || saving}
        className="px-5 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {saving ? t('recognitionFeedback.submitting') : t('recognitionFeedback.submit')}
      </button>
    </div>
  );
}
