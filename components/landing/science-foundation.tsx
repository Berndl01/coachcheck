/**
 * Wissenschaftliche Grundlage — Autoritäts- & Vertrauenssektion.
 * Etablierte sportpsychologische Theorien + kuratierte, peer-reviewte Quellen.
 * Sprache bewusst präzise: keine klinische Diagnose, keine Erfolgsgarantie.
 */
import { getT } from '@/lib/i18n/server';

export async function ScienceFoundation() {
  const t = await getT();
  const THEORIES = [
    { t: t('science.th1n'), d: t('science.th1d') },
    { t: t('science.th2n'), d: t('science.th2d') },
    { t: t('science.th3n'), d: t('science.th3d') },
    { t: t('science.th4n'), d: t('science.th4d') },
    { t: t('science.th5n'), d: t('science.th5d') },
    { t: t('science.th6n'), d: t('science.th6d') },
  ];
  const REFERENCES = [
    { authors: 'Mossman, Slemp, Lewis et al.', year: 2022, topic: t('science.r1'), ev: 'A' },
    { authors: 'Williamson et al.', year: 2024, topic: t('science.r2'), ev: 'A' },
    { authors: 'Jowett & Ntoumanis', year: 2004, topic: t('science.r3'), ev: 'A-' },
    { authors: 'Fransen et al.', year: 2015, topic: t('science.r4'), ev: 'A-' },
    { authors: 'Vella et al.', year: 2024, topic: t('science.r5'), ev: 'A-' },
    { authors: 'Cooke et al.', year: 2024, topic: t('science.r6'), ev: 'B+' },
    { authors: 'Chelladurai & Saleh', year: 1980, topic: t('science.r7'), ev: 'B+' },
    { authors: 'Glandorf et al.', year: 2023, topic: t('science.r8'), ev: 'A-' },
  ];
  const tags = [t('science.tag1'), t('science.tag2'), t('science.tag3'), t('science.tag4')];

  return (
    <section className="bg-bone text-ink py-16 md:py-28 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-6 flex items-center gap-3">
          <span className="w-10 h-px bg-gold" /> {t('science.kicker')}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-start">
          <div>
            <h2 className="font-display font-light text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] max-w-[15ch] mb-6">
              {t('science.h2a')} <em className="font-editorial">{t('science.h2emph')}</em>
            </h2>
            <p className="text-[1.05rem] leading-[1.65] text-ink/85 max-w-[52ch] mb-8">
              {t('science.introA')}
              <strong className="font-medium"> {t('science.introStrong')}</strong>{' '}
              {t('science.introB')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 mb-10">
              {THEORIES.map((x) => (
                <div key={x.t} className="border-l-2 border-gold/40 pl-4">
                  <div className="font-display text-[1.02rem] font-medium mb-1">{x.t}</div>
                  <div className="text-[0.86rem] leading-[1.45] text-muted">{x.d}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2.5">
              {tags.map((c) => (
                <span key={c} className="font-mono text-[0.62rem] uppercase tracking-[0.14em] px-3 py-1.5 rounded-full bg-petrol text-bone">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-petrol text-bone rounded-lg p-8 md:p-10 self-stretch">
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-gold mb-5">
              {t('science.refTitle')}
            </div>
            <ul className="space-y-4">
              {REFERENCES.map((r, i) => (
                <li key={i} className="flex items-start gap-3 border-b border-bone/10 pb-4 last:border-0 last:pb-0">
                  <span className="font-mono text-[0.58rem] text-gold mt-1 shrink-0">{r.ev}</span>
                  <div>
                    <div className="text-[0.92rem] leading-[1.4]">
                      <span className="font-medium">{r.authors}</span>{' '}
                      <span className="text-bone-soft">({r.year})</span>
                    </div>
                    <div className="text-[0.8rem] leading-[1.4] text-bone-soft/80">{r.topic}</div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-bone-soft/60 leading-[1.5] mt-6 pt-5 border-t border-bone/15">
              {t('science.refFootnote')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
