/**
 * Wissenschaftliche Grundlage — Autoritäts- & Vertrauenssektion.
 * Zeigt das Forschungsfundament: etablierte sportpsychologische Theorien
 * und eine kuratierte Auswahl echter, peer-reviewter Quellen aus der
 * Humatrix-Wissensdatenbank (evidenz-gemappt, kuratiert).
 *
 * Sprache bewusst präzise: "wissenschaftlich fundiert / stützt sich auf",
 * keine klinische Diagnose, keine Erfolgsgarantie. Keine Personenwerbung.
 */
const THEORIES = [
  { t: 'Selbstbestimmungstheorie', d: 'Autonomie, Kompetenz, Zugehörigkeit als Motor echter Motivation.' },
  { t: 'Achievement-Goal-Theory', d: 'Wie Ziel- und Leistungsklima Anspruch und Angst steuern.' },
  { t: 'Transformationale Führung', d: 'Führung, die Standards setzt und Menschen über sich hinaus hebt.' },
  { t: 'Goal-Setting & Feedback', d: 'Wirksame Ziele, gekoppelt an Feedback- und Reviewschleifen.' },
  { t: 'Teamkohäsion & Leadership', d: 'Was Gruppen trägt — und was sie unter Druck zerlegt.' },
  { t: 'Druck-, Reset- & Fehlerkultur', d: 'Selbstregulation und psychologische Sicherheit als trainierbare Leistung.' },
];

// Kuratierte Auswahl echter, evidenz-gemappter Quellen aus der Wissensdatenbank.
const REFERENCES = [
  { authors: 'Mossman, Slemp, Lewis et al.', year: 2022, topic: 'Autonomieförderung im Sport (Meta-Analyse)', ev: 'A' },
  { authors: 'Williamson et al.', year: 2024, topic: 'Zielsetzung im Sport (systematisches Review)', ev: 'A' },
  { authors: 'Jowett & Ntoumanis', year: 2004, topic: 'Coach-Athlet-Beziehung (CART-Q)', ev: 'A-' },
  { authors: 'Fransen et al.', year: 2015, topic: 'Athlete Leadership & Netzwerkanalyse', ev: 'A-' },
  { authors: 'Cooke et al.', year: 2024, topic: 'Psychologische Sicherheit im Sport (Review)', ev: 'A-' },
  { authors: 'Chelladurai & Saleh', year: 1980, topic: 'Dimensionen des Führungsverhaltens (LSS)', ev: 'B+' },
  { authors: 'Glandorf et al.', year: 2022, topic: 'Burnout & Gesundheit im Sport (Review)', ev: 'A-' },
];

export function ScienceFoundation() {
  return (
    <section className="bg-bone text-ink py-16 md:py-28 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-6 flex items-center gap-3">
          <span className="w-10 h-px bg-gold" /> Wissenschaftliche Grundlage
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-start">
          {/* Left: foundation */}
          <div>
            <h2 className="font-display font-light text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] max-w-[15ch] mb-6">
              Kein Bauchgefühl. <em className="font-editorial">Forschung.</em>
            </h2>
            <p className="text-[1.05rem] leading-[1.65] text-ink/85 max-w-[52ch] mb-8">
              CoachCheck stützt sich auf ein strukturiertes Wissensfundament aus
              <strong className="font-medium"> etablierter Sportpsychologie, Team- und Coachingforschung</strong> —
              wissenschaftlich anschlussfähig an anerkannte Konstrukte und
              evidenz-gemappt, sodass hinter jeder Aussage ein Konstrukt und eine
              kuratierte Quelle steht. Die sechs Achsen und sieben Module übersetzen
              diese Forschung in konkrete, alltagstaugliche Führungssprache.
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
              {['Evidenz-gemappt', 'Reviews & Meta-Analysen', '7 Module · 6 Achsen', 'Claim-geprüft'].map((c) => (
                <span key={c} className="font-mono text-[0.62rem] uppercase tracking-[0.14em] px-3 py-1.5 rounded-full bg-petrol text-bone">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Right: curated real references */}
          <div className="bg-petrol text-bone rounded-lg p-8 md:p-10 self-stretch">
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-gold mb-5">
              Auswahl der Quellen
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
              Auszug aus unserer kuratierten Quellenbasis · Evidenzgrade A / A- / B+ · wissenschaftlich
              fundiert, keine klinische Diagnose und keine Erfolgsgarantie.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
