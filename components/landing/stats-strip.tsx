export function StatsStrip() {
  const stats = [
    { num: '5', sup: 'PAKETE', lbl: ['von Schnelltest', 'bis Signature'] },
    { num: '92+', lbl: ['Premium-Items im', 'Hybrid-Assessment'] },
    { num: '12', lbl: ['Sport-Archetypen', 'aus 6 Kernachsen'] },
    { num: '360°', lbl: ['Wirkungsanalyse', 'Selbst vs. Fremdbild'] },
    { num: '24', sup: 'SEITEN', lbl: ['Premium-Report auf', 'Consulting-Niveau'] },
  ];
  return (
    <section className="stats-strip bg-ink text-bone py-10 md:py-14 px-4 md:px-8 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(179,142,69,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(179,142,69,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 50%, transparent 100%)',
        }}
      />
      <div
        className="absolute top-0 left-[30%] right-[30%] h-px opacity-50"
        style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}
      />
      <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4 relative z-10">
        {stats.map((s, i) => (
          <div key={i} className="relative px-2">
            {i > 0 && (
              <span className="hidden lg:block absolute left-0 top-[10%] bottom-[10%] w-px bg-bone/10" />
            )}
            <div
              className="font-display font-light text-[clamp(2.6rem,5vw,3.8rem)] leading-[0.95] tracking-[-0.04em] text-gold"
              style={{ textShadow: '0 0 40px rgba(179,142,69,0.3)' }}
            >
              {s.num}
              {s.sup && (
                <sup className="font-mono text-[0.32em] text-gold-light font-medium align-super ml-1 tracking-normal">
                  {s.sup}
                </sup>
              )}
            </div>
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-bone-soft/75 leading-[1.3] mt-2">
              {s.lbl.map((line, j) => (
                <div key={j}>{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
