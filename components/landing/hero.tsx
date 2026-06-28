import Link from 'next/link';
import { getT } from '@/lib/i18n/server';

export async function Hero() {
  const t = await getT();
  return (
    <section className="hero relative max-w-[1440px] mx-auto px-4 md:px-8 pt-8 md:pt-16 pb-16 md:pb-24 overflow-hidden">
      <div className="tech-grid absolute inset-0 pointer-events-none" />

      <div className="relative z-10">
        {/* Meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs uppercase tracking-[0.14em] text-muted border-b border-bone-line pb-4 mb-10 md:mb-14">
          <span className="text-ink font-medium tracking-[0.08em]">
            <em className="font-editorial normal-case tracking-normal text-muted mr-1">{t('hero.forSports')}</em>
            {t('hero.sportsList')}
          </span>
          <span className="inline-flex items-center gap-2 text-gold-deep font-semibold tracking-[0.18em]">
            <span className="live-dot" /> {t('hero.liveBeta')}
          </span>
        </div>

        {/* Hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-end">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ink px-3 py-1.5 border border-ink rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              {t('hero.badge')}
            </span>

            <h1 className="font-display font-normal leading-[0.96] tracking-[-0.03em] text-[clamp(2.6rem,7.5vw,6.2rem)]">
              <span className="tracking-[-0.045em]">{t('hero.h1a')}</span><br />
              {t('hero.h1b')}<br />
              <em className="font-editorial relative inline-block">
                {t('hero.h1c')}
                <span
                  className="absolute left-0 right-0 h-[0.1em] bg-gold -z-10"
                  style={{ bottom: '0.08em', transform: 'skew(-2deg)' }}
                />
              </em>
            </h1>

            <p className="mt-7 max-w-[38ch] text-[clamp(1rem,1.4vw,1.2rem)] leading-[1.45] text-muted">
              {t('hero.lead1')} {t('hero.lead2')}{' '}
              <em className="font-editorial text-ink text-[1.08em]">{t('hero.leadEmph')}</em>{' '}
              {t('hero.lead3')}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-9">
              <Link
                href="/checkout/schnelltest"
                className="btn-gold-hover inline-flex items-center gap-2 px-6 py-4 bg-ink text-bone rounded-full font-semibold text-[0.95rem] hover:bg-gold hover:text-ink hover:-translate-y-0.5 transition-all"
              >
                {t('hero.ctaPrimary')} <span className="font-mono">→</span>
              </Link>
              <Link
                href="#products"
                className="inline-flex items-center gap-2 px-6 py-4 border border-ink text-ink rounded-full font-semibold text-[0.95rem] hover:bg-ink hover:text-bone transition"
              >
                {t('hero.ctaSecondary')}
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7 font-mono text-xs uppercase tracking-[0.1em] text-muted">
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gold rounded-full" />
                <b className="font-display font-medium text-ink text-[1.1em] tracking-[-0.02em]">103</b>&nbsp;{t('hero.statItems')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gold rounded-full" />
                <b className="font-display font-medium text-ink text-[1.1em] tracking-[-0.02em]">12</b>&nbsp;{t('hero.statArchetypes')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gold rounded-full" />
                <b className="font-display font-medium text-ink text-[1.1em] tracking-[-0.02em]">7</b>&nbsp;{t('hero.statModules')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gold rounded-full" />
                <b className="font-display font-medium text-ink text-[1.1em] tracking-[-0.02em]">7–18</b>&nbsp;{t('hero.statPages')}
              </span>
            </div>
          </div>

          {/* Hero card */}
          <aside className="relative bg-ink text-bone p-8 rounded border border-ink-line overflow-hidden shadow-[0_30px_80px_-20px_rgba(20,63,58,0.25)]">
            <div
              className="absolute top-0 right-0 bottom-0 w-1/2 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0, transparent 8px, rgba(179,142,69,0.04) 8px, rgba(179,142,69,0.04) 9px)',
              }}
            />
            <div className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold mb-4">
              {t('hero.cardKicker')}
            </div>
            <div className="font-display font-light text-[clamp(1.7rem,3vw,2.3rem)] leading-[1.08] tracking-[-0.025em] text-bone">
              {t('hero.cardProfileTitle')}
            </div>
            <div className="font-editorial text-base text-bone-soft mt-3 pt-4 border-t border-ink-line leading-[1.4]">
              {t('hero.cardQuote')}
            </div>
            <div className="flex flex-col gap-3.5 mt-6 pt-6 border-t border-ink-line">
              {[
                [t('hero.cardClarity'), t('hero.cardClarityVal'), 0.82],
                [t('hero.cardTone'), t('hero.cardToneVal'), 0.58],
                [t('hero.cardCloseness'), t('hero.cardClosenessVal'), 0.4],
              ].map(([lbl, val, frac]) => (
                <div key={lbl as string}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-muted-dark">{lbl}</span>
                    <span className="font-editorial italic text-[0.92rem] text-bone">{val}</span>
                  </div>
                  <div className="h-[3px] w-full bg-ink-line rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${(frac as number) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
