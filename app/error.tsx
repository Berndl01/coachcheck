'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ThinkingHead } from '@/components/thinking-head';
import { useT } from '@/components/i18n/locale-provider';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error('[error-boundary]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-bone flex items-center justify-center px-4 py-12">
      <div className="max-w-xl text-center">
        <div className="flex justify-center mb-10">
          <ThinkingHead size={180} />
        </div>

        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          {t('errorPage.kicker')}
        </div>

        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-light tracking-[-0.02em] leading-[1.1] mb-5">
          {t('errorPage.h1a')}{' '}
          <em className="font-editorial text-gold">{t('errorPage.h1emph')}</em> {t('errorPage.h1b')}
        </h1>

        <p className="font-editorial italic text-xl text-muted leading-[1.5] max-w-[50ch] mx-auto mb-8">
          {t('errorPage.lead')}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
          >
            {t('errorPage.retry')} <span className="font-mono">→</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-ink text-ink rounded-full font-semibold hover:bg-ink hover:text-bone transition"
          >
            {t('errorPage.home')}
          </Link>
        </div>

        {error.digest && (
          <div className="mt-10 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted opacity-60">
            {t('errorPage.refLabel')} {error.digest}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-bone-line">
          <p className="text-sm text-muted">
            {t('errorPage.contact1')}{' '}
            <a href="mailto:office@humatrix.cc" className="text-gold hover:underline">
              office@humatrix.cc
            </a>
            {t('errorPage.contact2')}
          </p>
        </div>
      </div>
    </main>
  );
}
