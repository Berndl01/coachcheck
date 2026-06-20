'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/components/i18n/locale-provider';

type Pick = 'A' | 'B' | 'C' | 'D';

function scoreAnswers(answers: Pick[]) {
  let clar = 0, near = 0, refl = 0;
  answers.forEach((p) => {
    if (p === 'A') { clar += 3; near += 1; refl += 1; }
    if (p === 'B') { clar += 1; near += 3; refl += 2; }
    if (p === 'C') { clar += 2; near += 2; refl += 1; }
    if (p === 'D') { clar += 1; near += 2; refl += 3; }
  });
  const max = 9;
  return {
    clar: Math.round((clar / max) * 100),
    near: Math.round((near / max) * 100),
    refl: Math.round((refl / max) * 100),
  };
}

function determineType(s: { clar: number; near: number; refl: number }): 'type1' | 'type2' | 'type3' {
  if (s.clar >= s.near && s.clar >= s.refl) return 'type1';
  if (s.near >= s.clar && s.near >= s.refl) return 'type2';
  return 'type3';
}

export function MiniCheck() {
  const t = useT();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Pick[]>([]);

  const questions = [
    {
      q: <>{t('miniCheck.q1a')} <em className="font-editorial italic font-normal">{t('miniCheck.q1emph')}</em></>,
      opts: [
        { k: 'A', label: t('miniCheck.q1oA') },
        { k: 'B', label: t('miniCheck.q1oB') },
        { k: 'C', label: t('miniCheck.q1oC') },
        { k: 'D', label: t('miniCheck.q1oD') },
      ],
    },
    {
      q: <>{t('miniCheck.q2a')} <em className="font-editorial italic font-normal">{t('miniCheck.q2emph')}</em> {t('miniCheck.q2b')}</>,
      opts: [
        { k: 'A', label: t('miniCheck.q2oA') },
        { k: 'B', label: t('miniCheck.q2oB') },
        { k: 'C', label: t('miniCheck.q2oC') },
        { k: 'D', label: t('miniCheck.q2oD') },
      ],
    },
    {
      q: <>{t('miniCheck.q3a')} <em className="font-editorial italic font-normal">{t('miniCheck.q3emph')}</em> {t('miniCheck.q3b')}</>,
      opts: [
        { k: 'A', label: t('miniCheck.q3oA') },
        { k: 'B', label: t('miniCheck.q3oB') },
        { k: 'C', label: t('miniCheck.q3oC') },
        { k: 'D', label: t('miniCheck.q3oD') },
      ],
    },
  ];

  const handlePick = (p: Pick) => {
    setAnswers([...answers, p]);
    setStep(step + 1);
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
  };

  const isResult = step >= questions.length;
  const scores = isResult ? scoreAnswers(answers) : null;
  const typeId = scores ? determineType(scores) : null;
  const progressPct = isResult ? 100 : ((step + 1) / questions.length) * 100;

  return (
    <section id="check" className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-28">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
        <span className="w-10 h-px bg-ink" /> {t('miniCheck.kicker')}
      </div>
      <h2 className="font-display font-light text-[clamp(2rem,5.5vw,4rem)] leading-none tracking-[-0.035em] max-w-[20ch] mb-4">
        {t('miniCheck.h2a')} <em className="font-editorial">{t('miniCheck.h2emph')}</em>
      </h2>
      <p className="font-editorial italic text-xl text-muted max-w-[52ch] mb-10 md:mb-12 leading-relaxed">
        {t('miniCheck.lead')}
      </p>

      <div className="relative bg-ink text-bone rounded-lg p-6 md:p-12 min-h-[520px] flex flex-col overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 100% 0%, rgba(179, 142, 69, 0.08), transparent 50%)' }}
        />

        {/* Progress bar */}
        <div className="flex items-center justify-between pb-4 mb-8 border-b border-ink-line font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted-dark relative z-10">
          <span>{isResult ? t('miniCheck.resultLabel') : t('miniCheck.questionProgress').replace('{n}', String(step + 1)).replace('{total}', String(questions.length))}</span>
          <div className="flex-grow mx-6 h-0.5 bg-ink-line relative overflow-hidden rounded">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gold transition-[width] duration-500"
              style={{ width: `${progressPct}%`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </div>
          <span>{t('miniCheck.brandLabel')}</span>
        </div>

        {!isResult ? (
          <div className="flex flex-col flex-grow relative z-10 animate-[stepIn_0.5s_ease]">
            <div className="font-mono text-[0.75rem] uppercase tracking-[0.15em] text-gold mb-5">
              {t('miniCheck.questionWord')} {String(step + 1).padStart(2, '0')}
            </div>
            <h3
              className="font-display font-normal text-[clamp(1.6rem,3.5vw,2.6rem)] leading-[1.12] tracking-[-0.025em] mb-8 max-w-[22ch]"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              {questions[step].q}
            </h3>
            <div className="grid gap-3">
              {questions[step].opts.map((o) => (
                <button
                  key={o.k}
                  onClick={() => handlePick(o.k as Pick)}
                  className="flex items-center gap-4 px-5 py-4 bg-ink-soft border border-ink-line rounded-full text-bone font-medium text-left hover:bg-gold hover:text-ink hover:border-gold hover:translate-x-1 transition-all"
                >
                  <span className="font-mono text-sm opacity-60 w-6 shrink-0">{o.k}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : typeId && scores ? (
          <div className="flex flex-col flex-grow relative z-10 animate-[stepIn_0.5s_ease]">
            <div className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-gold mb-5">
              {t('miniCheck.miniProfile')}
            </div>
            <h3
              className="font-display font-normal text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.08] tracking-[-0.025em] mb-3"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              {t('miniCheck.typeIntro')}{' '}
              <em className="font-editorial italic text-gold">{t(`miniCheck.${typeId}name`)}</em>
            </h3>
            <p className="font-editorial italic text-lg text-bone-soft leading-[1.5] max-w-[52ch] mb-8">
              {t(`miniCheck.${typeId}text`)}
            </p>

            <div className="grid gap-3.5 max-w-[460px] mb-8">
              {([
                [t('miniCheck.barClarity'), scores.clar],
                [t('miniCheck.barNear'), scores.near],
                [t('miniCheck.barRefl'), scores.refl],
              ] as const).map(([label, val]) => (
                <div key={label}>
                  <div className="flex justify-between items-baseline font-mono text-xs uppercase tracking-[0.08em] text-bone-soft mb-1">
                    <span>{label}</span>
                    <span className="text-gold">{val}%</span>
                  </div>
                  <div className="h-1 bg-ink-line rounded overflow-hidden">
                    <div
                      className="h-full bg-gold rounded transition-[width] duration-1000"
                      style={{ width: `${val}%`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-auto pt-4">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 px-6 py-4 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition"
              >
                {t('miniCheck.ctaFull')} <span className="font-mono">→</span>
              </Link>
              <button
                onClick={restart}
                className="inline-flex items-center gap-2 px-6 py-4 border border-ink-line text-bone rounded-full font-semibold hover:bg-bone hover:text-ink hover:border-bone transition"
              >
                {t('miniCheck.restart')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
