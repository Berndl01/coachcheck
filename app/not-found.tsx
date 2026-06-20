import Link from 'next/link';
import { ThinkingHead } from '@/components/thinking-head';
import { getT } from '@/lib/i18n/server';

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="min-h-screen bg-bone flex items-center justify-center px-4 py-12">
      <div className="max-w-xl text-center">
        <div className="flex justify-center mb-10">
          <ThinkingHead size={180} />
        </div>

        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          {t('notFound.kicker')}
        </div>

        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-light tracking-[-0.02em] leading-[1.1] mb-5">
          {t('notFound.h1a')}{' '}
          <em className="font-editorial text-gold">{t('notFound.h1emph')}</em> {t('notFound.h1b')}
        </h1>

        <p className="font-editorial italic text-xl text-muted leading-[1.5] max-w-[50ch] mx-auto mb-8">
          {t('notFound.lead')}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
          >
            {t('notFound.home')} <span className="font-mono">→</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 border border-ink text-ink rounded-full font-semibold hover:bg-ink hover:text-bone transition"
          >
            {t('notFound.dashboard')}
          </Link>
        </div>
      </div>
    </main>
  );
}
