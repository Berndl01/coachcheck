import Link from 'next/link';
import { TopNav } from '@/components/top-nav';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function CheckoutSuccessPage() {
  const t = await getT();
  return (
    <>
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-6">
          {t('checkoutSuccess.kicker')}
        </div>
        <h1 className="font-display text-5xl tracking-[-0.03em] mb-4">
          {t('checkoutSuccess.title')}
        </h1>
        <p className="font-editorial text-xl text-muted italic mb-10 leading-relaxed">
          {t('checkoutSuccess.lead')}
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition">
          {t('checkoutSuccess.cta')} <span className="font-mono">→</span>
        </Link>
      </main>
    </>
  );
}
