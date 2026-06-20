import Link from 'next/link';
import { getT } from '@/lib/i18n/server';

export async function FinalCta() {
  const t = await getT();
  return (
    <section id="final" className="bg-ink text-bone py-16 md:py-28 px-4 md:px-8 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(179, 142, 69, 0.12), transparent 50%)',
        }}
      />
      <div className="max-w-[1440px] mx-auto text-center relative z-10">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-gold mb-6">
          {t('finalCta.kicker')}
        </div>
        <h2 className="font-display font-light text-[clamp(2.6rem,7vw,5.6rem)] leading-[0.98] tracking-[-0.04em] max-w-[16ch] mx-auto mb-6">
          {t('finalCta.h2a')} <em className="font-editorial text-gold">{t('finalCta.h2emph')}</em> {t('finalCta.h2b')}<br />
          {t('finalCta.h2c')}
        </h2>
        <p className="font-editorial italic text-xl text-bone-soft max-w-[48ch] mx-auto mb-10">
          {t('finalCta.lead')}
        </p>
        <Link
          href="/#products"
          className="btn-gold-hover inline-flex items-center gap-2 px-8 py-5 bg-gold text-ink rounded-full font-semibold text-base hover:bg-bone hover:-translate-y-0.5 transition-all"
        >
          {t('finalCta.cta')} <span className="font-mono">→</span>
        </Link>
      </div>
    </section>
  );
}
