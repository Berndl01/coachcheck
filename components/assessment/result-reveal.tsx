'use client';

import { useEffect, useState, type ReactNode } from 'react';

type Props = {
  assessmentId: string;
  primaryName: string;
  secondaryName: string | null;
  isMixed: boolean;
  headline: string;
  kernsatz: string;
  reading: string;
  strengths: string[];
  underPressure: string;
  tension: string;
  teamReach: string;
  teamFeedback: string;
  nextLever: string;
};

/**
 * Gestaffelte Wow-Enthüllung (Bestcase §8 Ablauf D): 5 fokussierte Bildschirme
 * VOR dem vollständigen Report. Alle Inhalte sind deterministisch (Signatur +
 * Bedienungsanleitung) — funktioniert sofort nach Abschluss, ohne KI-Report.
 *
 * Bildschirme:
 *  1) Dein aktuelles Führungsprofil (mischprofil-bewusst)
 *  2) Was dich stark macht
 *  3) Was unter Druck passieren kann (nicht verurteilend)
 *  4) So kann dein Team dich erleben (ausdrücklich Hypothese)
 *  5) Dein nächster sinnvoller Schritt
 *
 * Wiederkehrende Nutzer (localStorage je Assessment) starten eingeklappt, damit
 * sie nicht jedes Mal durch die Enthüllung müssen.
 */
export function ResultReveal(props: Props) {
  const {
    assessmentId, primaryName, secondaryName, isMixed, headline, kernsatz,
    reading, strengths, underPressure, tension, teamReach, teamFeedback, nextLever,
  } = props;

  const storageKey = `cc_reveal_${assessmentId}`;
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // Wiederkehrer: bereits gesehen → eingeklappt starten (nach Hydration, damit
  // SSR und erster Client-Render identisch sind → keine Hydration-Warnung).
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem(storageKey)) {
        setDone(true);
      }
    } catch {
      /* localStorage nicht verfügbar → Enthüllung normal zeigen */
    }
  }, [storageKey]);

  function finish() {
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
    setDone(true);
  }

  const screens: { kicker: string; title: string; body: ReactNode }[] = [
    {
      kicker: isMixed ? 'Dein aktuelles Profil · Mischprofil' : 'Dein aktuelles Führungsprofil',
      title: primaryName,
      body: (
        <>
          {isMixed && secondaryName ? (
            <p className="font-editorial italic text-xl leading-[1.5] max-w-[56ch] text-bone-soft mb-4">
              Ein Mischprofil aus <strong className="text-bone font-medium">{primaryName}</strong> und{' '}
              <strong className="text-bone font-medium">{secondaryName}</strong> — beide Muster sind bei dir
              etwa gleich stark.
            </p>
          ) : (
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-bone-soft mb-4">
              {headline}
            </p>
          )}
          <p className="font-editorial italic text-xl leading-[1.5] max-w-[56ch] text-bone-soft mb-4">
            {kernsatz}
          </p>
          <p className="text-bone-soft leading-relaxed max-w-[56ch]">{reading}</p>
        </>
      ),
    },
    {
      kicker: 'Was dich stark macht',
      title: 'Deine Stärken',
      body: (
        <ul className="space-y-3 max-w-[56ch]">
          {strengths.map((s, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="font-mono text-gold mt-0.5">0{i + 1}</span>
              <span className="text-bone leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      kicker: 'Was unter Druck passieren kann',
      title: 'Unter Druck',
      body: (
        <>
          <p className="text-bone-soft leading-relaxed max-w-[56ch] mb-4">{underPressure}</p>
          <p className="font-editorial italic text-lg leading-[1.5] max-w-[56ch] text-bone-soft">
            {tension}
          </p>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-bone-soft/70 mt-5">
            Kein Urteil — ein Muster, das du kennen solltest.
          </p>
        </>
      ),
    },
    {
      kicker: 'So kann dein Team dich erleben',
      title: 'Wahrscheinliche Wirkung',
      body: (
        <>
          <div className="space-y-4 max-w-[56ch]">
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-gold mb-1">
                So erreichen dich Spieler
              </div>
              <p className="text-bone-soft leading-relaxed">{teamReach}</p>
            </div>
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-gold mb-1">
                So gibt man dir Feedback
              </div>
              <p className="text-bone-soft leading-relaxed">{teamFeedback}</p>
            </div>
          </div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-bone-soft/70 mt-5">
            Hypothese aus deinem Selbstbild · noch kein echtes Fremdbild.
          </p>
        </>
      ),
    },
    {
      kicker: 'Dein nächster sinnvoller Schritt',
      title: 'Diese Woche',
      body: (
        <>
          <p className="text-bone leading-relaxed max-w-[56ch] text-lg">{nextLever}</p>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-bone-soft/70 mt-5">
            Ein konkreter Hebel für die nächsten 7 Tage.
          </p>
        </>
      ),
    },
  ];

  const total = screens.length;
  const current = screens[step];
  const isLast = step === total - 1;

  // Eingeklappte Zusammenfassung (Wiederkehrer oder nach Abschluss der Enthüllung).
  if (done) {
    return (
      <section className="bg-petrol text-bone py-10 md:py-14 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-gold-light mb-2">
              {isMixed ? 'Dein Profil · Mischprofil' : 'Dein Führungsprofil'}
            </div>
            <h1 className="font-display font-light text-[clamp(2rem,5vw,3.4rem)] leading-[1.04] tracking-[-0.03em]" style={{ fontVariationSettings: "'opsz' 144" }}>
              {primaryName}
            </h1>
            {isMixed && secondaryName && (
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-bone-soft mt-2">
                Mischprofil mit {secondaryName}
              </p>
            )}
          </div>
          <button
            onClick={() => { setStep(0); setDone(false); }}
            className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-4 py-2 border border-bone/30 rounded-full hover:bg-bone/10 transition"
          >
            Enthüllung erneut ansehen
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-petrol text-bone min-h-[78vh] flex flex-col px-4 md:px-8 py-10 md:py-14 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(179, 142, 69, 0.15), transparent 55%)' }} />

      {/* Fortschritt */}
      <div className="max-w-4xl mx-auto w-full relative">
        <div className="flex items-center gap-2 mb-10">
          {screens.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Bildschirm ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-gold' : i < step ? 'w-4 bg-bone/50' : 'w-4 bg-bone/15'}`}
            />
          ))}
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-bone-soft/60 ml-2">
            {step + 1} / {total}
          </span>
        </div>
      </div>

      {/* Inhalt */}
      <div className="max-w-4xl mx-auto w-full relative flex-grow flex flex-col justify-center">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-4">{current.kicker}</div>
        <h2 className="font-display font-light text-[clamp(2.2rem,5.5vw,4.2rem)] leading-[1.03] tracking-[-0.03em] mb-7" style={{ fontVariationSettings: "'opsz' 144" }}>
          {current.title}
        </h2>
        <div>{current.body}</div>
      </div>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto w-full relative mt-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-4 py-3 border border-bone/30 rounded-full hover:bg-bone/10 transition"
            >
              Zurück
            </button>
          )}
          {!isLast ? (
            <button
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition"
            >
              Weiter <span className="font-mono">→</span>
            </button>
          ) : (
            <button
              onClick={finish}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition"
            >
              Zum vollständigen Ergebnis <span className="font-mono">↓</span>
            </button>
          )}
        </div>
        <button
          onClick={finish}
          className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-bone-soft/70 hover:text-bone transition"
        >
          Überspringen
        </button>
      </div>
    </section>
  );
}
