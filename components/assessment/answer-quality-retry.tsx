'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/components/i18n/locale-provider';

type Props = {
  assessmentId: string;
};

/**
 * Kostenloser Neuversuch bei nicht interpretierbarem Antwortmuster.
 * Setzt — über eine eng abgesicherte Route — das Assessment zurück und führt
 * den Trainer in Ruhe erneut durch den Fragebogen (gleicher, bereits bezahlter
 * Kauf). Kein zusätzliches Geld, keine neue Bestellung.
 */
export function AnswerQualityRetry({ assessmentId }: Props) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/retry`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || t('resultPage.qualityRetryError'));
        setLoading(false);
        return;
      }
      router.push(`/assessment/${assessmentId}`);
    } catch {
      setError(t('resultPage.qualityRetryError'));
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={retry}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-60"
      >
        {loading ? t('resultPage.qualityRetryLoading') : t('resultPage.qualityRetryCta')}
      </button>
      {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
    </div>
  );
}
