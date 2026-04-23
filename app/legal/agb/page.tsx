import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'AGB · Humatrix Coach',
};

export default function AGBPage() {
  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-16">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          Rechtliches
        </div>
        <h1 className="font-display text-5xl tracking-[-0.03em] mb-12">
          Allgemeine Geschäftsbedingungen
        </h1>

        <div className="space-y-10 text-ink leading-[1.6]">
          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 1 Geltungsbereich</h2>
            <p>
              (1) Diese AGB gelten für alle Verträge zwischen <strong>Humatrix by Bernhard Lampl</strong>,
              Mag. Bernhard Lampl, PhD, Ried 80, 6363 Westendorf, Tirol, Österreich (im Folgenden „Anbieter")
              und den Kunden (im Folgenden „Kunde") über die Nutzung der Plattform <em>coachcheck.humatrix.cc</em>
              und der dort angebotenen digitalen Produkte.
            </p>
            <p className="mt-3">
              (2) Abweichende Bedingungen des Kunden gelten nur, wenn sie ausdrücklich schriftlich
              bestätigt wurden.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 2 Vertragsgegenstand</h2>
            <p>
              (1) Der Anbieter stellt dem Kunden digitale Trainer-Assessment-Produkte zur Verfügung:
              Selbsttests, 360°-Spiegel, TeamCheck und Saison-Monitor. Umfang und Preis ergeben sich
              aus der Produktseite zum Zeitpunkt der Bestellung.
            </p>
            <p className="mt-3">
              (2) Die generierten Reports sind eine <strong>diagnostische Orientierung</strong>,
              keine psychologische oder medizinische Diagnose. Sie ersetzen keine individuelle
              fachliche Beratung.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 3 Vertragsschluss</h2>
            <p>
              (1) Der Vertrag kommt durch Bestellung des Kunden und Annahme durch den Anbieter zustande.
              Die Annahme erfolgt automatisch durch erfolgreiche Zahlung und Freischaltung des Produkts.
            </p>
            <p className="mt-3">
              (2) Vor Abschluss der Bestellung hat der Kunde die Möglichkeit, die AGB einzusehen und zu akzeptieren.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 4 Preise und Zahlung</h2>
            <p>
              (1) Alle Preise verstehen sich als Endpreise inklusive österreichischer Umsatzsteuer (soweit anwendbar).
            </p>
            <p className="mt-3">
              (2) Die Zahlung erfolgt über Stripe per Kreditkarte oder SEPA-Lastschrift. Der Anbieter speichert
              keine Zahlungsdaten. Die Transaktionsabwicklung unterliegt den AGB von Stripe Payments Europe, Ltd.
            </p>
            <p className="mt-3">
              (3) Rechnungen werden elektronisch als PDF bereitgestellt. Der Kunde akzeptiert den elektronischen
              Rechnungsversand.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 5 Widerrufsrecht & digitale Inhalte</h2>
            <div className="p-5 bg-bone-soft rounded-md border border-bone-line mb-3">
              <p>
                <strong>Widerrufsrecht für Verbraucher:</strong> Du hast nach dem Fern- und Auswärtsgeschäfte-Gesetz (FAGG)
                grundsätzlich 14 Tage Widerrufsrecht ab Vertragsschluss.
              </p>
              <p className="mt-3">
                <strong>Wichtige Einschränkung:</strong> Bei digitalen Inhalten, die nicht auf einem körperlichen
                Datenträger geliefert werden, erlischt das Widerrufsrecht sobald mit der Ausführung begonnen wurde und
                du dem ausdrücklich zugestimmt hast. Das ist bei uns der Fall, sobald dein Assessment gestartet oder
                ein Report generiert wurde (§ 18 Abs 1 Z 11 FAGG).
              </p>
            </div>
            <p>
              Wenn du dein Widerrufsrecht ausüben möchtest, schreib uns an{' '}
              <a href="mailto:office@humatrix.cc" className="text-gold-deep hover:underline">office@humatrix.cc</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 6 Nutzungsrechte</h2>
            <p>
              (1) Der Kunde erhält ein nicht-übertragbares, nicht-exklusives Nutzungsrecht am Report
              für eigene Zwecke (Reflexion, Coaching, Teamentwicklung).
            </p>
            <p className="mt-3">
              (2) Weitergabe, Veröffentlichung oder kommerzielle Verwertung des Reports, der Methodik,
              der Archetypen oder des Item-Pools ist nicht gestattet.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 7 Haftung</h2>
            <p>
              (1) Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei
              Verletzung von Leben, Körper oder Gesundheit.
            </p>
            <p className="mt-3">
              (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur für die Verletzung wesentlicher
              Vertragspflichten und beschränkt auf den vertragstypisch vorhersehbaren Schaden.
            </p>
            <p className="mt-3">
              (3) Die Reports sind diagnostische Orientierung. Entscheidungen, die auf Basis der
              Reports getroffen werden, liegen in der Verantwortung des Kunden.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 8 Datenschutz</h2>
            <p>
              Es gilt unsere <a href="/legal/datenschutz" className="text-gold-deep hover:underline">Datenschutzerklärung</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 9 Verfügbarkeit & Änderungen</h2>
            <p>
              (1) Der Anbieter ist bemüht, die Plattform durchgängig verfügbar zu halten. Eine
              ununterbrochene Verfügbarkeit kann nicht garantiert werden (Wartungsfenster, höhere Gewalt).
            </p>
            <p className="mt-3">
              (2) Der Anbieter behält sich vor, Produkt und AGB anzupassen. Bestehende Kunden werden
              mind. 30 Tage vor Wirksamkeit informiert.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 10 Schlussbestimmungen</h2>
            <p>
              (1) Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts.
            </p>
            <p className="mt-3">
              (2) Gerichtsstand ist Kitzbühel, soweit der Kunde Unternehmer ist. Bei Verbrauchern
              gelten die gesetzlichen Regelungen.
            </p>
            <p className="mt-3">
              (3) Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen unberührt.
            </p>
          </section>

          <section className="pt-6 border-t border-bone-line">
            <p className="text-sm text-muted">
              Stand: April 2026.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
