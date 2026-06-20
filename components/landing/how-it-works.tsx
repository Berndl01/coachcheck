import { getT } from '@/lib/i18n/server';

export async function HowItWorks() {
  const t = await getT();
  const steps = [
    { n: '01', title: t('howItWorks.s1title'), text: t('howItWorks.s1text') },
    { n: '02', title: t('howItWorks.s2title'), text: t('howItWorks.s2text') },
    { n: '03', title: t('howItWorks.s3title'), text: t('howItWorks.s3text') },
  ];

  return (
    <section className="bg-bone-soft py-16 md:py-28 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
          <span className="w-10 h-px bg-ink" /> {t('howItWorks.kicker')}
        </div>
        <h2 className="font-display font-light text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] max-w-[18ch] mb-10 md:mb-16">
          {t('howItWorks.h2a')} <em className="font-editorial">{t('howItWorks.h2emph')}</em>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div
                className="relative inline-block font-display font-light text-[clamp(4rem,10vw,7rem)] leading-[0.9] tracking-[-0.05em] text-ink"
                style={{ fontVariationSettings: "'opsz' 144" }}
              >
                {s.n}
                <span className="absolute top-[0.15em] -right-[0.2em] w-[0.14em] h-[0.14em] bg-gold rounded-full" />
              </div>
              <h3 className="font-display text-[1.45rem] font-medium tracking-[-0.02em] leading-[1.1] mt-4 mb-3">
                {s.title}
              </h3>
              <p className="text-[0.95rem] leading-[1.55] text-muted max-w-[38ch]">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
