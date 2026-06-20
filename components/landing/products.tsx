import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import type { Product } from '@/lib/types';

export async function ProductsSection() {
  const t = await getT();
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('tier', { ascending: true });

  const items = (products ?? []) as Product[];

  const tagMap: Record<string, string> = {
    schnelltest: t('products.tag_schnelltest'),
    selbsttest: t('products.tag_selbsttest'),
    spiegel_360: t('products.tag_spiegel_360'),
    teamcheck: t('products.tag_teamcheck'),
    saison_beratung: t('products.tag_saison_beratung'),
  };
  const subtitleMap: Record<string, string[]> = {
    schnelltest: [t('products.sub_schnelltest_1'), t('products.sub_schnelltest_2')],
    selbsttest: [t('products.sub_selbsttest_1'), t('products.sub_selbsttest_2')],
    spiegel_360: [t('products.sub_spiegel_360_1'), t('products.sub_spiegel_360_2')],
    teamcheck: [t('products.sub_teamcheck_1'), t('products.sub_teamcheck_2')],
    saison_beratung: [t('products.sub_saison_beratung_1'), t('products.sub_saison_beratung_2')],
  };
  const noteMap: Record<string, string> = {
    schnelltest: t('products.note_schnelltest'),
    selbsttest: t('products.note_selbsttest'),
    spiegel_360: t('products.note_spiegel_360'),
    teamcheck: t('products.note_teamcheck'),
    saison_beratung: t('products.note_saison_beratung'),
  };

  return (
    <section id="products" className="bg-ink text-bone py-16 md:py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(179, 142, 69, 0.06), transparent 55%), radial-gradient(ellipse at bottom left, rgba(179, 142, 69, 0.03), transparent 50%)',
        }}
      />
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-dark mb-6 flex items-center gap-3">
          <span className="w-10 h-px bg-bone" /> {t('products.kicker')}
        </div>
        <h2 className="font-display font-light text-[clamp(2rem,5vw,3.8rem)] leading-[1.02] tracking-[-0.03em] max-w-[18ch] mb-4">
          {t('products.h2a')} <em className="font-editorial text-gold">{t('products.h2emph')}</em>
        </h2>
        <p className="font-editorial text-xl text-bone-soft max-w-[50ch] mb-12 md:mb-16">
          {t('products.lead')}
        </p>

        {items.length === 0 ? (
          <div className="text-center py-12 text-bone-soft/60 font-mono text-sm">
            {t('products.loading')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {items.map((p) => {
              const featured = p.slug === 'spiegel_360';
              const subtitle = subtitleMap[p.slug] ?? [''];
              return (
                <article
                  key={p.id}
                  className={`relative rounded-md p-6 flex flex-col min-h-[460px] border transition-all hover:-translate-y-1.5 ${
                    featured
                      ? 'bg-bone text-ink border-bone hover:border-gold xl:scale-[1.04] xl:shadow-[0_20px_50px_rgba(0,0,0,0.25)] z-10'
                      : 'bg-ink-soft border-ink-line hover:border-gold'
                  }`}
                >
                  <span
                    className={`font-mono text-[0.62rem] uppercase tracking-[0.16em] inline-block px-2 py-0.5 border rounded-full mb-5 self-start ${
                      featured ? 'bg-ink text-gold border-ink' : 'border-current opacity-70'
                    }`}
                  >
                    {tagMap[p.slug]}
                  </span>
                  <h3 className="font-display text-[1.55rem] font-normal leading-none tracking-[-0.025em] mb-1">
                    {p.slug === 'spiegel_360' ? <em className="font-editorial">{p.name_de}</em> : p.name_de}
                  </h3>
                  <div className="font-mono text-[0.68rem] uppercase tracking-[0.1em] opacity-60 mb-5 leading-[1.35]">
                    {subtitle.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  <div className="font-display text-[2.1rem] font-light tracking-[-0.03em] leading-none mb-1">
                    {p.price_cents < 10000 ? (
                      `${Math.floor(p.price_cents / 100)}`
                    ) : (
                      <>
                        <span className="text-[0.35em] font-mono opacity-55 mr-1 align-middle tracking-[0.05em]">{t('products.fromPrefix')}</span>
                        {(p.price_cents / 100).toLocaleString('de-AT')}
                      </>
                    )}
                    <span className="text-[0.4em] opacity-60 ml-1 font-mono">€</span>
                  </div>
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.1em] opacity-50 mb-5">
                    {noteMap[p.slug]}
                  </div>
                  {p.tier >= 4 && (
                    <div
                      className={`flex items-center gap-2 mb-4 font-mono text-[0.6rem] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full self-start ${
                        featured ? 'bg-gold/15 text-gold-deep' : 'bg-gold/15 text-gold'
                      }`}
                    >
                      <span>★</span> {t('products.withSupport')}
                    </div>
                  )}
                  <ul className="flex-grow mt-2 mb-5 pt-4 border-t space-y-1" style={{ borderColor: featured ? 'rgba(10,11,13,0.15)' : 'rgba(255,255,255,0.12)' }}>
                    {p.features.map((f, i) => (
                      <li key={i} className="pl-4 py-1.5 text-[0.82rem] leading-[1.35] relative">
                        <span className="absolute left-0 font-mono opacity-50">→</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.tier >= 4 ? `/kontakt?plan=${p.slug}` : `/checkout/${p.slug}`}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-full font-semibold text-sm transition ${
                      featured
                        ? 'bg-ink text-gold hover:bg-gold hover:text-ink'
                        : 'bg-bone text-ink hover:bg-gold'
                    }`}
                  >
                    {p.tier >= 4 ? t('products.inquire') : t('products.startTemplate').replace('{name}', p.name_de)}
                    <span className="font-mono">→</span>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
