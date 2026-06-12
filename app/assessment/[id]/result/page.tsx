import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { ReportGenerateButton } from '@/components/assessment/report-generate-button';
import { ResultRecovery } from './recovery';
import { InvitationsManager } from '@/components/assessment/invitations-manager';
import { TeamcheckManager } from '@/components/assessment/teamcheck-manager';
import { ContextForm } from '@/components/assessment/context-form';
import { getReportSignedUrl } from '@/lib/pdf/storage';
import { buildInstantSignature } from '@/lib/insight/instant-signature';
import { buildProgressComparison } from '@/lib/insight/progress';
import { computeMaturityScores, MATURITY_KEYS, MATURITY_LABELS, type AxisScores } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

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

function maturityBand(v: number): { label: string; tone: string } {
  if (v >= 0.8) return { label: 'souverän', tone: 'text-gold-deep' };
  if (v >= 0.6) return { label: 'gefestigt', tone: 'text-gold-deep' };
  if (v >= 0.4) return { label: 'im Aufbau', tone: 'text-muted' };
  return { label: 'Entwicklungsfeld', tone: 'text-muted' };
}

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

  // Recovery-Guard (P2 #12): abgeschlossen markiert, aber Pflichtfelder fehlen
  // → klarer Recovery-Zustand statt weißer/kaputter Seite.
  const coreComplete =
    !!assessment.axis_scores &&
    !!assessment.primary_archetype_id &&
    !!assessment.secondary_archetype_id &&
    !!assessment.signature &&
    !!assessment.completed_at;

  if (!coreComplete) {
    return (
      <>
        <TopNav />
        <main className="min-h-[60vh] bg-bone">
          <ResultRecovery assessmentId={id} />
        </main>
        <Footer />
      </>
    );
  }

  // Existing report check
  const { data: existingReport } = await supabase
    .from('reports')
    .select('storage_path')
    .eq('assessment_id', id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let existingReportUrl: string | null = null;
  if (existingReport?.storage_path) {
    try {
      existingReportUrl = await getReportSignedUrl(existingReport.storage_path);
    } catch {
      existingReportUrl = null;
    }
  }

  // Load invitations (only relevant for tier 3+)
  const productTier = (assessment.product as any)?.tier ?? 0;
  const isThreeSixty = productTier >= 3;
  const isTeamcheck = productTier >= 4;

  let invitations: any[] = [];
  if (isThreeSixty) {
    const { data: invs } = await supabase
      .from('invitations')
      .select('*')
      .eq('parent_assessment_id', id)
      .eq('invitation_type', 'fremdbild')
      .order('created_at', { ascending: false });
    invitations = invs ?? [];
  }

  let teamInvitations: any[] = [];
  if (isTeamcheck) {
    const { data: invs } = await supabase
      .from('invitations')
      .select('*')
      .eq('parent_assessment_id', id)
      .eq('invitation_type', 'spieler')
      .order('created_at', { ascending: false });
    teamInvitations = invs ?? [];
  }

  const primary = assessment.primary as any;
  const secondary = assessment.secondary as any;
  const axisScores = assessment.axis_scores as Record<string, number>;
  const signature = buildInstantSignature(axisScores as any);

  // Führungsreife (zweite Schicht) — sofort sichtbar machen, nicht nur im PDF.
  let maturityScores: Record<string, number> | null = null;
  if (productTier >= 2) {
    const { data: matAnswers } = await supabase
      .from('answers')
      .select('value_numeric, value_position, item:items(module_code, reverse_scored)')
      .eq('assessment_id', id);
    const mAvg: Record<string, number> = {};
    const mCnt: Record<string, number> = {};
    (matAnswers ?? []).forEach((a: any) => {
      const code = a.item?.module_code;
      if (!code) return;
      let v: number | null = null;
      if (a.value_numeric != null) {
        v = (a.value_numeric - 3) / 2;
        if (a.item.reverse_scored) v = -v;
      } else if (a.value_position != null) {
        v = a.value_position * 2 - 1;
      }
      if (v == null) return;
      mAvg[code] = (mAvg[code] ?? 0) + v;
      mCnt[code] = (mCnt[code] ?? 0) + 1;
    });
    Object.keys(mAvg).forEach((c) => { mAvg[c] = mAvg[c] / mCnt[c]; });
    maturityScores = computeMaturityScores(axisScores as AxisScores, mAvg) as unknown as Record<string, number>;
  }

  // Re-Check: jüngstes früheres Assessment desselben Trainers für den Verlauf.
  let progress: ReturnType<typeof buildProgressComparison> | null = null;
  {
    const { data: prior } = await supabase
      .from('assessments')
      .select('id, axis_scores, maturity_scores, completed_at, created_at')
      .eq('user_id', user.id)
      .neq('id', id)
      .in('status', ['completed', 'report_ready', 'archived'])
      .not('axis_scores', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prior?.axis_scores) {
      progress = buildProgressComparison(
        {
          axisScores: axisScores as any,
          maturityScores: (maturityScores as any) ?? null,
          date: (assessment as any).completed_at ?? new Date().toISOString(),
        },
        {
          axisScores: prior.axis_scores as any,
          maturityScores: (prior as any).maturity_scores ?? null,
          date: (prior as any).completed_at ?? (prior as any).created_at ?? new Date().toISOString(),
        },
      );
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coachcheck.humatrix.cc';
  const metadataContext = ((assessment as any).metadata?.context ?? {}) as Record<string, any>;

  return (
    <>
      <TopNav />
      <main>
        {/* Hero */}
        <section className="bg-petrol text-bone py-16 md:py-24 px-4 md:px-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(179, 142, 69, 0.15), transparent 50%)' }} />
          <div className="max-w-4xl mx-auto relative">
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-gold-light mb-6">
              Dein Ergebnis · {assessment.product?.name_de}
            </div>
            {primary && (
              <>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-3">
                  Primärer Archetyp
                </div>
                <h1 className="font-display font-light text-[clamp(2.6rem,6vw,5rem)] leading-[1.02] tracking-[-0.035em] mb-4" style={{ fontVariationSettings: "'opsz' 144" }}>
                  {primary.name_de}
                </h1>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-bone-soft mb-8">
                  {primary.short_trait}
                </p>
                <p className="font-editorial italic text-xl leading-[1.5] max-w-[58ch] text-bone-soft">
                  {primary.kernmuster}
                </p>
                {productTier >= 2 && (
                  <div className="mt-6">
                    <Link
                      href={`/archetyp/${primary.code}?assessment=${id}`}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition text-sm"
                    >
                      Deep-Dive lesen <span className="font-mono">→</span>
                    </Link>
                  </div>
                )}
                {secondary && (
                  <div className="mt-8 pt-8 border-t border-bone/10">
                    <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-2">
                      Sekundärer Archetyp
                    </div>
                    <div className="font-display text-2xl font-normal tracking-[-0.02em]" style={{ fontVariationSettings: "'opsz' 144" }}>
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

        {/* PERSONALISIERTE SIGNATUR — der WOW-Moment, sofort, individuell */}
        <section className="bg-bone py-14 md:py-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-5 flex items-center gap-3">
              <span className="w-10 h-px bg-gold" /> Deine persönliche Signatur
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {signature.headline.map((h, i) => (
                <span
                  key={i}
                  className="px-4 py-1.5 rounded-full bg-petrol text-bone font-mono text-[0.7rem] uppercase tracking-[0.14em]"
                >
                  {h}
                </span>
              ))}
            </div>
            <p className="font-editorial text-[1.35rem] md:text-[1.6rem] leading-[1.45] tracking-[-0.01em] max-w-[62ch] text-ink mb-10">
              {signature.reading}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="p-6 bg-bone-soft rounded-md border border-bone-line">
                <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-gold-deep mb-3">
                  Deine schärfste Spannung
                </div>
                <p className="text-[0.95rem] leading-[1.55] text-ink">{signature.tension}</p>
              </div>
              <div className="p-6 bg-petrol text-bone rounded-md">
                <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-gold mb-3">
                  Wie du unter Druck kippst
                </div>
                <p className="text-[0.95rem] leading-[1.55] text-bone-soft">{signature.underPressure}</p>
              </div>
            </div>

            <div className="p-6 md:p-7 bg-ink text-bone rounded-md border-l-[3px] border-gold">
              <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-gold mb-3">
                Dein Sofort-Hebel
              </div>
              <p className="text-[1.02rem] leading-[1.55] text-bone">{signature.lever}</p>
            </div>

            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted mt-5">
              Berechnet aus deinen tatsächlichen Werten · Coaching-Hypothese, keine Diagnose
            </p>
          </div>
        </section>

        {/* RE-CHECK — Verlauf sichtbar machen (nur wenn früheres Assessment existiert) */}
        {progress && (
          <section className="bg-ink text-bone py-14 md:py-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-5 flex items-center gap-3">
                <span className="w-10 h-px bg-gold" /> Deine Entwicklung · seit {progress.daysBetween} Tagen
              </div>
              <h2 className="font-display font-light text-[clamp(1.7rem,4vw,2.6rem)] leading-[1.08] tracking-[-0.025em] max-w-[22ch] mb-5" style={{ fontVariationSettings: "'opsz' 144" }}>
                {progress.headline}
              </h2>
              <p className="text-bone-soft text-[1rem] leading-[1.6] max-w-[58ch] mb-10 opacity-90">
                {progress.summary}
              </p>

              {progress.hasMaturity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                  {progress.maturityDeltas.map((d) => {
                    const up = d.delta >= 0.05;
                    const down = d.delta <= -0.05;
                    const chip = up ? 'text-gold' : down ? 'text-bone-soft' : 'text-muted-dark';
                    return (
                      <div key={d.key} className="grid gap-2">
                        <div className="flex justify-between items-baseline">
                          <span className="font-display text-[1.02rem] tracking-[-0.01em]">{d.label}</span>
                          <span className={`font-mono text-xs ${chip}`}>
                            {Math.round(d.from * 100)} → {Math.round(d.to * 100)} %
                            {up ? ` ▲ +${Math.round(d.delta * 100)}` : down ? ` ▼ ${Math.round(d.delta * 100)}` : ' ='}
                          </span>
                        </div>
                        <div className="relative h-1.5 bg-bone/15 rounded">
                          {/* vorher (gedämpft) */}
                          <span className="absolute top-0 left-0 h-1.5 bg-bone/25 rounded" style={{ width: `${Math.round(d.from * 100)}%` }} />
                          {/* jetzt (gold) */}
                          <span className="absolute top-0 left-0 h-1.5 bg-gold rounded" style={{ width: `${Math.round(d.to * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 360° Spiegel: Invitations Manager (nur Tier 3+) */}
        {isThreeSixty && (
          <section className="bg-bone-soft py-12 md:py-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4 flex items-center gap-3">
                <span className="w-10 h-px bg-gold" /> 360° Spiegel · Fremdbild
              </div>
              <h2 className="font-display font-light text-[clamp(1.6rem,3.5vw,2.4rem)] leading-[1.05] tracking-[-0.025em] mb-3" style={{ fontVariationSettings: "'opsz' 144" }}>
                Lass dein Team <em className="font-editorial">ehrlich</em> einschätzen.
              </h2>
              <p className="text-muted mb-8 max-w-[55ch] leading-[1.5]">
                Lade 5–10 Personen ein, die dich kennen. Sie füllen denselben Test
                aus dem Fremdbild aus — anonymisiert und ausschließlich aggregiert ausgewertet;
                Einzelantworten sind für dich als Trainer nicht abrufbar. Sobald 3+ Antworten
                da sind, vergleicht der Premium-Report dein Selbstbild mit dem Team-Bild.
              </p>
              <InvitationsManager
                assessmentId={id}
                initialInvitations={invitations}
                appUrl={appUrl}
              />
            </div>
          </section>
        )}

        {/* TeamCheck (nur Tier 4+) */}
        {isTeamcheck && (
          <section className="bg-petrol/5 py-12 md:py-16 px-4 md:px-8 border-t border-bone-line">
            <div className="max-w-4xl mx-auto">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-petrol mb-4 flex items-center gap-3">
                <span className="w-10 h-px bg-petrol" /> TeamCheck · Spielerstimmen
              </div>
              <h2 className="font-display font-light text-[clamp(1.6rem,3.5vw,2.4rem)] leading-[1.05] tracking-[-0.025em] mb-3" style={{ fontVariationSettings: "'opsz' 144" }}>
                Lass dein <em className="font-editorial">Team selbst sprechen.</em>
              </h2>
              <p className="text-muted mb-8 max-w-[55ch] leading-[1.5]">
                Lade alle Spieler über anonyme Token-Links ein. Sie beantworten 12 ehrliche Fragen zu Coach-Impact,
                Teamklima, psychologischer Sicherheit und Druck-Erleben. Antworten werden anonymisiert
                und ausschließlich aggregiert ausgewertet — Einzelantworten sind für dich nicht abrufbar.
                Auswertung ab 5 vollständigen Antworten.
              </p>
              <TeamcheckManager
                assessmentId={id}
                initialInvitations={teamInvitations}
                appUrl={appUrl}
              />
              <div className="mt-8 p-5 md:p-6 bg-petrol text-bone rounded-md border-l-[3px] border-gold">
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-gold mb-2">
                  ★ Dein persönlicher Teil
                </div>
                <p className="text-[0.95rem] leading-[1.55] text-bone-soft">
                  Sobald die Team-Antworten ausgewertet sind, gehen wir gemeinsam in einen
                  persönlichen Auswertungs-Call und priorisieren deinen 14-Tage-Maßnahmenplan.
                  Hier kommt das Know-how des Mind-Club-Teams direkt zu dir — den Termin
                  vereinbaren wir nach dem Eingang der Antworten.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Context Form (tier 2+) - Premium Intelligence Layer */}
        {productTier >= 2 && (
          <section className="py-12 md:py-16 px-4 md:px-8 bg-bone">
            <div className="max-w-4xl mx-auto">
              <ContextForm
                assessmentId={id}
                initialContext={{
                  seasonPhase: (assessment as any).context_season_phase ?? metadataContext.seasonPhase,
                  teamMaturity: (assessment as any).context_team_maturity ?? metadataContext.teamMaturity,
                  conflictState: (assessment as any).context_conflict_state ?? metadataContext.conflictState,
                  ageRange: (assessment as any).context_age_range ?? metadataContext.ageRange,
                  notes: (assessment as any).context_notes ?? metadataContext.notes,
                }}
              />
            </div>
          </section>
        )}

        {/* Premium-Report CTA */}
        <section className="bg-ink text-bone py-12 md:py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-3">
              <span className="w-10 h-px bg-gold" /> Premium-Report
            </div>
            <h2 className="font-display font-light text-[clamp(1.6rem,3.5vw,2.4rem)] leading-[1.05] tracking-[-0.025em] mb-3" style={{ fontVariationSettings: "'opsz' 144" }}>
              Dein <em className="font-editorial text-gold">vollständiger Report.</em>
            </h2>
            <p className="text-bone-soft mb-6 max-w-[55ch] leading-[1.5]">
              Personalisierte Interpretationen, dein Druckprofil, ein konkreter
              Entwicklungspfad und ein Gesprächsleitfaden — generiert von Claude
              Opus, gerendert als Premium-PDF.
            </p>
            <ReportGenerateButton
              assessmentId={id}
              existingReportUrl={existingReportUrl}
              productTier={productTier}
            />
          </div>
        </section>

        {/* Axis Profile */}
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
            <span className="w-10 h-px bg-ink" /> Funktionale Signatur
          </div>
          <h2 className="font-display font-light text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.05] tracking-[-0.03em] mb-10" style={{ fontVariationSettings: "'opsz' 144" }}>
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

        {/* FÜHRUNGSREIFE — zweite Schicht, jenseits des Stils (Tier 2+) */}
        {maturityScores && (
          <section className="max-w-4xl mx-auto px-4 md:px-8 pb-4 pt-4 md:pt-0">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-3 flex items-center gap-3">
              <span className="w-10 h-px bg-ink" /> Führungsreife
            </div>
            <h2 className="font-display font-light text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.05] tracking-[-0.03em] mb-4" style={{ fontVariationSettings: "'opsz' 144" }}>
              Wie souverän du führst.
            </h2>
            <p className="text-muted text-sm leading-[1.5] max-w-[60ch] mb-10">
              Reife ist nicht dein Stil — sondern wie souverän du mit den Anforderungen deines
              Stils umgehst. Sechs Dimensionen, die zeigen, wo du gefestigt bist und wo dein
              größter Entwicklungsraum liegt.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              {MATURITY_KEYS.map((key) => {
                const value = maturityScores![key] ?? 0.5;
                const band = maturityBand(value);
                return (
                  <div key={key} className="grid gap-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-display text-[1.05rem] tracking-[-0.01em]">{MATURITY_LABELS[key]}</span>
                      <span className={`font-mono text-xs uppercase tracking-[0.1em] ${band.tone}`}>
                        {band.label} · {Math.round(value * 100)} %
                      </span>
                    </div>
                    <div className="relative h-1 bg-bone-line rounded">
                      <span
                        className="absolute top-0 left-0 h-1 bg-gold rounded"
                        style={{ width: `${Math.round(value * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Strengths, Risks, Hebel */}
        {primary && (
          <section className="bg-bone-soft py-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-3 flex items-center gap-3">
                <span className="w-10 h-px bg-ink" /> Typische Muster deines Archetyps
              </div>
              <p className="text-muted text-sm leading-[1.5] max-w-[58ch] mb-8">
                Diese Muster gelten für den Archetyp <strong className="text-ink font-medium">{primary.name_de}</strong> allgemein.
                Deine persönliche Ausprägung steht oben in deiner Signatur — der vollständige Report verbindet beides.
              </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-bone rounded-md border border-bone-line">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold-deep mb-4">Stärken</div>
                <ul className="space-y-2">
                  {(primary.staerken ?? []).map((s: string, i: number) => (
                    <li key={i} className="text-sm leading-[1.5] pl-4 relative">
                      <span className="absolute left-0 text-gold">→</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-bone rounded-md border border-bone-line">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold-deep mb-4">Risiken</div>
                <ul className="space-y-2">
                  {(primary.risiken ?? []).map((r: string, i: number) => (
                    <li key={i} className="text-sm leading-[1.5] pl-4 relative">
                      <span className="absolute left-0 text-gold">→</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-ink text-bone rounded-md">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-4">Entwicklungshebel</div>
                <ul className="space-y-2">
                  {(primary.entwicklungshebel ?? []).map((h: string, i: number) => (
                    <li key={i} className="text-sm leading-[1.5] pl-4 relative text-bone-soft">
                      <span className="absolute left-0 text-gold">→</span>{h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            </div>
          </section>
        )}

        {/* Next steps */}
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center">
          <h3 className="font-display text-3xl tracking-[-0.02em] mb-3">Was kommt als Nächstes?</h3>
          <p className="font-editorial italic text-lg text-muted mb-8 max-w-[50ch] mx-auto">
            {isThreeSixty
              ? 'Sobald genug Fremdbilder eingegangen sind, kannst du den 360°-Report generieren.'
              : 'Mit dem 360° Spiegel siehst du, wie deine Spieler dich wirklich erleben — der Moment, an dem aus Selbstreflexion echte Entwicklung wird.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard" className="px-6 py-3 border border-ink text-ink rounded-full font-semibold hover:bg-ink hover:text-bone transition">
              Zum Dashboard
            </Link>
            {!isThreeSixty && (
              <Link href="/#products" className="px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-ink hover:text-gold transition">
                Nächstes Paket: 360° Spiegel →
              </Link>
            )}
          </div>
          {!progress && (
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted mt-8">
              Tipp: Wiederhole den Check in 8–12 Wochen — dann zeigt dir CoachCheck deinen Fortschritt direkt an.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
