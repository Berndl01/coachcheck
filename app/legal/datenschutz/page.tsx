import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'Datenschutz · Humatrix Coach',
};

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
          Kurz & ehrlich: Wir wollen kein Datenvermögen aufbauen. Wir speichern nur was wir brauchen,
          um dir einen Coach-Report zu liefern. Anonyme Fremdeinschätzungen können wir technisch
          nicht auf Einzelpersonen zurückführen.
        </p>

        <div className="space-y-10 text-ink leading-[1.6]">
          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">1. Verantwortlicher</h2>
            <p>
              Humatrix GmbH · Musteradresse 1 · 6020 Innsbruck, Tirol, Österreich<br />
              <a href="mailto:hello@humatrix.cc" className="text-gold-deep hover:underline">hello@humatrix.cc</a>
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
              <strong> nicht personalisiert gespeichert</strong> — nur anonymisiert und nur ab mindestens
              3 Einschätzungen aggregiert ausgewertet.
            </p>

            <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-4 mb-2">TeamCheck & Pulse-Umfragen</h3>
            <p>
              Antworten von Spielern sind anonym und werden nur ab mindestens 5 Antworten aggregiert
              ausgewertet. Kein Name, keine IP, keine E-Mail der Spieler wird gespeichert.
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
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">5. Speicherdauer</h2>
            <p>
              <strong>Account + Reports:</strong> Solange dein Account besteht, plus 30 Tage nach Löschung.<br />
              <strong>Rechnungen:</strong> 7 Jahre (gesetzlich verpflichtend).<br />
              <strong>Anonyme Fremdeinschätzungen:</strong> Unbegrenzt, da anonym.<br />
              <strong>Technische Logs:</strong> 14 Tage.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">6. Deine Rechte</h2>
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
              <a href="mailto:privacy@humatrix.cc" className="text-gold-deep hover:underline">privacy@humatrix.cc</a>.
              Wir antworten in der Regel innerhalb von 7 Tagen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">7. Beschwerderecht</h2>
            <p>
              Du kannst dich bei der österreichischen Datenschutzbehörde beschweren:{' '}
              <a href="https://www.dsb.gv.at" className="text-gold-deep hover:underline" target="_blank" rel="noopener noreferrer">
                dsb.gv.at
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">8. Cookies</h2>
            <p>
              Wir setzen nur technisch notwendige Cookies ein (Authentifizierung, Session).
              Keine Tracking-Cookies, keine Werbung, kein Retargeting.
            </p>
          </section>

          <section className="pt-6 border-t border-bone-line">
            <p className="text-sm text-muted">
              Stand: April 2026. Änderungen dieser Erklärung werden an dieser Stelle veröffentlicht.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
