import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';

const AXIS_LABELS: Record<string, { low: string; high: string }> = {
  struktur_intuition: { low: 'Intuitiv', high: 'Strukturiert' },
  autoritaet_beteiligung: { low: 'Beteiligend', high: 'Autoritär' },
  leistung_beziehung: { low: 'Beziehungsorientiert', high: 'Leistungsorientiert' },
  stabilisierung_aktivierung: { low: 'Stabilisierend', high: 'Aktivierend' },
  reflexion_direktheit: { low: 'Direkt', high: 'Reflektiert' },
  standardisierung_anpassung: { low: 'Anpassend', high: 'Standardisierend' },
};

const AXIS_ORDER = [
  'struktur_intuition',
  'autoritaet_beteiligung',
  'leistung_beziehung',
  'stabilisierung_aktivierung',
  'reflexion_direktheit',
  'standardisierung_anpassung',
];

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: assessment } = await supabase
    .from('assessments')
    .select('*, product:products(*), primary:primary_archetype_id(*), secondary:secondary_archetype_id(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!assessment || (assessment.status !== 'report_ready' && assessment.status !== 'completed' && assessment.status !== 'archived')) {
    redirect(`/assessment/${id}`);
  }

  const primary = assessment.primary as any;
  const secondary = assessment.secondary as any;
  const axisScores = assessment.axis_scores as Record<string, number>;

  return (
    <>
      <TopNav />
      <main>
        {/* Hero */}
        <section className="bg-petrol text-bone py-16 md:py-24 px-4 md:px-8 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top right, rgba(179, 142, 69, 0.15), transparent 50%)' }}
          />
          <div className="max-w-4xl mx-auto relative">
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-gold-light mb-6">
              Dein Ergebnis · {assessment.product?.name_de}
            </div>

            {primary && (
              <>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-3">
                  Primärer Archetyp
                </div>
                <h1
                  className="font-display font-light text-[clamp(2.6rem,6vw,5rem)] leading-[1.02] tracking-[-0.035em] mb-4"
                  style={{ fontVariationSettings: "'opsz' 144" }}
                >
                  {primary.name_de}
                </h1>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-bone-soft mb-8">
                  {primary.short_trait}
                </p>
                <p className="font-editorial italic text-xl leading-[1.5] max-w-[58ch] text-bone-soft">
                  {primary.kernmuster}
                </p>

                {secondary && (
                  <div className="mt-8 pt-8 border-t border-bone/10">
                    <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-2">
                      Sekundärer Archetyp
                    </div>
                    <div
                      className="font-display text-2xl font-normal tracking-[-0.02em]"
                      style={{ fontVariationSettings: "'opsz' 144" }}
                    >
                      {secondary.name_de}
                    </div>
                    <div className="font-mono text-xs uppercase tracking-[0.12em] text-bone-soft mt-1">
                      {secondary.short_trait}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Axis Profile */}
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
            <span className="w-10 h-px bg-ink" /> Funktionale Signatur
          </div>
          <h2
            className="font-display font-light text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.05] tracking-[-0.03em] mb-10"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            Deine 6 Kernachsen.
          </h2>

          <div className="grid gap-5">
            {AXIS_ORDER.map((axis) => {
              const value = axisScores?.[axis] ?? 0.5;
              const labels = AXIS_LABELS[axis];
              return (
                <div key={axis} className="grid gap-2">
                  <div className="flex justify-between font-mono text-xs uppercase tracking-[0.1em] text-muted">
                    <span>{labels.low}</span>
                    <span className="text-gold-deep font-medium">{Math.round(value * 100)} %</span>
                    <span>{labels.high}</span>
                  </div>
                  <div className="relative h-1 bg-bone-line rounded">
                    <span
                      className="absolute top-1/2 w-3 h-3 bg-gold rounded-full -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${value * 100}%`, boxShadow: '0 0 0 3px var(--bone), 0 6px 16px rgba(179, 142, 69, 0.4)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Strengths, Risks, Hebel */}
        {primary && (
          <section className="bg-bone-soft py-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-bone rounded-md border border-bone-line">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold-deep mb-4">
                  Stärken
                </div>
                <ul className="space-y-2">
                  {(primary.staerken ?? []).map((s: string, i: number) => (
                    <li key={i} className="text-sm leading-[1.5] pl-4 relative">
                      <span className="absolute left-0 text-gold">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-bone rounded-md border border-bone-line">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold-deep mb-4">
                  Risiken
                </div>
                <ul className="space-y-2">
                  {(primary.risiken ?? []).map((r: string, i: number) => (
                    <li key={i} className="text-sm leading-[1.5] pl-4 relative">
                      <span className="absolute left-0 text-gold">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-ink text-bone rounded-md">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-4">
                  Entwicklungshebel
                </div>
                <ul className="space-y-2">
                  {(primary.entwicklungshebel ?? []).map((h: string, i: number) => (
                    <li key={i} className="text-sm leading-[1.5] pl-4 relative text-bone-soft">
                      <span className="absolute left-0 text-gold">→</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Next steps */}
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center">
          <h3 className="font-display text-3xl tracking-[-0.02em] mb-3">
            Was kommt als Nächstes?
          </h3>
          <p className="font-editorial italic text-lg text-muted mb-8 max-w-[50ch] mx-auto">
            Der vollständige 24-seitige Premium-Report wird in Phase 4 automatisch
            generiert — mit Consulting-Interpretationen zu jedem Modul, Druckprofil,
            Gap-Analysen und Gesprächsleitfäden.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard" className="px-6 py-3 border border-ink text-ink rounded-full font-semibold hover:bg-ink hover:text-bone transition">
              Zum Dashboard
            </Link>
            <Link href="/#products" className="px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-ink hover:text-gold transition">
              Nächstes Paket: 360° Spiegel →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
