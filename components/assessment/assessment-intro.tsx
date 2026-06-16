'use client';

import { useMemo } from 'react';
import type { Item } from './item-renderer';

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
          {productName ?? 'Coach-Assessment'} · Bevor du startest
        </div>
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] tracking-[-0.03em] leading-[1.05] mb-6">
          {resuming ? (
            <>Weiter geht’s — <em className="font-editorial">dein Assessment</em> wartet.</>
          ) : (
            <>Gleich geht’s los — <em className="font-editorial">nimm dir kurz Zeit</em>.</>
          )}
        </h1>
        <p className="font-editorial italic text-xl text-muted leading-[1.5] mb-8">
          {resuming
            ? 'Du hast schon angefangen. Wir setzen genau dort fort, wo du aufgehört hast — deine bisherigen Antworten sind gespeichert.'
            : 'Dieser Fragebogen ist die Grundlage für deinen persönlichen Report. Es gibt kein Richtig oder Falsch — antworte so, wie es für dich stimmt.'}
        </p>

        <div className="grid gap-4 mb-8">
          <div className="flex gap-4 items-start">
            <span className="font-mono text-xs text-gold mt-1 shrink-0">01</span>
            <div>
              <div className="font-medium">~{minutes} Minuten · {total} Fragen</div>
              <div className="text-sm text-muted">
                Am besten in Ruhe und ohne Unterbrechung. Du kannst jederzeit pausieren — dein Fortschritt wird automatisch gespeichert.
              </div>
            </div>
          </div>
          {moduleLine && (
            <div className="flex gap-4 items-start">
              <span className="font-mono text-xs text-gold mt-1 shrink-0">02</span>
              <div>
                <div className="font-medium">Das erwartet dich</div>
                <div className="text-sm text-muted">
                  {moduleNames.length} Themenbereiche: {moduleLine}. Mal Skalen, mal kurze Szenarien oder Abwägungen — abwechslungsreich und konkret aus dem Trainingsalltag.
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-4 items-start">
            <span className="font-mono text-xs text-gold mt-1 shrink-0">{moduleLine ? '03' : '02'}</span>
            <div>
              <div className="font-medium">Am Ende: dein Report</div>
              <div className="text-sm text-muted">
                Direkt nach der letzten Frage wird dein Report erstellt — mit deinem Profil, allen Auswertungen und einem konkreten Entwicklungspfad, online und als PDF.
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted mb-8 leading-relaxed">
          Ein Tipp: Antworte spontan und ehrlich statt taktisch. Je echter deine
          Antworten, desto treffsicherer wird dein Report.
        </p>

        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
        >
          {resuming ? 'Fortsetzen' : 'Jetzt starten'} <span className="font-mono">→</span>
        </button>
      </div>
    </main>
  );
}
