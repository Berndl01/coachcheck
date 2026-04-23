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

        <div className="space-y-8 text-ink leading-[1.6]">
          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Medieninhaber & Betreiber</h2>
            <p>
              <strong>Humatrix by Bernhard Lampl</strong><br />
              Mag. Bernhard Lampl, PhD, BSc, MBA, LL.M., MBA<br />
              CEO & Founder
            </p>
            <p className="mt-4">
              Ried 80<br />
              6363 Westendorf<br />
              Tirol, Österreich
            </p>
            <p className="mt-4">
              Telefon: <a href="tel:+436769166020" className="text-gold-deep hover:underline">+43 676 916 60 20</a><br />
              E-Mail: <a href="mailto:office@humatrix.cc" className="text-gold-deep hover:underline">office@humatrix.cc</a><br />
              Web: <a href="https://humatrix.cc" className="text-gold-deep hover:underline">humatrix.cc</a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Unternehmensgegenstand</h2>
            <p>
              Beratung und Analyse im Bereich Sportorganisation, Vereins- und Verbandsentwicklung,
              wissenschaftlich fundierte Leistungs- und Strukturanalyse sowie strategische Beratung im Sport.
              coachcheck.humatrix.cc ist ein digitales Assessment- und Entwicklungsprodukt für Trainer:innen
              im Sport.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">GISA-Nummer</h2>
            <p>39461841</p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Aufsichtsbehörde</h2>
            <p>
              Bezirkshauptmannschaft Kitzbühel<br />
              Tirol, Österreich
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Mitgliedschaften</h2>
            <p>Wirtschaftskammer Österreich — Fachgruppe Unternehmensberatung</p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Berufsrechtliche Vorschriften</h2>
            <p>
              Gewerbeordnung (GewO), abrufbar unter{' '}
              <a href="https://www.ris.bka.gv.at" className="text-gold-deep hover:underline" target="_blank" rel="noopener noreferrer">
                ris.bka.gv.at
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Medieninhaber und Herausgeber</h2>
            <p>
              Bernhard Lampl by Humatrix<br />
              Ried 80, 6363 Westendorf, Österreich
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Blattlinie</h2>
            <p>
              Die Website informiert über Leistungen und Projekte der Sportanalyse- und Beratungsagentur
              Humatrix sowie über wissenschaftliche Erkenntnisse im Bereich Sportorganisation, Vereins-
              und Verbandsentwicklung und digitale Trainer-Assessments.
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
              Die Inhalte dieser Website werden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit,
              Vollständigkeit und Aktualität der Inhalte wird jedoch keine Gewähr übernommen. Trotz
              sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für Inhalte externer Links.
              Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
            <p className="mt-4">
              Die in Reports generierten Analysen sind <strong>diagnostische Orientierung</strong>,
              keine psychologische oder medizinische Diagnose. Sie ersetzen keine fachliche Beratung.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Urheberrecht</h2>
            <p>
              Die Inhalte und Werke auf dieser Website unterliegen dem Urheberrecht. Beiträge Dritter sind
              als solche gekennzeichnet. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des
              jeweiligen Autors bzw. Erstellers. Dies gilt insbesondere für den Item-Pool, die 12 Archetypen,
              die Scoring-Logik und die Reports.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
