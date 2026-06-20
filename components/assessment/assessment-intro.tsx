'use client';

import { useMemo } from 'react';
import type { Item } from './item-renderer';
import { useT } from '@/components/i18n/locale-provider';

const MODULE_TITLES: Record<string, string> = {
  A: 'Führungsidentität',
  B: 'Kommunikationsarchitektur',
  C: 'Entscheidung & Priorität',
  D: 'Fehler- & Lernkultur',
  E: 'Führung unter Druck',
  F: 'Motivation & Aktivierung',
  G: 'Beziehung & Vertrauen',
};

/**
 * Intro-/Onboarding-Screen vor dem eigentlichen Fragebogen.
 *
 * Zweck: Der/die Nutzer:in soll VOR dem Start ein Gefühl dafür bekommen, was
 * kommt — wie lange es dauert, wie viele Fragen, welche Themen, wie der Ablauf
 * ist und dass man pausieren kann. Alle Zahlen werden aus den echten Items
 * berechnet (keine hartkodierten Werte), damit sie immer zur tatsächlichen
 * Fragebogen-Länge passen.
 */
export function AssessmentIntro({
  items,
  productName,
  resuming,
  onStart,
}: {
  items: Item[];
  productName?: string | null;
  /** true, wenn schon Antworten existieren (Fortsetzen statt Neustart). */
  resuming: boolean;
  onStart: () => void;
}) {
  const t = useT();
  const { total, moduleNames, minutes } = useMemo(() => {
    const total = items.length;
    // Distinct Module in Reihenfolge ihres ersten Auftretens.
    const seen = new Set<string>();
    const moduleNames: string[] = [];
    for (const it of items) {
      const code = it.module_code;
      if (code && !seen.has(code)) {
        seen.add(code);
        moduleNames.push(MODULE_TITLES[code] ?? `Modul ${code}`);
      }
    }
    // Dauer-Schätzung: ~8 Sekunden pro Item, auf 5er gerundet, min. 5 Minuten.
    const raw = Math.round((total * 8) / 60);
    const minutes = Math.max(5, Math.round(raw / 5) * 5);
    return { total, moduleNames, minutes };
  }, [items]);

  const moduleLine =
    moduleNames.length > 0
      ? moduleNames.slice(0, 6).join(' · ') + (moduleNames.length > 6 ? ' …' : '')
      : null;

  return (
    <main className="min-h-screen bg-bone flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          {productName ?? t('assessmentIntro.kickerFallback')} · {t('assessmentIntro.kickerSuffix')}
        </div>
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] tracking-[-0.03em] leading-[1.05] mb-6">
          {resuming ? (
            <>{t('assessmentIntro.h1ResumingA')} <em className="font-editorial">{t('assessmentIntro.h1ResumingEmph')}</em> {t('assessmentIntro.h1ResumingB')}</>
          ) : (
            <>{t('assessmentIntro.h1FreshA')} <em className="font-editorial">{t('assessmentIntro.h1FreshEmph')}</em>{t('assessmentIntro.h1FreshB')}</>
          )}
        </h1>
        <p className="font-editorial italic text-xl text-muted leading-[1.5] mb-8">
          {resuming ? t('assessmentIntro.leadResuming') : t('assessmentIntro.leadFresh')}
        </p>

        <div className="grid gap-4 mb-8">
          <div className="flex gap-4 items-start">
            <span className="font-mono text-xs text-gold mt-1 shrink-0">01</span>
            <div>
              <div className="font-medium">{t('assessmentIntro.step1Title').replace('{minutes}', String(minutes)).replace('{total}', String(total))}</div>
              <div className="text-sm text-muted">
                {t('assessmentIntro.step1Desc')}
              </div>
            </div>
          </div>
          {moduleLine && (
            <div className="flex gap-4 items-start">
              <span className="font-mono text-xs text-gold mt-1 shrink-0">02</span>
              <div>
                <div className="font-medium">{t('assessmentIntro.step2Title')}</div>
                <div className="text-sm text-muted">
                  {t('assessmentIntro.step2Desc').replace('{count}', String(moduleNames.length)).replace('{modules}', moduleLine ?? '')}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-4 items-start">
            <span className="font-mono text-xs text-gold mt-1 shrink-0">{moduleLine ? '03' : '02'}</span>
            <div>
              <div className="font-medium">{t('assessmentIntro.step3Title')}</div>
              <div className="text-sm text-muted">
                {t('assessmentIntro.step3Desc')}
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted mb-8 leading-relaxed">
          {t('assessmentIntro.tip')}
        </p>

        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
        >
          {resuming ? t('assessmentIntro.resume') : t('assessmentIntro.start')} <span className="font-mono">→</span>
        </button>
      </div>
    </main>
  );
}
