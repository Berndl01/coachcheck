export function ProblemSection() {
  const cards = [
    {
      num: '— 01',
      title: 'Kein Team sagt dir die Wahrheit.',
      text: 'Höflichkeit, Hierarchie, Angst vor Folgen. Was Spieler wirklich denken, erfährst du oft erst, wenn es zu spät ist.',
    },
    {
      num: '— 02',
      title: 'Selbstbild ≠ Fremdbild.',
      text: 'Du hältst dich für ruhig und klar. Dein Team erlebt dich als hart und kontrollierend. Diese Lücke entscheidet Spiele.',
    },
    {
      num: '— 03',
      title: 'Stimmung kippt, bevor du\'s siehst.',
      text: 'Konflikte, die Leistung kosten, brauen sich Wochen an. Ohne Messung merkst du es erst am Ergebnis.',
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-28">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
        <span className="w-10 h-px bg-ink" /> 01 — Das Problem
      </div>
      <h2 className="font-display font-light text-[clamp(2rem,5vw,3.8rem)] leading-[1.05] tracking-[-0.03em] max-w-[22ch] mb-8 md:mb-12">
        Die meisten Trainer führen{' '}
        <em className="font-editorial text-gold-deep">im Blindflug.</em>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div
            key={i}
            className="group bg-bone-soft border-l-[3px] border-ink p-8 rounded-sm transition-all hover:-translate-y-1 hover:border-gold"
          >
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted mb-4">
              {c.num}
            </div>
            <h3 className="font-display text-[1.35rem] font-medium tracking-[-0.02em] leading-[1.15] mb-3">
              {c.title}
            </h3>
            <p className="text-[0.95rem] leading-[1.55] text-muted">{c.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
