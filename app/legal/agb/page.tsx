import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'AGB · CoachCheck',
};

// TopNav liest die Server-Side Supabase-Session aus Cookies — daher muss
// die Seite dynamisch gerendert werden, sonst hängt der Build im
// "Collecting page data"-Schritt.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Mail = () => (
  <a href="mailto:office@humatrix.cc" className="text-gold-deep underline">office@humatrix.cc</a>
);

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
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 1 Anbieter & Geltungsbereich</h2>
            <p>
              (1) Anbieter ist <strong>Humatrix by Bernhard Lampl</strong>, Mag. Bernhard Lampl, PhD,
              Ried 80, 6363 Westendorf, Tirol, Österreich (im Folgenden „Anbieter&ldquo;). Kontakt: <Mail />,
              Tel. +43 676 916 60 20.
            </p>
            <p className="mt-3">
              (2) Diese AGB gelten für alle Verträge zwischen dem Anbieter und seinen Kundinnen und
              Kunden (im Folgenden „Kunde&ldquo;) über die Plattform <em>coachcheck.humatrix.cc</em> und die
              dort angebotenen Produkte. Maßgeblich ist die zum Zeitpunkt der Bestellung gültige Fassung.
            </p>
            <p className="mt-3">
              (3) Abweichende Bedingungen des Kunden gelten nur, wenn sie ausdrücklich schriftlich
              bestätigt wurden.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 2 Vertragsgegenstand & Leistungen</h2>
            <p>
              (1) Der Anbieter stellt digitale Trainer-Assessment- und Entwicklungsprodukte bereit.
              Angeboten werden insbesondere: <strong>Schnelltest</strong>, <strong>Selbsttest</strong>,
              <strong> 360° Spiegel</strong>, <strong>TeamCheck</strong> und <strong>Saison & Beratung</strong>.
              Konkreter Umfang und Preis ergeben sich aus der jeweiligen Produktseite zum Zeitpunkt der
              Bestellung.
            </p>
            <p className="mt-3">
              (2) <strong>Rein digitale Produkte</strong> (Schnelltest, Selbsttest, 360° Spiegel) bestehen
              aus Online-Fragebogen, automatisierter Auswertung und einem als PDF erstellten Report.
            </p>
            <p className="mt-3">
              (3) <strong>Produkte mit persönlicher Begleitung</strong> (TeamCheck, Saison & Beratung)
              umfassen zusätzlich menschliche Beratungsleistungen (z. B. Auswertungs-Calls, laufende
              Begleitung). Diese werden nach Vertragsschluss individuell terminlich vereinbart und setzen
              die Mitwirkung des Kunden voraus.
            </p>
            <p className="mt-3">
              (4) Die Reports sind eine <strong>Standortbestimmung und ein Entwicklungsimpuls auf
              wissenschaftlicher Basis</strong> — ausdrücklich <strong>keine psychologische, medizinische
              oder klinische Diagnose</strong> und keine Erfolgsgarantie. Sie ersetzen keine individuelle
              fachliche oder ärztliche Beratung.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 3 Registrierung & Kundenkonto</h2>
            <p>
              (1) Für die Nutzung ist ein Kundenkonto erforderlich. Der Kunde stellt sicher, dass seine
              Angaben richtig und aktuell sind, und hält seine Zugangsdaten geheim.
            </p>
            <p className="mt-3">
              (2) Das Angebot richtet sich an volljährige Personen. Mit der Registrierung bestätigt der
              Kunde, das 18. Lebensjahr vollendet zu haben.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 4 Vertragsschluss</h2>
            <p>
              (1) Die Darstellung der Produkte ist eine Aufforderung zur Bestellung. Mit Absenden der
              kostenpflichtigen Bestellung gibt der Kunde ein verbindliches Angebot ab.
            </p>
            <p className="mt-3">
              (2) Bei rein digitalen Produkten kommt der Vertrag mit erfolgreicher Zahlung und Freischaltung
              zustande. Bei Produkten mit persönlicher Begleitung kann dem Kauf eine Anfrage vorausgehen;
              der Vertrag kommt mit ausdrücklicher Auftragsbestätigung bzw. erfolgreicher Zahlung zustande.
            </p>
            <p className="mt-3">
              (3) Vor Abschluss kann der Kunde die AGB einsehen; mit der Bestellung erkennt er sie an.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 5 Preise & Zahlung</h2>
            <p>
              (1) Es gelten die im Checkout angezeigten Preise als Endpreise in Euro. Eine etwaige
              Umsatzsteuer ist – soweit anwendbar – im angezeigten Endpreis enthalten.
            </p>
            <p className="mt-3">
              (2) Die Zahlung erfolgt über Stripe (Stripe Payments Europe, Ltd.) per Kreditkarte.
              Der Anbieter speichert keine vollständigen Zahlungsdaten.
            </p>
            <p className="mt-3">
              (3) Nach Zahlungseingang erhält der Kunde eine Bestellbestätigung auf einem dauerhaften
              Datenträger (E-Mail) mit allen Bestell- und Vertragsdaten. Eine formelle Rechnung stellt
              der Anbieter auf Anfrage unter office@humatrix.cc bereit. Der Kunde stimmt der
              elektronischen Übermittlung dieser Belege zu.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 6 Leistungserbringung & Mitwirkung</h2>
            <p>
              (1) Digitale Produkte werden unmittelbar nach Zahlung freigeschaltet. Der Report wird nach
              Abschluss des Fragebogens automatisiert erstellt und bereitgestellt.
            </p>
            <p className="mt-3">
              (2) Bei Produkten mit persönlicher Begleitung wirkt der Kunde an der Terminfindung mit.
              Vereinbarte Termine, die der Kunde nicht rechtzeitig (mind. 24 Stunden vorab) absagt, gelten
              als erbracht.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 7 Widerrufsrecht für Verbraucher</h2>
            <div className="bg-bone-soft border-l-2 border-gold pl-4 py-3 mb-4">
              <p className="font-semibold mb-1">Widerrufsbelehrung</p>
              <p>
                Verbraucher haben nach dem Fern- und Auswärtsgeschäfte-Gesetz (FAGG) das Recht, binnen
                <strong> 14 Tagen</strong> ohne Angabe von Gründen zu widerrufen. Die Frist beginnt mit
                Vertragsschluss. Zur Ausübung genügt eine eindeutige Erklärung (z. B. per E-Mail an <Mail /> oder
                über die <a href="/widerruf" className="text-gold-deep underline">Online-Widerrufsfunktion</a>).
                Zur Fristwahrung reicht die rechtzeitige Absendung.
              </p>
            </div>
            <p>
              (1) <strong>Digitale Inhalte (Schnelltest, Selbsttest, 360° Spiegel):</strong> Der Kunde
              verlangt ausdrücklich, dass mit der Ausführung vor Ablauf der Widerrufsfrist begonnen wird,
              und nimmt zur Kenntnis, dass er sein Widerrufsrecht damit verliert, sobald die Ausführung
              begonnen hat (Start des Assessments bzw. Erstellung des Reports) — § 18 Abs 1 Z 11 FAGG.
            </p>
            <p className="mt-3">
              (2) <strong>Dienstleistungen (TeamCheck, Saison & Beratung):</strong> Beginnt die
              Beratungsleistung auf ausdrücklichen Wunsch des Kunden vor Ablauf der Widerrufsfrist, schuldet
              der Kunde bei Widerruf einen anteiligen Betrag für die bereits erbrachte Leistung (§ 16 FAGG).
              Nach vollständiger Erbringung erlischt das Widerrufsrecht (§ 18 Abs 1 Z 1 FAGG).
            </p>
            <p className="mt-3">
              (3) Wird mit der Ausführung noch nicht begonnen, kann der Vertrag binnen 14 Tagen widerrufen
              werden; bereits geleistete Zahlungen werden unverzüglich erstattet.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 8 Nutzungsrechte & geistiges Eigentum</h2>
            <p>
              (1) Der Kunde erhält ein einfaches, nicht übertragbares Nutzungsrecht am Report für eigene
              Zwecke (Reflexion, Coaching, Team- und Vereinsentwicklung).
            </p>
            <p className="mt-3">
              (2) Methodik, Archetypen, Item-Pool, Wissensdatenbank und Software bleiben geistiges Eigentum
              des Anbieters. Weitergabe, Veröffentlichung, Vervielfältigung oder kommerzielle Verwertung
              über den eigenen Gebrauch hinaus ist ohne Zustimmung unzulässig.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 9 Haftung & Hinweis</h2>
            <p>
              (1) Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei
              Verletzung von Leben, Körper oder Gesundheit.
            </p>
            <p className="mt-3">
              (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur für die Verletzung wesentlicher
              Vertragspflichten und beschränkt auf den vertragstypisch vorhersehbaren Schaden.
            </p>
            <p className="mt-3">
              (3) Die Reports sind eine Orientierung. Entscheidungen, die der Kunde auf ihrer Basis trifft,
              liegen in seiner Verantwortung.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 10 Verfügbarkeit & Änderungen</h2>
            <p>
              (1) Der Anbieter ist um durchgängige Verfügbarkeit bemüht; eine ununterbrochene Verfügbarkeit
              wird nicht garantiert (Wartung, höhere Gewalt).
            </p>
            <p className="mt-3">
              (2) Änderungen dieser AGB werden bestehenden Kunden mindestens 30 Tage vor Wirksamkeit
              mitgeteilt. Bereits abgeschlossene Käufe bleiben von Änderungen unberührt.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 11 Streitbeilegung</h2>
            <p>
              Der Anbieter ist nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor
              einer Verbraucherschlichtungsstelle teilzunehmen. Anliegen können jederzeit direkt an
              office@humatrix.cc gerichtet werden; wir bemühen uns um eine einvernehmliche Lösung.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">§ 12 Schlussbestimmungen</h2>
            <p>
              (1) Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Zwingende
              Verbraucherschutzbestimmungen des Wohnsitzstaates des Verbrauchers bleiben unberührt.
            </p>
            <p className="mt-3">
              (2) Gerichtsstand ist Kitzbühel, soweit der Kunde Unternehmer ist. Bei Verbrauchern gelten die
              gesetzlichen Regelungen.
            </p>
            <p className="mt-3">
              (3) Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen unberührt.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Muster-Widerrufsformular</h2>
            <p className="text-muted text-sm">
              (Wenn Sie den Vertrag widerrufen wollen, füllen Sie dieses Formular aus und senden Sie es an <Mail />.)
            </p>
            <div className="bg-bone-soft rounded-md p-4 mt-3 font-mono text-[0.8rem] leading-[1.7] text-ink">
              An Humatrix by Bernhard Lampl, Ried 80, 6363 Westendorf, Österreich, <Mail />:<br />
              Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über folgendes Produkt: ____________<br />
              Bestellt am / erhalten am: ____________<br />
              Name des/der Verbraucher(s): ____________<br />
              Anschrift: ____________<br />
              Datum / Unterschrift (nur bei Mitteilung auf Papier): ____________
            </div>
          </section>

          <p className="text-muted text-sm pt-4">Stand: 18. Juni 2026.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
