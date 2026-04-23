import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'Impressum · Humatrix Coach',
};

export default function ImpressumPage() {
  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-16">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          Rechtliches
        </div>
        <h1 className="font-display text-5xl tracking-[-0.03em] mb-12">Impressum</h1>

        <div className="prose-custom space-y-8 text-ink leading-[1.6]">
          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Medieninhaber & Betreiber</h2>
            <p>
              <strong>Humatrix GmbH</strong><br />
              The Mind Club Company<br />
              Musteradresse 1<br />
              6020 Innsbruck, Tirol<br />
              Österreich
            </p>
            <p className="mt-4">
              <strong>Kontakt:</strong><br />
              E-Mail: <a href="mailto:hello@humatrix.cc" className="text-gold-deep hover:underline">hello@humatrix.cc</a><br />
              Web: <a href="https://humatrix.cc" className="text-gold-deep hover:underline">humatrix.cc</a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Unternehmensgegenstand</h2>
            <p>
              Entwicklung und Vertrieb digitaler Assessment- und Beratungsprodukte für Trainer:innen
              und Führungskräfte im Sport. Tätig im Premium-Segment.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Registereintrag</h2>
            <p>
              Firmenbuchnummer: <em>wird ergänzt nach Eintragung</em><br />
              Firmenbuchgericht: Landesgericht Innsbruck<br />
              UID-Nummer: <em>wird ergänzt</em><br />
              Zuständige Kammer: Wirtschaftskammer Tirol
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Angewandte Rechtsvorschriften</h2>
            <p>
              Unternehmensgesetzbuch (UGB), Gewerbeordnung (GewO), Datenschutz-Grundverordnung (DSGVO),
              Datenschutzgesetz (DSG), E-Commerce-Gesetz (ECG), Mediengesetz.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Online-Streitbeilegung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr" className="text-gold-deep hover:underline" target="_blank" rel="noopener noreferrer">
                ec.europa.eu/consumers/odr
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Haftungsausschluss</h2>
            <p>
              Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
              Vollständigkeit und Aktualität kann trotzdem keine Gewähr übernommen werden. Verlinkte
              externe Seiten stehen ausschließlich in Verantwortung ihrer jeweiligen Betreiber.
            </p>
            <p className="mt-4">
              Die in Reports generierten Analysen sind <strong>diagnostische Orientierung</strong>, keine
              psychologische oder medizinische Diagnose. Sie ersetzen keine fachliche Beratung.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Urheberrecht</h2>
            <p>
              Alle Inhalte (Texte, Bilder, Item-Pool, Archetypen, Reports, Scoring-Logik, Software) sind
              urheberrechtlich geschützt. Vervielfältigung, Bearbeitung oder Weitergabe außerhalb der
              lizenzierten Nutzung ist unzulässig.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
