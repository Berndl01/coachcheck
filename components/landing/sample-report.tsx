import Link from 'next/link';

/**
 * Musterbericht-Teaser auf der Landingpage.
 * Stärkster Verkaufshebel: zeigt anonymisierte Auszüge aus einem echten
 * Report und verlinkt auf die vollständige /musterbericht-Seite.
 */
export function SampleReport() {
  return (
    <section className="bg-petrol text-bone py-16 md:py-28 px-4 md:px-8 relative overflow-hidden">
      <div
        className="absolute -top-[10%] -left-[8%] w-[480px] h-[480px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(179, 142, 69, 0.12), transparent 60%)' }}
      />
      <div className="max-w-[1440px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
        {/* Left: copy */}
        <div>
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-gold mb-6 flex items-center gap-3">
            <span className="w-10 h-px bg-gold" /> 07 — Dein Report
          </div>
          <h2 className="font-display font-light text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] max-w-[16ch] mb-6">
            Sieh dir an, <em className="font-editorial">was du bekommst.</em>
          </h2>
          <p className="text-bone-soft text-[1.02rem] leading-[1.6] max-w-[46ch] mb-8 opacity-90">
            Kein Test-Ergebnis von der Stange. Ein durchdachter Premium-Report auf
            Boutique-Consulting-Niveau: deine persönliche Signatur, deine Paradoxien,
            dein Kippmuster unter Druck — und ein konkretes, evidenzbasiertes
            Entwicklungsprogramm für die nächsten 14, 30 und 90 Tage.
          </p>
          <ul className="space-y-3 mb-10">
            {[
              'Personalisierte Interpretation statt Standard-Textbausteine',
              'Trainer-Paradoxien statt Stärken-Schwächen-Listen',
              'Führungsreife: wie souverän du mit deinem Stil umgehst',
              '14 / 30 / 90-Tage-Programm mit beobachtbarem Verhalten',
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-3 text-[0.95rem] leading-[1.5]">
                <span className="text-gold mt-[2px]">→</span>
                <span className="text-bone-soft">{t}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/musterbericht"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition text-sm"
            >
              Kompletten Musterbericht ansehen <span className="font-mono">→</span>
            </Link>
            <a
              href="/beispiel-coachcheck-report.pdf"
              download="CoachCheck-Beispielreport.pdf"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-bone/30 text-bone font-semibold hover:bg-bone hover:text-ink hover:border-bone transition text-sm"
            >
              Beispiel-Report als PDF <span className="font-mono">↓</span>
            </a>
          </div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-bone-soft/70 mt-4">
            Echter 19-Seiten-Report (anonymisiertes Beispielprofil) · PDF, ~90 KB
          </p>
        </div>

        {/* Right: stacked preview cards */}
        <div className="relative h-[420px] md:h-[500px]">
          {/* back card */}
          <div className="absolute right-0 top-6 w-[78%] h-[88%] bg-bone/10 rounded-lg rotate-[4deg]" />
          {/* mid card */}
          <div className="absolute right-4 top-3 w-[80%] h-[90%] bg-bone/15 rounded-lg rotate-[2deg]" />
          {/* front card — actual excerpt */}
          <div className="absolute left-0 top-0 w-[88%] md:w-[82%] bg-bone text-ink rounded-lg shadow-2xl p-7 md:p-8 overflow-hidden">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold-deep mb-2">
              Humatrix Coach · Premium-Report
            </div>
            <div className="font-display text-[1.7rem] leading-[1.05] tracking-[-0.02em] mb-1" style={{ fontVariationSettings: "'opsz' 144" }}>
              Der Strategische Architekt
            </div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted mb-5">
              Struktur · Planung · Spielidee
            </div>
            <p className="font-editorial italic text-[0.98rem] leading-[1.5] text-ink mb-5">
              „Dieses Profil vereint hohe Struktur mit klarer Führungsintention. Die
              Stärke liegt in Orientierung und Verlässlichkeit — kritisch wird es dort,
              wo unter Unsicherheit aus Struktur Kontrolle wird.&ldquo;
            </p>
            <div className="border-t border-bone-line pt-4">
              <div className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-gold-deep mb-2">
                Eine deiner Paradoxien
              </div>
              <p className="text-[0.86rem] leading-[1.5] text-ink">
                Hohe Klarheit, aber begrenzte Anschlussfähigkeit unter Druck.
              </p>
            </div>
            {/* fade to imply more */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bone to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
