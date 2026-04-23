import Link from 'next/link';

export function Hero() {
  return (
    <section className="hero relative max-w-[1440px] mx-auto px-4 md:px-8 pt-8 md:pt-16 pb-16 md:pb-24 overflow-hidden">
      <div className="tech-grid absolute inset-0 pointer-events-none" />

      <div className="relative z-10">
        {/* Meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs uppercase tracking-[0.14em] text-muted border-b border-bone-line pb-4 mb-10 md:mb-14">
          <span className="text-ink font-medium tracking-[0.08em]">
            <em className="font-editorial normal-case tracking-normal text-muted mr-1">für</em>
            Fußball · Handball · Basketball · Volleyball · Eishockey
          </span>
          <span className="inline-flex items-center gap-2 text-gold-deep font-semibold tracking-[0.18em]">
            <span className="live-dot" /> Live · Beta 2026
          </span>
        </div>

        {/* Hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-end">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ink px-3 py-1.5 border border-ink rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Humatrix Coach Assessment · Premium Edition
            </span>

            <h1 className="font-display font-normal leading-[0.96] tracking-[-0.03em] text-[clamp(2.6rem,7.5vw,6.2rem)]">
              <span className="tracking-[-0.045em]">Wie wirkt</span><br />
              dein&nbsp;Trainerstil<br />
              <em className="font-editorial relative inline-block">
                wirklich?
                <span
                  className="absolute left-0 right-0 h-[0.1em] bg-gold -z-10"
                  style={{ bottom: '0.08em', transform: 'skew(-2deg)' }}
                />
              </em>
            </h1>

            <p className="mt-7 max-w-[38ch] text-[clamp(1rem,1.4vw,1.2rem)] leading-[1.45] text-muted">
              Kein Bauchgefühl. Kein Online-Quiz. Ein hybrides Premium-Assessment —
              das zeigt, wie du <em className="font-editorial text-ink text-[1.08em]">wirklich</em> wirkst.
              Und warum die meisten Trainer es nie erfahren.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-9">
              <Link
                href="/signup?plan=schnelltest"
                className="btn-gold-hover inline-flex items-center gap-2 px-6 py-4 bg-ink text-bone rounded-full font-semibold text-[0.95rem] hover:bg-gold hover:text-ink hover:-translate-y-0.5 transition-all"
              >
                Schnelltest starten <span className="font-mono">→</span>
              </Link>
              <Link
                href="#products"
                className="inline-flex items-center gap-2 px-6 py-4 border border-ink text-ink rounded-full font-semibold text-[0.95rem] hover:bg-ink hover:text-bone transition"
              >
                Alle 5 Pakete ansehen
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7 font-mono text-xs uppercase tracking-[0.1em] text-muted">
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gold rounded-full" />
                <b className="font-display font-medium text-ink text-[1.1em] tracking-[-0.02em]">92</b>&nbsp;Premium-Items
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gold rounded-full" />
                <b className="font-display font-medium text-ink text-[1.1em] tracking-[-0.02em]">12</b>&nbsp;Archetypen
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gold rounded-full" />
                <b className="font-display font-medium text-ink text-[1.1em] tracking-[-0.02em]">6</b>&nbsp;Module · 6 Achsen
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gold rounded-full" />
                <b className="font-display font-medium text-ink text-[1.1em] tracking-[-0.02em]">24</b>&nbsp;Seiten Report
              </span>
            </div>
          </div>

          {/* Hero card */}
          <aside className="relative bg-ink text-bone p-8 rounded border border-ink-line overflow-hidden shadow-[0_30px_80px_-20px_rgba(20,63,58,0.25)]">
            <div
              className="absolute top-0 right-0 bottom-0 w-1/2 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0, transparent 8px, rgba(179,142,69,0.04) 8px, rgba(179,142,69,0.04) 9px)',
              }}
            />
            <div className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold mb-4">
              Live · Sample Insight
            </div>
            <div className="font-display font-light text-[clamp(3rem,5vw,4.4rem)] leading-none tracking-[-0.04em]">
              87<sup className="text-[0.35em] align-super text-gold font-mono font-medium tracking-normal">/100</sup>
            </div>
            <div className="font-editorial text-base text-bone-soft mt-3 pt-4 border-t border-ink-line leading-[1.4]">
              „Dein Team erlebt dich als <em>klar und strukturiert</em> — aber dein Ton wirkt härter, als du meinst."
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-ink-line">
              {[
                ['Klarheit', 'A'],
                ['Ton', 'B+'],
                ['Nähe', 'C'],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-muted-dark mb-1">{lbl}</div>
                  <div className="font-display text-[1.4rem] font-medium text-bone tracking-[-0.02em]">{val}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
