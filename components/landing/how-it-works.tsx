export function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Fragebogen ausfüllen',
      text: '92 hybride Premium-Items — Skalen, Forced Choice, Szenarien, Spannungsfelder, Dilemmata. 25 Minuten auf jedem Gerät.',
    },
    {
      n: '02',
      title: 'Sofort auswerten',
      text: 'Haupt- und Sekundärtyp aus 12. Funktionale Signatur, Druckprofil, Blind Spots. 24-seitiger Premium-Report auf Consulting-Niveau.',
    },
    {
      n: '03',
      title: 'Team erweitern',
      text: 'Optional: Deine Spieler füllen anonym denselben Check aus. Du siehst, wo dein Selbstbild und ihr Fremdbild auseinandergehen.',
    },
  ];

  return (
    <section className="bg-bone-soft py-16 md:py-28 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
          <span className="w-10 h-px bg-ink" /> 06 — So funktioniert's
        </div>
        <h2 className="font-display font-light text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] max-w-[18ch] mb-10 md:mb-16">
          Drei Schritte. <em className="font-editorial">Null Aufwand.</em>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div
                className="relative inline-block font-display font-light text-[clamp(4rem,10vw,7rem)] leading-[0.9] tracking-[-0.05em] text-ink"
                style={{ fontVariationSettings: "'opsz' 144" }}
              >
                {s.n}
                <span className="absolute top-[0.15em] -right-[0.2em] w-[0.14em] h-[0.14em] bg-gold rounded-full" />
              </div>
              <h3 className="font-display text-[1.45rem] font-medium tracking-[-0.02em] leading-[1.1] mt-4 mb-3">
                {s.title}
              </h3>
              <p className="text-[0.95rem] leading-[1.55] text-muted max-w-[38ch]">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
