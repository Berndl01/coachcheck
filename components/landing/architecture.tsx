export function ArchitectureSection() {
  const modules = [
    {
      num: 'Modul 01',
      title: 'Führungs\u00ADarchitektur',
      desc: 'Wie der Trainer grundsätzlich führt — Identität, Entscheidung, Motivation.',
      subs: ['identität', 'entscheidung', 'kommunikation', 'motivation', 'fehlerkultur'],
    },
    {
      num: 'Modul 02',
      title: 'Führungs\u00AD<em>wirkung</em>',
      desc: 'Nicht wie du dich siehst, sondern wie die Mannschaft dich erlebt.',
      subs: ['klarheit', 'glaubwürdigkeit', 'fairness', 'vertrauen', 'präsenz'],
    },
    {
      num: 'Modul 03',
      title: 'Teamklima',
      desc: 'Das Team als soziales System — Zusammenhalt, Offenheit, Sicherheit.',
      subs: ['zusammenhalt', 'sicherheit', 'offenheit', 'konflikt', 'identität'],
    },
    {
      num: 'Modul 04',
      title: 'Team\u00ADstruktur',
      desc: 'Rollen, Gerechtigkeit, Untergruppen, Integration — strukturell erfasst.',
      subs: ['rollenklarheit', 'gerechtigkeit', 'untergruppen', 'integration', 'status'],
    },
    {
      num: 'Modul 05',
      title: 'Performance <em>Climate</em>',
      desc: 'Anspruch, Druck, Fehlerangst vs. Lernorientierung, Eigenverantwortung.',
      subs: ['anspruch', 'druckklima', 'fehlerangst', 'verbindlichkeit', 'fokus'],
    },
    {
      num: 'Modul 06',
      title: 'Saison\u00ADdynamik',
      desc: 'Wiederholbarer Puls über die Saison — empfindlich für Veränderungen.',
      subs: ['stimmung', 'belastung', 'zuversicht', 'wir-gefühl', 'spannung'],
    },
  ];

  const axes = [
    { n: 'Achse 01', l: 'Struktur', r: 'Intuition', pos: '28%' },
    { n: 'Achse 02', l: 'Autorität', r: 'Beteiligung', pos: '42%' },
    { n: 'Achse 03', l: 'Leistung', r: 'Beziehung', pos: '66%' },
    { n: 'Achse 04', l: 'Stabilität', r: 'Aktivierung', pos: '38%' },
    { n: 'Achse 05', l: 'Reflexion', r: 'Direktheit', pos: '52%' },
    { n: 'Achse 06', l: 'Standards', r: 'Anpassung', pos: '30%' },
  ];

  return (
    <section id="architecture" className="bg-petrol text-bone py-16 md:py-28 px-4 md:px-8 relative overflow-hidden">
      <div
        className="absolute top-[10%] -right-[10%] w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(179, 142, 69, 0.08), transparent 60%)' }}
      />
      <div className="max-w-[1440px] mx-auto relative z-10">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-light mb-6 flex items-center gap-3">
          <span className="w-10 h-px bg-gold" /> 05 — Unter der Oberfläche
        </div>
        <h2 className="font-display font-light text-[clamp(2rem,5.5vw,4.2rem)] leading-none tracking-[-0.035em] max-w-[20ch] mb-5">
          Was die 12 Typen<br />
          <em className="font-editorial text-gold-light">wirklich tragen.</em>
        </h2>
        <p className="font-editorial italic text-xl text-bone-soft max-w-[58ch] leading-[1.45] mb-12 md:mb-16 opacity-90">
          Die 12 Archetypen sind die sichtbare Ergebnis-Schicht. Darunter liegt ein
          diagnostisches System aus sechs Modulen und sechs Kernachsen — auf
          Consulting-Niveau, für Trainer, die es ernst meinen.
        </p>

        {/* 6 Modules */}
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-gold-light mb-5 flex items-center gap-3">
          <span className="flex-grow h-px bg-bone/15 max-w-[80px]" />
          Sechs diagnostische Module
          <span className="w-10 h-px bg-bone/15" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-bone/12 border border-bone/12 mb-12 md:mb-16 rounded-sm overflow-hidden">
          {modules.map((m, i) => (
            <article key={i} className="bg-petrol hover:bg-petrol-soft p-7 flex flex-col gap-2 transition-colors">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold mb-1">{m.num}</span>
              <h3
                className="font-display text-[1.25rem] font-medium leading-[1.1] tracking-[-0.02em] text-bone mb-1"
                style={{ fontVariationSettings: "'opsz' 144" }}
                dangerouslySetInnerHTML={{ __html: m.title.replace('<em>', '<em class="font-editorial italic font-normal">') }}
              />
              <p className="text-sm leading-[1.5] text-bone-soft opacity-75 mb-4">{m.desc}</p>
              <ul className="flex flex-wrap gap-1.5 mt-auto">
                {m.subs.map((s, j) => (
                  <li key={j} className="font-mono text-[0.65rem] px-2 py-0.5 bg-bone/7 border border-bone/10 text-bone-soft rounded-full lowercase">
                    {s}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* 6 Axes */}
        <div className="my-10 md:my-14 p-6 md:p-10 bg-petrol/40 border border-bone/10 rounded-md">
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-8">
            <h3 className="font-display font-normal text-[clamp(1.3rem,2.5vw,1.7rem)] leading-tight tracking-[-0.02em] text-bone" style={{ fontVariationSettings: "'opsz' 144" }}>
              Sechs Kernachsen<br />der <em className="font-editorial italic text-gold-light">Führungsarchitektur.</em>
            </h3>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-gold">Beispiel-Profil</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-x-10 md:gap-y-5">
            {axes.map((a, i) => (
              <div key={i} className="grid gap-1.5">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-gold opacity-70">{a.n}</span>
                <div className="flex justify-between font-mono text-xs uppercase tracking-[0.08em] text-bone-soft opacity-85">
                  <span>{a.l}</span>
                  <span>{a.r}</span>
                </div>
                <div className="relative h-0.5 bg-bone/12 rounded">
                  <span
                    className="absolute top-1/2 w-2 h-2 bg-gold rounded-full -translate-y-1/2 -translate-x-1/2"
                    style={{ left: a.pos, boxShadow: '0 0 0 3px var(--petrol)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Sample */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.7fr_1.6fr] bg-bone text-ink rounded-md overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] ring-1 ring-gold/30">
          <div className="bg-ink text-bone p-8 flex flex-col gap-3 relative">
            <span className="absolute top-0 inset-x-0 h-[3px] bg-gold" />
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold mb-2">
              Auszug · Premium-Report
            </span>
            <h4
              className="font-display text-[1.35rem] font-normal leading-tight tracking-[-0.02em]"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              Kommunikations&shy;<em className="font-editorial italic text-gold-light">wirkung</em>
            </h4>
            <div className="flex gap-6 mt-6 pt-6 border-t border-ink-line">
              <div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-dark mb-1">Score</div>
                <div className="font-display text-[1.35rem] font-medium text-gold tracking-[-0.02em]">68</div>
              </div>
              <div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-dark mb-1">Spreizung</div>
                <div className="font-display text-[1.35rem] font-medium text-gold tracking-[-0.02em]">hoch</div>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-gold-deep mb-3 flex items-center gap-2">
              <span className="w-5 h-px bg-gold-deep" /> Interpretation
            </div>
            <h4 className="font-display text-[1.3rem] font-medium leading-[1.15] tracking-[-0.02em] mb-4" style={{ fontVariationSettings: "'opsz' 144" }}>
              Solide Wirkung,{' '}
              <em className="font-editorial italic font-normal">uneinheitliche Anschlussfähigkeit.</em>
            </h4>
            <p className="font-editorial text-[1.02rem] leading-[1.55] text-ink mb-5">
              Die Kommunikationswirkung des Trainers wird insgesamt als solide erlebt,
              jedoch nicht gleichmäßig. Ein Teil der Mannschaft erlebt Orientierung und
              Nachvollziehbarkeit, ein anderer Teil mehr Unklarheit. Diese Spreizung
              spricht weniger für ein generelles Kommunikations&shy;problem als für eine
              uneinheitliche Anschlussfähigkeit.
            </p>
            <div className="flex flex-col gap-1.5 p-4 bg-bone-soft border-l-2 border-gold rounded-r-md">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-gold-deep">
                Entwicklungshebel
              </span>
              <span className="text-sm leading-[1.5] font-medium">
                Nicht mehr Klarheit — differenziertere Adressierung. Welche
                Spielergruppen erreichst du, welche nicht?
              </span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center font-mono text-xs uppercase tracking-[0.16em] text-bone-soft opacity-70">
          So liest sich ein Auszug aus dem Premium-Report — Diagnose, Interpretation, Hebel.
        </p>
      </div>
    </section>
  );
}
