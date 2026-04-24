'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'Was kosten die fünf Pakete?',
    a: 'Der Schnelltest startet bei 9 €, der volle Selbsttest bei 29 €. Der 360° Spiegel mit Fremdbild-Abgleich kostet 99 €, der TeamCheck startet bei 299 €, und die komplette Saisonbegleitung inkl. Consulting beginnt bei 1.490 €. Alle Pakete sind Einmalzahlungen ohne Abo. Der Preis richtet sich nach Tiefe, Dauer und Umfang der Begleitung.',
  },
  {
    q: 'Ist der Test wirklich anonym?',
    a: 'Ja. Für den Selbsttest brauchst du nur eine E-Mail, an die wir den Report senden. Bei der Teamversion bleiben die Spieler komplett anonym — du siehst nur Aggregatwerte, nie einzelne Antworten.',
  },
  {
    q: 'Für welche Sportarten ist das gedacht?',
    a: 'Der Check funktioniert für alle Mannschaftssportarten — Fußball, Handball, Eishockey, Volleyball, Basketball. Auch Individualsportarten mit Team-Struktur (Leichtathletik-Gruppen, Schwimm-Teams) sind abgedeckt.',
  },
  {
    q: 'Wie unterscheidet sich das von Coaching?',
    a: 'Coaching gibt dir Rat. Der Mindset Check gibt dir Daten. Er misst, wo du stehst, wie dein Team dich wirklich erlebt, und welche Entwicklungsfelder objektiv sichtbar sind. Die Entscheidungen triffst du selbst.',
  },
  {
    q: 'Kann ich den TeamCheck auch ohne Selbsttest machen?',
    a: 'Technisch ja. Wir empfehlen aber dringend, beide zu kombinieren — der Vergleich Selbstbild vs. Fremdbild ist oft der entscheidende Aha-Moment. Bei der Buchung des TeamChecks ist der Selbsttest bereits inkludiert.',
  },
  {
    q: 'Wie wissenschaftlich ist das System?',
    a: 'Der Check basiert auf sechs diagnostischen Modulen (Führungsarchitektur, Führungswirkung, Teamklima, Teamstruktur, Performance Climate, Saisondynamik) und sechs Kernachsen. Die 12 Archetypen entstehen nicht durch direkte Abfrage, sondern durch die Kombination dieser Dimensionen — das ist psychometrisch deutlich valider als klassische Typen-Tests.',
  },
  {
    q: 'Wer steht hinter dem Produkt?',
    a: 'Humatrix — The Mind Club Company aus Tirol. Wir bauen Premium-Diagnostik an der Schnittstelle von Mindset, Führung und Teamdynamik. Der Sport Mindset Check ist die Sport-Edition unseres Kern-Frameworks — entwickelt gemeinsam mit Trainern aus Regionalliga bis Bundesliga und international eingesetzt.',
  },
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-20 items-start">
        <div className="lg:sticky lg:top-24">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
            <span className="w-10 h-px bg-ink" /> 08 — Fragen & Antworten
          </div>
          <h2 className="font-display font-light text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.02] tracking-[-0.03em]">
            Alles, was du<br />
            <em className="font-editorial">wissen willst.</em>
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
