'use client';

import { useState } from 'react';
import { useT } from '@/components/i18n/locale-provider';

type Props = {
  assessmentId: string;
  existingReportUrl?: string | null;
  productTier: number;
};

export function ReportGenerateButton({ assessmentId, existingReportUrl, productTier }: Props) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [url, setUrl] = useState<string | null>(existingReportUrl ?? null);

  function friendlyReportError(message: string) {
    const m = message.toLowerCase();
    if (m.includes('anthropic') || m.includes('ai generation') || m.includes('api_key')) {
      return t('reportGenerate.errService');
    }
    if (m.includes('pdf render') || m.includes('font')) {
      return t('reportGenerate.errPdf');
    }
    if (m.includes('upload') || m.includes('storage') || m.includes('bucket')) {
      return t('reportGenerate.errUpload');
    }
    return message || t('reportGenerate.errFallback');
  }

  async function pollUntilReady(): Promise<void> {
    for (let i = 0; i < 60; i++) { // max ~3 Min
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/assessment/${assessmentId}/report-status`);
        const data = await res.json();
        if (data.status === 'ready' && data.signedUrl) { setUrl(data.signedUrl); return; }
        if (data.status === 'failed') {
          if (data.retryable) { setRetrying(true); await generate(2); return; }
          throw new Error(friendlyReportError(data.error ?? t('reportGenerate.errGeneric')));
        }
      } catch (e) {
        throw e instanceof Error ? e : new Error(t('reportGenerate.errStatus'));
      }
    }
    throw new Error(t('reportGenerate.errSlow'));
  }

  async function generate(retriesLeft = 2) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/report`, { method: 'POST' });
      const data = await res.json();
      if (res.status === 409 && data.inProgress) {
        await pollUntilReady();
        return;
      }
      if (res.status === 503 && data.retryable && retriesLeft > 0) {
        setRetrying(true);
        await new Promise((r) => setTimeout(r, 4000));
        await generate(retriesLeft - 1);
        return;
      }
      if (!res.ok) throw new Error(friendlyReportError(data.error ?? t('reportGenerate.errGeneric')));
      setRetrying(false);
      setUrl(data.signedUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('reportGenerate.errGeneric'));
    } finally {
      setLoading(false);
    }
  }

  if (url) {
    return (
      <div className="flex flex-wrap gap-3 items-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-4 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition"
        >
          {t('reportGenerate.download')} <span className="font-mono">↓</span>
        </a>
        <button
          onClick={() => { setUrl(null); generate(); }}
          disabled={loading}
          className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink disabled:opacity-30"
        >
          {loading ? t('reportGenerate.refreshing') : t('reportGenerate.refreshLink')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => generate()}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-50 disabled:cursor-wait w-fit"
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 rounded-full bg-gold animate-pulse" />
            {retrying ? t('reportGenerate.retrying') : t('reportGenerate.creating')}
          </>
        ) : (
          <>{t('reportGenerate.generate')} <span className="font-mono">→</span></>
        )}
      </button>
      {loading && (
        <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted max-w-[48ch]">
          {t('reportGenerate.loadingDesc')}
        </div>
      )}
      {error && (
        <div className="text-red-600 text-sm font-mono">
          {error}
        </div>
      )}
      <div className="grid gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted mt-2 max-w-[62ch]">
        <div>
          {t('reportGenerate.startHint')}
        </div>
        <div>
          {productTier === 1 ? t('reportGenerate.tier1') :
           productTier === 2 ? t('reportGenerate.tier2') :
           productTier === 3 ? t('reportGenerate.tier3') :
           t('reportGenerate.tier4')}
        </div>
      </div>
    </div>
  );
}
