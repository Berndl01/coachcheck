import Link from 'next/link';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

// Anonymisierter Beispiel-Datensatz (kein realer Trainer).
const AXES = [
  { low: 'Intuitiv', high: 'Strukturiert', v: 0.82 },
  { low: 'Beteiligend', high: 'Autoritär', v: 0.64 },
  { low: 'Beziehungsorientiert', high: 'Leistungsorientiert', v: 0.58 },
  { low: 'Stabilisierend', high: 'Aktivierend', v: 0.41 },
  { low: 'Direkt', high: 'Reflektiert', v: 0.69 },
  { low: 'Anpassend', high: 'Standardisierend', v: 0.77 },
];

const MATURITY = [
  { label: 'Selbstregulation', v: 0.72, band: 'deutlich ausgeprägt' },
  { label: 'Perspektivflexibilität', v: 0.48, band: 'im mittleren Bereich' },
  { label: 'Konfliktreife', v: 0.55, band: 'im mittleren Bereich' },
  { label: 'Druckreife', v: 0.7, band: 'deutlich ausgeprägt' },
  { label: 'Verantwortungsklarheit', v: 0.84, band: 'deutlich ausgeprägt' },
  { label: 'Integrationsfähigkeit', v: 0.52, band: 'im mittleren Bereich' },
];

const MODULES = [
  { code: 'A', title: 'Führungsidentität', text: 'Ein klar konturiertes Selbstbild: Du weißt, wofür du stehst, und führst über erkennbare Prinzipien statt über situative Impulse. Die wache Stelle liegt in der Wirkungstransparenz — wie deine Klarheit bei unterschiedlichen Spielertypen ankommt.' },
  { code: 'B', title: 'Kommunikation', text: 'Du kommunizierst strukturiert und orientierungsstark. Unter Druck verdichtet sich deine Sprache — präzise, aber zunehmend einseitig gesendet statt dialogisch.' },
  { code: 'C', title: 'Entscheidung', text: 'Hohe Entschlusskraft mit Hang zur Sorgfalt. Du triffst Entscheidungen nachvollziehbar; in mehrdeutigen Lagen kann das Abwägen die Geschwindigkeit kosten.' },
  { code: 'D', title: 'Fehlerkultur', text: 'Fehler sind für dich Bearbeitungsanlass, nicht Bedrohung. Die Frage ist, ob deine Spieler das auch so erleben — oder ob deine Standards Mut leise ausbremsen.' },
  { code: 'E', title: 'Führung unter Druck', text: 'Du hältst deine Grundlinie auch unter Belastung. Das Kippmuster: aus Struktur wird Kontrolle, sobald Unsicherheit steigt.' },
  { code: 'F', title: 'Motivation', text: 'Du motivierst über Ziele und Fortschritt. Der Hebel liegt darin, neben Kompetenz auch Zugehörigkeit und echten Handlungsspielraum sichtbar zu machen.' },
  { code: 'G', title: 'Beziehung', text: 'Vertrauen entsteht bei dir über wiederholbare Qualität und Verlässlichkeit. Randspieler brauchen von dir explizitere Rollenklärung, um deine Fairness zu erleben.' },
];

function Page({ kicker, children, tone = 'light' }: { kicker: string; children: React.ReactNode; tone?: 'light' | 'dark' | 'petrol' }) {
  const bg = tone === 'dark' ? 'bg-ink text-bone' : tone === 'petrol' ? 'bg-petrol text-bone' : 'bg-bone text-ink';
  return (
    <div className={`${bg} rounded-lg shadow-sm border border-bone-line/40 px-6 md:px-12 py-10 md:py-14`}>
      <div className={`font-mono text-[0.62rem] uppercase tracking-[0.2em] mb-6 flex items-center gap-3 ${tone === 'light' ? 'text-gold-deep' : 'text-gold'}`}>
        <span className={`w-8 h-px ${tone === 'light' ? 'bg-gold' : 'bg-gold'}`} /> {kicker}
      </div>
      {children}
    </div>
  );
}

export default async function MusterberichtPage() {
  const t = await getT();
  return (
    <>
      <TopNav />
      <main className="bg-bone-soft">
        {/* Banner */}
        <div className="bg-gold/15 border-b border-gold/30 px-4 md:px-8 py-3">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-gold-deep">
              {t('musterbericht.bannerTag')}
            </span>
            <div className="flex items-center gap-4">
              <a
                href="/beispiel-coachcheck-report.pdf"
                download="CoachCheck-Beispielreport.pdf"
                className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ink underline underline-offset-4"
              >
                {t('musterbericht.downloadPdf')}
              </a>
              <Link href="/#products" className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ink underline underline-offset-4">
                {t('musterbericht.startOwn')}
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-16 space-y-6">
          {/* Cover */}
          <Page kicker="CoachCheck · Premium-Report" tone="petrol">
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-gold mb-3">Primärer Archetyp</div>
            <h1 className="font-display font-light text-[clamp(2.4rem,6vw,4rem)] leading-[1.02] tracking-[-0.035em] mb-3" style={{ fontVariationSettings: "'opsz' 144" }}>
              Der Strategische Architekt
            </h1>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-bone-soft mb-6">Struktur · Planung · Spielidee</p>
            <p className="font-editorial italic text-xl leading-[1.5] max-w-[54ch] text-bone-soft">
              Ein Trainer, der Wirkung über Ordnung erzeugt — und dessen größte Entwicklung
              darin liegt, Klarheit anschlussfähig zu halten.
            </p>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-gold-light/80 mt-6">
              Methodik: wissenschaftlich anschlussfähig an etablierte sportpsychologische Konstrukte · evidenz-gemappt
            </p>
            <div className="mt-8 pt-6 border-t border-bone/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[0.78rem]">
              <div><div className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-gold mb-1">Sport</div>Fußball</div>
              <div><div className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-gold mb-1">Niveau</div>Ambitionierter Amateur</div>
              <div><div className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-gold mb-1">Sekundärtyp</div>Konsequenter Standardsetzer</div>
              <div><div className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-gold mb-1">Seiten</div>ab 12</div>
            </div>
          </Page>

          {/* Executive Summary + Signatur */}
          <Page kicker="01 — Executive Summary">
            <p className="text-[1.05rem] leading-[1.65] mb-8">
              Dein Profil zeigt einen strukturstarken, prinzipiengeleiteten Führungsstil mit
              klarer Verantwortungsarchitektur. Die markanteste Spannung: Deine größte Stärke —
              Orientierung durch Struktur — ist zugleich dein Risiko, wenn unter Druck aus
              Struktur Kontrolle wird. Genau an dieser Schwelle entscheidet sich, ob dein Team
              dich als Sicherheit gebend oder als einengend erlebt.
            </p>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-gold-deep mb-4">Deine 6 Kernachsen</div>
            <div className="grid gap-4">
              {AXES.map((a) => (
                <div key={a.high} className="grid gap-1.5">
                  <div className="flex justify-between font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                    <span>{a.low}</span>
                    <span className="text-gold-deep font-medium">{Math.round(a.v * 100)} %</span>
                    <span>{a.high}</span>
                  </div>
                  <div className="relative h-1 bg-bone-line rounded">
                    <span className="absolute top-1/2 w-2.5 h-2.5 bg-gold rounded-full -translate-y-1/2 -translate-x-1/2" style={{ left: `${a.v * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Page>

          {/* Paradoxien + Shadow */}
          <Page kicker="02 — Signatur & Paradoxien">
            <h2 className="font-display font-light text-[1.9rem] leading-[1.1] tracking-[-0.02em] mb-6" style={{ fontVariationSettings: "'opsz' 144" }}>
              Gute Führung ist immer paradox.
            </h2>
            <div className="space-y-3 mb-8">
              {[
                'Hohe Klarheit, aber begrenzte Anschlussfähigkeit unter Druck.',
                'Starke Verlässlichkeit, aber wenig sichtbare Beteiligung in Krisen.',
                'Konsequente Standards, aber Mut der Spieler wird leise ausgebremst.',
              ].map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-display text-gold text-lg leading-none mt-1">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-[0.98rem] leading-[1.5]">{p}</p>
                </div>
              ))}
            </div>
            <div className="bg-bone-soft border-l-[3px] border-gold p-5">
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-gold-deep mb-2">Dein Kippmuster</div>
              <p className="text-[0.95rem] leading-[1.55]">
                Das Schattenmuster liegt nicht in mangelnder Führung, sondern in der Verengung
                unter steigender Unsicherheit. Was im Alltag als Struktur wirkt, wird unter
                Druck als erhöhte Kontrolle erlebt — die Beteiligung sinkt genau dann, wenn sie
                am meisten gebraucht würde.
              </p>
            </div>
          </Page>

          {/* Entwicklungsindikatoren */}
          <Page kicker="03 — Entwicklungsindikatoren">
            <p className="text-muted text-[0.92rem] leading-[1.55] mb-3 max-w-[58ch]">
              Diese sechs Dimensionen zeigen, wie stark bestimmte Muster in den Antworten
              ausgeprägt sind — als Anstoß zur Reflexion, nicht als Bewertung.
            </p>
            <p className="text-muted/80 text-[0.78rem] leading-[1.5] mb-8 max-w-[58ch] border-l-2 border-bone-line pl-3">
              Hinweis: ein Reflexionsraster aus den Antworten — kein normiertes, validiertes
              Reifemaß.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
              {MATURITY.map((m) => (
                <div key={m.label} className="grid gap-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-[1rem] tracking-[-0.01em]">{m.label}</span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-gold-deep">{m.band}</span>
                  </div>
                  <div className="relative h-1 bg-bone-line rounded">
                    <span className="absolute top-0 left-0 h-1 bg-gold rounded" style={{ width: `${m.v * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Page>

          {/* Module */}
          <Page kicker="04 — Die 7 Module">
            <div className="space-y-6">
              {MODULES.map((m) => (
                <div key={m.code} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="font-display text-2xl text-gold leading-none" style={{ fontVariationSettings: "'opsz' 144" }}>{m.code}</span>
                  <div>
                    <div className="font-display text-[1.05rem] font-medium mb-1">{m.title}</div>
                    <p className="text-[0.9rem] leading-[1.5] text-ink/80">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Page>

          {/* Entwicklungsprogramm */}
          <Page kicker="05 — Entwicklungsprogramm" tone="dark">
            <h2 className="font-display font-light text-[1.9rem] leading-[1.1] tracking-[-0.02em] mb-4" style={{ fontVariationSettings: "'opsz' 144" }}>
              Was du konkret entwickeln kannst.
            </h2>
            <p className="text-bone-soft text-[0.92rem] leading-[1.55] mb-8 max-w-[58ch] opacity-90">
              Profilbasiert ausgewählte, evidenzbasierte Bausteine — übersetzt in beobachtbares
              Verhalten für drei Horizonte.
            </p>
            {[
              { h: '14 Tage — Sofort', items: ['Gib innerhalb deiner Struktur bewusst eine Freiheitszone frei: eine variable Aufgabe pro Einheit, die deine Spieler selbst lösen.', 'Setze vor Ansagen unter Druck einen kurzen Reset — erst Emotion kanalisieren, dann klar führen.'] },
              { h: '30 Tage — Routinen', items: ['Etabliere ein Arbeitsbündnis-Check-in mit zwei Schlüsselspielern: Was brauchst du von mir, was ich von dir?', 'Trainiere einen Fehlerkultur-Reset, der Klarheit erzeugt statt Widerstand.'] },
              { h: '90 Tage — Struktur', items: ['Baue eine Leadership-Rollenmatrix auf, damit Verantwortung nicht nur an wenigen hängt.'] },
            ].map((b) => (
              <div key={b.h} className="mb-6">
                <div className="font-display text-[1.15rem] mb-3 text-gold">{b.h}</div>
                <ul className="space-y-2.5">
                  {b.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-3 text-[0.92rem] leading-[1.5]">
                      <span className="text-gold mt-[2px]">→</span>
                      <span className="text-bone-soft">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="border-t border-bone/15 pt-4 mt-2">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-bone-soft opacity-70">
                Theoriegeleitete Coaching-Hypothesen auf Basis evidenzbasierter Methodik — keine Diagnose.
              </p>
            </div>
          </Page>

          {/* CTA */}
          <div className="text-center py-8">
            <h3 className="font-display text-3xl tracking-[-0.02em] mb-3">{t('musterbericht.ctaTitle')}</h3>
            <p className="font-editorial italic text-lg text-muted mb-8 max-w-[44ch] mx-auto">
              {t('musterbericht.ctaText')}
            </p>
            <Link href="/#products" className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink rounded-full font-semibold hover:bg-ink hover:text-gold transition">
              {t('musterbericht.ctaButton')} <span className="font-mono">→</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
