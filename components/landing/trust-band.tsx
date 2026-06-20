import { getT } from '@/lib/i18n/server';

export async function TrustBand() {
  const t = await getT();
  const items = [
    {
      num: <>5<sup className="font-mono text-[0.28em] text-gold-deep align-super font-medium tracking-normal">SPORTS</sup></>,
      lbl: t('trustBand.l1'),
    },
    {
      num: <>25<em className="font-editorial italic">min</em></>,
      lbl: t('trustBand.l2'),
    },
    {
      num: <>Anon<em className="font-editorial italic">·</em></>,
      lbl: t('trustBand.l3'),
    },
    {
      num: <>AT<em className="font-editorial italic">·</em></>,
      lbl: t('trustBand.l4'),
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-12 md:py-16 border-t border-b border-bone-line">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {items.map((it, i) => (
          <div key={i}>
            <div
              className="font-display font-normal text-[clamp(2.4rem,4.5vw,3.6rem)] leading-[0.95] tracking-[-0.04em] text-ink mb-2"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              {it.num}
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted leading-[1.4]">
              {it.lbl}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
