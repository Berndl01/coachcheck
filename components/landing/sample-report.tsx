import Link from 'next/link';
import { getT } from '@/lib/i18n/server';

/**
 * Musterbericht-Teaser auf der Landingpage.
 * Stärkster Verkaufshebel: zeigt anonymisierte Auszüge aus einem echten
 * Report und verlinkt auf die vollständige /musterbericht-Seite.
 */
export async function SampleReport() {
  const t = await getT();
  const bullets = [t('sampleReport.b1'), t('sampleReport.b2'), t('sampleReport.b3'), t('sampleReport.b4')];

  return (
    <section className="bg-petrol text-bone py-16 md:py-28 px-4 md:px-8 relative overflow-hidden">
      <div
        className="absolute -top-[10%] -left-[8%] w-[480px] h-[480px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(179, 142, 69, 0.12), transparent 60%)' }}
      />
      <div className="max-w-[1440px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
        {/* Left: copy */}
        <div>
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-gold mb-6 flex items-center gap-3">
            <span className="w-10 h-px bg-gold" /> {t('sampleReport.kicker')}
          </div>
          <h2 className="font-display font-light text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] max-w-[16ch] mb-6">
            {t('sampleReport.h2a')} <em className="font-editorial">{t('sampleReport.h2emph')}</em>
          </h2>
          <p className="text-bone-soft text-[1.02rem] leading-[1.6] max-w-[46ch] mb-8 opacity-90">
            {t('sampleReport.lead')}
          </p>
          <ul className="space-y-3 mb-10">
            {bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[0.95rem] leading-[1.5]">
                <span className="text-gold mt-[2px]">→</span>
                <span className="text-bone-soft">{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/musterbericht"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition text-sm"
            >
              {t('sampleReport.ctaFull')} <span className="font-mono">→</span>
            </Link>
            <a
              href="/beispiel-coachcheck-report.pdf"
              download="CoachCheck-Beispielreport.pdf"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-bone/30 text-bone font-semibold hover:bg-bone hover:text-ink hover:border-bone transition text-sm"
            >
              {t('sampleReport.ctaPdf')} <span className="font-mono">↓</span>
            </a>
          </div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-bone-soft/70 mt-4">
            {t('sampleReport.pdfNote')}
          </p>
        </div>

        {/* Right: stacked preview cards */}
        <div className="relative h-[420px] md:h-[500px]">
          <div className="absolute right-0 top-6 w-[78%] h-[88%] bg-bone/10 rounded-lg rotate-[4deg]" />
          <div className="absolute right-4 top-3 w-[80%] h-[90%] bg-bone/15 rounded-lg rotate-[2deg]" />
          <div className="absolute left-0 top-0 w-[88%] md:w-[82%] bg-bone text-ink rounded-lg shadow-2xl p-7 md:p-8 overflow-hidden">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold-deep mb-2">
              {t('sampleReport.cardKicker')}
            </div>
            <div className="font-display text-[1.7rem] leading-[1.05] tracking-[-0.02em] mb-1" style={{ fontVariationSettings: "'opsz' 144" }}>
              {t('sampleReport.cardName')}
            </div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted mb-5">
              {t('sampleReport.cardTrait')}
            </div>
            <p className="font-editorial italic text-[0.98rem] leading-[1.5] text-ink mb-5">
              {t('sampleReport.cardQuote')}
            </p>
            <div className="border-t border-bone-line pt-4">
              <div className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-gold-deep mb-2">
                {t('sampleReport.paradoxLabel')}
              </div>
              <p className="text-[0.86rem] leading-[1.5] text-ink">
                {t('sampleReport.paradoxText')}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bone to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
