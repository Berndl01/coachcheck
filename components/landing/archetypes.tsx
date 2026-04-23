import Link from 'next/link';

export function ArchetypesSection() {
  const types = [
    { n: 'TYP 01', name: 'Der Strategische Architekt', trait: 'Struktur · Planung · Spielidee' },
    { n: 'TYP 02', name: 'Der Autoritative Lenker', trait: 'Richtung · Präsenz · Entscheidung' },
    { n: 'TYP 03', name: 'Der Entwicklungs\u00ADorientierte Förderer', trait: 'Potenzial · Lernen · Wachstum' },
    { n: 'TYP 04', name: 'Der Beziehungs\u00ADstarke Integrator', trait: 'Bindung · Nähe · Vertrauen' },
    { n: 'TYP 05', name: 'Der Leistungs\u00ADorientierte Antreiber', trait: 'Anspruch · Tempo · Ambition', italic: true },
    { n: 'TYP 06', name: 'Der Ruhige Stabilisator', trait: 'Gelassenheit · Halt · Verlässlichkeit' },
    { n: 'TYP 07', name: 'Der Inspirierende Aktivator', trait: 'Energie · Mobilisierung · Momentum', italic: true },
    { n: 'TYP 08', name: 'Der Analytische Diagnostiker', trait: 'Analyse · Reflexion · Präzision' },
    { n: 'TYP 09', name: 'Der Konsequente Standardsetzer', trait: 'Regeln · Disziplin · Standards' },
    { n: 'TYP 10', name: 'Der Adaptive Spielgestalter', trait: 'Flexibilität · Situation · Passung' },
    { n: 'TYP 11', name: 'Der Mentale Taktgeber', trait: 'Fokus · Haltung · Mentalität' },
    { n: 'TYP 12', name: 'Der Transformative Kulturentwickler', trait: 'Kultur · Sinn · Identität', italic: true },
  ];

  return (
    <section id="archetypes" className="bg-bone-soft py-16 md:py-28 px-4 md:px-8 overflow-hidden">
      <div className="max-w-[1440px] mx-auto">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
          <span className="w-10 h-px bg-ink" /> 03 — Die 12 Sport-Archetypen
        </div>
        <h2 className="font-display font-light text-[clamp(2rem,5vw,3.8rem)] leading-[1.02] tracking-[-0.03em] max-w-[22ch] mb-4">
          Welcher <em className="font-editorial">Typ</em> steckt in dir?
        </h2>
        <p className="font-editorial italic text-xl text-muted max-w-[52ch] mb-12">
          Jeder Trainer ist einer von zwölf. Kein Schema, keine Schublade — ein klares
          Profil, das zeigt, wie du führst, entscheidest und wirkst.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-bone-line border border-bone-line rounded-md overflow-hidden">
          {types.map((t, i) => (
            <article
              key={i}
              className="bg-bone p-7 flex flex-col gap-1 min-h-[210px] transition-colors duration-300 hover:bg-ink hover:text-bone group cursor-default"
            >
              <span className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-gold-deep font-medium mb-2 group-hover:text-gold transition-colors">
                {t.n}
              </span>
              <h3
                className={`font-display text-[1.2rem] font-medium leading-[1.1] tracking-[-0.02em] ${t.italic ? 'font-editorial italic font-normal' : ''}`}
                style={{ fontVariationSettings: "'opsz' 144", wordBreak: 'normal', hyphens: 'auto' }}
              >
                {t.name}
              </h3>
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted mt-auto pt-4 group-hover:text-muted-dark transition-colors">
                {t.trait}
              </span>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 bg-ink text-bone rounded-md p-6">
          <div className="font-editorial italic text-lg leading-[1.3]">
            Finde heraus, welcher der{' '}
            <strong className="font-display not-italic font-medium text-gold">12 Archetypen</strong>{' '}
            dich prägt.
          </div>
          <Link
            href="#products"
            className="btn-gold-hover inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition"
          >
            Pakete ansehen <span className="font-mono">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
