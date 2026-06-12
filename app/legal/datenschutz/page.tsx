import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'Datenschutz · Humatrix Coach',
};

// TopNav liest die Server-Side Supabase-Session aus Cookies — daher muss
// die Seite dynamisch gerendert werden, sonst hängt der Build im
// "Collecting page data"-Schritt.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function DatenschutzPage() {
  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-16">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          Rechtliches · DSGVO
        </div>
        <h1 className="font-display text-5xl tracking-[-0.03em] mb-12">Datenschutzerklärung</h1>

        <p className="font-editorial italic text-lg text-muted mb-12 leading-[1.5]">
          Kurz &amp; ehrlich: Wir wollen kein Datenvermögen aufbauen. Wir speichern nur was wir brauchen,
          um dir einen Coach-Report zu liefern. Fremdeinschätzungen werden dem Trainer ausschließlich
          aggregiert angezeigt — Einzelantworten sind für Trainer nicht abrufbar. Zur sicheren Einladung
          und Zuordnung werden technische Einmal-Tokens verarbeitet; administrative Zugriffe auf
          Rohdaten sind technisch und organisatorisch beschränkt.
        </p>

        <div className="space-y-10 text-ink leading-[1.6]">
          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">1. Verantwortlicher</h2>
            <p>
              Humatrix by Bernhard Lampl · Mag. Bernhard Lampl, PhD<br />
              Ried 80 · 6363 Westendorf · Tirol, Österreich<br />
              <a href="mailto:office@humatrix.cc" className="text-gold-deep hover:underline">office@humatrix.cc</a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">2. Welche Daten wir verarbeiten</h2>
            <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-4 mb-2">Account-Daten</h3>
            <p>
              E-Mail-Adresse, Passwort (gehasht), optional Name, Sport und Verein. Zweck: Authentifizierung,
              Zuordnung deiner Assessments und Reports.
            </p>

            <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-4 mb-2">Assessment-Antworten</h3>
            <p>
              Deine Antworten auf die Items der Assessment-Pakete. Zweck: Generierung deines
              personalisierten Trainer-Profils und Reports.
            </p>

            <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-4 mb-2">360°-Fremdeinschätzungen</h3>
            <p>
              Antworten von Personen, denen du einen Einladungslink geschickt hast. Diese werden
              <strong> anonymisiert und ausschließlich aggregiert</strong> ausgewertet — und erst
              ab mindestens 3 vollständigen Einschätzungen sichtbar. Der eingeloggte Trainer
              sieht zu keiner Zeit eine einzelne Antwort. Zur sicheren Zuordnung der Einladung
              wird ein technischer Einmal-Token verarbeitet; er wird nicht mit dem
              Aggregat-Output verknüpft.
            </p>

            <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-4 mb-2">TeamCheck &amp; Pulse-Umfragen</h3>
            <p>
              Antworten von Spielern werden <strong>anonymisiert und nur aggregiert</strong>
              {' '}ausgewertet (ab mindestens 5 vollständigen Antworten). Die App speichert
              keine Spieler-E-Mail-Adressen — Spieler erhalten ihren Link über vom Trainer
              selbst gewählte Wege (QR, WhatsApp, Slack, Aushang). Zur sicheren Zuordnung
              wird ein technischer Token pro Antwort verarbeitet; einzelne Antwortzeilen
              sind für den Trainer technisch nicht abrufbar.
            </p>

            <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-4 mb-2">Zahlungsdaten</h3>
            <p>
              Zahlungsabwicklung erfolgt ausschließlich über Stripe (Stripe Payments Europe, Ltd.,
              Irland). Wir selbst speichern keine Kreditkartendaten. Nur die Transaktions-ID und der
              Produktkauf werden mit deinem Account verknüpft.
            </p>

            <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-4 mb-2">Technische Daten</h3>
            <p>
              Beim Aufruf unserer Seiten werden technisch notwendige Daten verarbeitet (IP-Adresse,
              Browser-Typ, Zeitstempel). Diese werden nach 14 Tagen automatisch gelöscht.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">3. Rechtsgrundlagen</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — Vertragserfüllung (Report-Erstellung)</li>
              <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — berechtigtes Interesse (technisch notwendige Logs)</li>
              <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — Einwilligung (z.B. Cookie-Banner, Newsletter)</li>
              <li><strong>Art. 6 Abs. 1 lit. c DSGVO</strong> — gesetzliche Aufbewahrungsfristen (Rechnungen)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">4. Dienstleister (Auftragsverarbeiter)</h2>
            <div className="grid gap-4">
              <div className="p-4 bg-bone-soft rounded-md border border-bone-line">
                <div className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep mb-1">Hosting / Datenbank</div>
                <div className="font-medium">Supabase (EU-Region, Frankfurt)</div>
                <div className="text-sm text-muted">User-Accounts, Assessment-Daten, Reports.</div>
              </div>
              <div className="p-4 bg-bone-soft rounded-md border border-bone-line">
                <div className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep mb-1">Deployment / Edge-Netzwerk</div>
                <div className="font-medium">Vercel Inc. (USA, mit EU-Datenverarbeitung)</div>
                <div className="text-sm text-muted">Auslieferung der Website, Server-seitige Render-Funktionen.</div>
              </div>
              <div className="p-4 bg-bone-soft rounded-md border border-bone-line">
                <div className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep mb-1">AI-Analyse</div>
                <div className="font-medium">Anthropic PBC (USA)</div>
                <div className="text-sm text-muted">Generierung der Report-Texte über die Claude-API. Anthropic nutzt die Daten nicht zum Training.</div>
              </div>
              <div className="p-4 bg-bone-soft rounded-md border border-bone-line">
                <div className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep mb-1">E-Mail-Versand</div>
                <div className="font-medium">Resend Inc. (USA, EU-Region verfügbar)</div>
                <div className="text-sm text-muted">Einladungs-E-Mails, Report-Links.</div>
              </div>
              <div className="p-4 bg-bone-soft rounded-md border border-bone-line">
                <div className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep mb-1">Zahlungsabwicklung</div>
                <div className="font-medium">Stripe Payments Europe, Ltd. (Irland)</div>
                <div className="text-sm text-muted">Kreditkarten und SEPA-Lastschrift.</div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">5. Übermittlung in Drittländer (USA)</h2>
            <p>
              Einzelne Dienstleister verarbeiten Daten (auch) in den USA: Vercel (Auslieferung),
              Anthropic (KI-Generierung der Report-Texte) und Resend (E-Mail). Dabei werden – soweit
              für die Report-Erstellung erforderlich – auch deine Assessment-Antworten und Score-Werte
              an Anthropic übermittelt.
            </p>
            <p className="mt-3">
              Die Übermittlung erfolgt auf Grundlage von Art. 44 ff. DSGVO, abgesichert durch
              EU-Standardvertragsklauseln (SCCs) bzw. – soweit zertifiziert – das EU-US Data Privacy
              Framework. Anthropic nutzt die übermittelten Inhalte nicht zum Training seiner Modelle.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">6. Speicherdauer</h2>
            <p>
              <strong>Account + Reports:</strong> Solange dein Account besteht, plus 30 Tage nach Löschung.<br />
              <strong>Rechnungen:</strong> 7 Jahre (gesetzlich verpflichtend).<br />
              <strong>Aggregierte Reports/Snapshots:</strong> solange der Account besteht.<br />
              <strong>Tokenbasierte Rohantworten (360°/TeamCheck/Pulse):</strong> nur solange für Auswertung, Support und Missbrauchsschutz erforderlich.<br />
              <strong>Technische Logs:</strong> 14 Tage.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">7. Deine Rechte</h2>
            <p>Du hast nach DSGVO jederzeit das Recht auf:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Auskunft (Art. 15)</li>
              <li>Berichtigung (Art. 16)</li>
              <li>Löschung (Art. 17)</li>
              <li>Einschränkung (Art. 18)</li>
              <li>Datenübertragbarkeit (Art. 20)</li>
              <li>Widerspruch (Art. 21)</li>
              <li>Widerruf erteilter Einwilligungen (Art. 7 Abs. 3)</li>
            </ul>
            <p className="mt-4">
              Schreib uns dazu jederzeit formlos an{' '}
              <a href="mailto:office@humatrix.cc" className="text-gold-deep hover:underline">office@humatrix.cc</a>.
              Wir antworten in der Regel innerhalb von 7 Tagen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">8. Beschwerderecht</h2>
            <p>
              Du kannst dich bei der österreichischen Datenschutzbehörde beschweren:{' '}
              <a href="https://www.dsb.gv.at" className="text-gold-deep hover:underline" target="_blank" rel="noopener noreferrer">
                dsb.gv.at
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">9. Cookies</h2>
            <p>
              Wir setzen nur technisch notwendige Cookies ein (Authentifizierung, Session).
              Keine Tracking-Cookies, keine Werbung, kein Retargeting.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">10. Automatisierte Verarbeitung</h2>
            <p>
              Die Report-Texte werden automatisiert mit KI-Unterstützung erstellt. Es findet
              <strong> keine automatisierte Entscheidung mit rechtlicher Wirkung</strong> im Sinne des
              Art. 22 DSGVO statt: Die Reports sind eine Standortbestimmung und ein Entwicklungsimpuls,
              keine verbindliche Bewertung deiner Person und keine Diagnose.
            </p>
          </section>

          <section className="pt-6 border-t border-bone-line">
            <p className="text-sm text-muted">
              Stand: Mai 2026. Änderungen dieser Erklärung werden an dieser Stelle veröffentlicht.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
