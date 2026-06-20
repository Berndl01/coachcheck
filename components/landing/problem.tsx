import { getT } from '@/lib/i18n/server';

export async function ProblemSection() {
  const t = await getT();
  const cards = [
    { num: t('problem.c1num'), title: t('problem.c1title'), text: t('problem.c1text') },
    { num: t('problem.c2num'), title: t('problem.c2title'), text: t('problem.c2text') },
    { num: t('problem.c3num'), title: t('problem.c3title'), text: t('problem.c3text') },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-28">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
        <span className="w-10 h-px bg-ink" /> {t('problem.kicker')}
      </div>
      <h2 className="font-display font-light text-[clamp(2rem,5vw,3.8rem)] leading-[1.05] tracking-[-0.03em] max-w-[22ch] mb-8 md:mb-12">
        {t('problem.h2a')}{' '}
        <em className="font-editorial text-gold-deep">{t('problem.h2emph')}</em>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div
            key={i}
            className="group bg-bone-soft border-l-[3px] border-ink p-8 rounded-sm transition-all hover:-translate-y-1 hover:border-gold"
          >
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted mb-4">
              {c.num}
            </div>
            <h3 className="font-display text-[1.35rem] font-medium tracking-[-0.02em] leading-[1.15] mb-3">
              {c.title}
            </h3>
            <p className="text-[0.95rem] leading-[1.55] text-muted">{c.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
