'use client';

import { useState } from 'react';
import { useT } from '@/components/i18n/locale-provider';

export function FaqSection() {
  const t = useT();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
    { q: t('faq.q7'), a: t('faq.a7') },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-20 items-start">
        <div className="lg:sticky lg:top-24">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
            <span className="w-10 h-px bg-ink" /> {t('faq.kicker')}
          </div>
          <h2 className="font-display font-light text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.02] tracking-[-0.03em]">
            {t('faq.h2a')}<br />
            <em className="font-editorial">{t('faq.h2emph')}</em>
          </h2>
        </div>
        <div className="border-t border-ink">
          {faqs.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className="border-b border-bone-line">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full py-6 flex justify-between items-center gap-4 text-left hover:text-gold-deep transition"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-[1.2rem] font-medium tracking-[-0.02em]">
                    {f.q}
                  </span>
                  <span
                    className={`shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full font-mono text-base transition-all ${
                      isOpen ? 'bg-gold text-ink rotate-45' : 'bg-ink text-bone'
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-400 ease-out ${
                    isOpen ? 'max-h-[400px]' : 'max-h-0'
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <p className="pb-6 pr-4 text-[0.98rem] leading-[1.6] text-muted max-w-[60ch]">
                    {f.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
