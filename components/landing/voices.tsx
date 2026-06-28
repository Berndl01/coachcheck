import { getT } from '@/lib/i18n/server';

export async function VoicesSection() {
  const t = await getT();
  const voices = [
    { text: t('voices.v1text'), context: t('voices.v1role') },
    { text: t('voices.v2text'), context: t('voices.v2role') },
    { text: t('voices.v3text'), context: t('voices.v3role') },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-28">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
        <span className="w-10 h-px bg-ink" /> {t('voices.kicker')}
      </div>
      <h2 className="font-display font-light text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] max-w-[18ch] mb-10 md:mb-16">
        {t('voices.h2a')} <em className="font-editorial">{t('voices.h2emph')}</em>{t('voices.h2b')}<br />{t('voices.h2c')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {voices.map((v, i) => (
          <blockquote
            key={i}
            className="relative bg-bone border border-bone-line rounded-md p-7 flex flex-col transition-colors hover:border-gold"
          >
            <span
              className="font-display font-light text-[5rem] leading-[0.7] text-gold mb-2 block"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              &ldquo;
            </span>
            <p className="font-editorial italic text-[1.1rem] leading-[1.45] text-ink flex-grow mb-6">
              {v.text}
            </p>
            <footer className="border-t border-bone-line pt-4 flex items-center justify-between gap-3">
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">{v.context}</span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-gold-deep">{t('voices.exampleTag')}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
