'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/components/i18n/locale-provider';

type Plan = { action: string; title: string } | null;

type Props = {
  assessmentId: string;
  title: string;     // kurze Überschrift (z. B. Archetyp-Name)
  lever: string;     // der vorgeschlagene nächste Schritt
  initialPlan: Plan;
};

/**
 * Aktionsbereich (§11/§12): macht aus dem nächsten Schritt einen 7-Tage-Fokus,
 * der auf dem Dashboard verfolgt wird. Zeigt entweder den aktiven Fokus oder
 * ein Angebot, den vorgeschlagenen Hebel zu übernehmen.
 */
export function ActionFocusCard({ assessmentId, title, lever, initialPlan }: Props) {
  const t = useT();
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setFocus() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, action: lever, source: 'signature_lever' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t('actionFocus.errGeneric'));
      setPlan({ action: lever, title });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('actionFocus.errSet'));
    } finally {
      setBusy(false);
    }
  }

  async function clearFocus() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/action`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t('actionFocus.errGeneric'));
      setPlan(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('actionFocus.errRemove'));
    } finally {
      setBusy(false);
    }
  }

  if (plan) {
    return (
      <div className="bg-ink text-bone rounded-md p-6 md:p-8 text-left">
        <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold-light mb-2">
          {t('actionFocus.activeKicker')}
        </div>
        <p className="text-bone leading-relaxed text-lg mb-5 max-w-[58ch]">{plan.action}</p>
        {error && <p className="text-sm text-red-300 mb-3">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition text-sm"
          >
            {t('actionFocus.track')}
          </Link>
          <button
            onClick={clearFocus}
            disabled={busy}
            className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-bone-soft/80 hover:text-bone transition disabled:opacity-40"
          >
            {busy ? '…' : t('actionFocus.remove')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bone-soft border border-bone-line rounded-md p-6 md:p-8 text-left">
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold-deep mb-2">
        {t('actionFocus.nextStepKicker')}
      </div>
      <p className="text-ink leading-relaxed text-lg mb-5 max-w-[58ch]">{lever}</p>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        onClick={setFocus}
        disabled={busy}
        className="px-5 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? t('actionFocus.setting') : t('actionFocus.set')}
      </button>
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted mt-4">
        {t('actionFocus.appearsHint')}
      </p>
    </div>
  );
}
