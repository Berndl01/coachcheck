import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/utils/admin';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { ResetJobButton } from './actions';

export const dynamic = 'force-dynamic';

const STALE_MINUTES = 15;
const short = (id: string) => id.slice(0, 8);
const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * Admin-Monitoring (P2 #14): macht kritische Betriebsfälle sofort sichtbar —
 * fehlgeschlagene Reports, KI-Fallback-Reports, abgeschlossene Assessments
 * ohne Scores, Käufe ohne Assessment, Assessments ohne Report sowie fehlenden
 * Consent trotz Kauf. Read-only, plus Lock-Reset für Report-Neugenerierung.
 */
export default async function AdminMonitorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (!(await isAdminUser(user))) {
    return (
      <>
        <TopNav />
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-16">
          <h1 className="font-display text-3xl">Nicht autorisiert</h1>
          <p className="text-muted mt-3">Diese Seite ist nur für Admins zugänglich.</p>
          <Link href="/dashboard" className="text-gold-deep hover:underline mt-6 inline-block">← Dashboard</Link>
        </main>
        <Footer />
      </>
    );
  }

  const admin = createAdminClient();
  const staleCutoff = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();

  // 1) Fehlgeschlagene Report-Jobs
  const { data: failedJobs } = await admin
    .from('report_jobs')
    .select('assessment_id, status, error_message, updated_at')
    .eq('status', 'failed')
    .order('updated_at', { ascending: false })
    .limit(50);

  // 2) KI-Fallback-Reports (sollten nach P1 #6 nicht mehr entstehen — Altbestand)
  const { data: fallbackReports } = await admin
    .from('reports')
    .select('assessment_id, generated_at, ai_fallback')
    .eq('ai_fallback', true)
    .order('generated_at', { ascending: false })
    .limit(50);

  // 3) Abgeschlossen, aber ohne Scores
  const { data: completedNoScores } = await admin
    .from('assessments')
    .select('id, status, completed_at, user_id')
    .in('status', ['completed', 'report_ready'])
    .is('axis_scores', null)
    .order('completed_at', { ascending: false })
    .limit(50);

  // 4) Bezahlt, aber ohne Assessment
  const { data: paidNoAssessment } = await admin
    .from('purchases')
    .select('id, user_id, created_at, stripe_session_id')
    .eq('status', 'paid')
    .is('assessment_id', null)
    .order('created_at', { ascending: false })
    .limit(50);

  // 5) Abgeschlossen (älter als X min), aber ohne Report-Zeile
  const { data: completedOld } = await admin
    .from('assessments')
    .select('id, completed_at, user_id')
    .in('status', ['completed', 'report_ready'])
    .lt('completed_at', staleCutoff)
    .order('completed_at', { ascending: false })
    .limit(200);
  const completedOldIds = (completedOld ?? []).map((a: any) => a.id);
  let reportedIds = new Set<string>();
  if (completedOldIds.length) {
    const { data: reps } = await admin
      .from('reports')
      .select('assessment_id')
      .in('assessment_id', completedOldIds);
    reportedIds = new Set((reps ?? []).map((r: any) => r.assessment_id));
  }
  const staleNoReport = (completedOld ?? []).filter((a: any) => !reportedIds.has(a.id));

  // 6) Bezahlt, aber kein Consent hinterlegt
  const { data: paidPurchases } = await admin
    .from('purchases')
    .select('id, user_id, created_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(200);
  const paidUserIds = Array.from(new Set((paidPurchases ?? []).map((p: any) => p.user_id)));
  let consentUserIds = new Set<string>();
  if (paidUserIds.length) {
    const { data: consents } = await admin
      .from('consent_records')
      .select('user_id')
      .in('user_id', paidUserIds);
    consentUserIds = new Set((consents ?? []).map((c: any) => c.user_id));
  }
  const paidNoConsentUsers = paidUserIds.filter((uid) => !consentUserIds.has(uid));

  const sections: Array<{
    key: string;
    title: string;
    desc: string;
    count: number;
    critical: boolean;
  }> = [
    { key: 'failed', title: 'Fehlgeschlagene Report-Jobs', desc: 'Generierung abgebrochen — Lock ggf. zurücksetzen.', count: (failedJobs ?? []).length, critical: true },
    { key: 'stale', title: `Abgeschlossen, aber > ${STALE_MINUTES} min ohne Report`, desc: 'Report fehlt trotz Abschluss.', count: staleNoReport.length, critical: true },
    { key: 'noscore', title: 'Abgeschlossen ohne Scores', desc: 'Status completed, aber axis_scores fehlt.', count: (completedNoScores ?? []).length, critical: true },
    { key: 'fallback', title: 'KI-Fallback-Reports', desc: 'Reduzierte Ersatzfassung ausgeliefert (Altbestand).', count: (fallbackReports ?? []).length, critical: false },
    { key: 'noassessment', title: 'Bezahlt ohne Assessment', desc: 'Paid Purchase ohne verknüpftes Assessment.', count: (paidNoAssessment ?? []).length, critical: true },
    { key: 'noconsent', title: 'Bezahlt ohne Consent', desc: 'Kauf ohne hinterlegte Einwilligung.', count: paidNoConsentUsers.length, critical: false },
  ];

  return (
    <>
      <TopNav />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
          <h1 className="font-display text-3xl tracking-[-0.02em]">Monitoring</h1>
          <Link href="/admin/checklist" className="font-mono text-xs uppercase tracking-[0.12em] text-gold-deep hover:underline">
            → Launch-Checkliste
          </Link>
        </div>
        <p className="text-muted text-sm mb-8 max-w-[60ch]">
          Kritische Betriebsfälle auf einen Blick. Aktualisiert bei jedem Seitenaufruf.
        </p>

        {/* Übersicht */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
          {sections.map((s) => (
            <a
              key={s.key}
              href={`#${s.key}`}
              className={`p-4 rounded-md border ${
                s.count > 0 && s.critical ? 'border-red-300 bg-red-50' : s.count > 0 ? 'border-gold/40 bg-bone-soft' : 'border-bone-line bg-bone-soft'
              }`}
            >
              <div className={`font-display text-2xl ${s.count > 0 && s.critical ? 'text-red-600' : 'text-ink'}`}>{s.count}</div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted mt-1 leading-tight">{s.title}</div>
            </a>
          ))}
        </div>

        <Section id="failed" title="Fehlgeschlagene Report-Jobs" empty={(failedJobs ?? []).length === 0}>
          {(failedJobs ?? []).map((j: any, i: number) => (
            <Row key={i} cols={[short(j.assessment_id), j.error_message ?? '—', fmt(j.updated_at)]}
              action={<ResetJobButton assessmentId={j.assessment_id} />} />
          ))}
        </Section>

        <Section id="stale" title={`Abgeschlossen, aber > ${STALE_MINUTES} min ohne Report`} empty={staleNoReport.length === 0}>
          {staleNoReport.map((a: any, i: number) => (
            <Row key={i} cols={[short(a.id), `User ${short(a.user_id)}`, fmt(a.completed_at)]}
              action={<ResetJobButton assessmentId={a.id} />} />
          ))}
        </Section>

        <Section id="noscore" title="Abgeschlossen ohne Scores" empty={(completedNoScores ?? []).length === 0}>
          {(completedNoScores ?? []).map((a: any, i: number) => (
            <Row key={i} cols={[short(a.id), a.status, fmt(a.completed_at)]} />
          ))}
        </Section>

        <Section id="fallback" title="KI-Fallback-Reports" empty={(fallbackReports ?? []).length === 0}>
          {(fallbackReports ?? []).map((r: any, i: number) => (
            <Row key={i} cols={[short(r.assessment_id), 'ai_fallback', fmt(r.generated_at)]}
              action={<ResetJobButton assessmentId={r.assessment_id} />} />
          ))}
        </Section>

        <Section id="noassessment" title="Bezahlt ohne Assessment" empty={(paidNoAssessment ?? []).length === 0}>
          {(paidNoAssessment ?? []).map((p: any, i: number) => (
            <Row key={i} cols={[`User ${short(p.user_id)}`, p.stripe_session_id ?? '—', fmt(p.created_at)]} />
          ))}
        </Section>

        <Section id="noconsent" title="Bezahlt ohne Consent" empty={paidNoConsentUsers.length === 0}>
          {paidNoConsentUsers.map((uid, i) => (
            <Row key={i} cols={[`User ${short(uid)}`, 'kein Consent-Eintrag', '—']} />
          ))}
        </Section>
      </main>
      <Footer />
    </>
  );
}

function Section({ id, title, empty, children }: { id: string; title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="font-display text-xl tracking-[-0.01em] mb-3">{title}</h2>
      {empty ? (
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted">Keine Auffälligkeiten ✓</p>
      ) : (
        <div className="border border-bone-line rounded-md overflow-hidden divide-y divide-bone-line">{children}</div>
      )}
    </section>
  );
}

function Row({ cols, action }: { cols: string[]; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-bone-soft text-sm">
      <span className="font-mono text-xs text-ink">{cols[0]}</span>
      <span className="flex-1 text-muted truncate">{cols[1]}</span>
      <span className="font-mono text-[0.65rem] text-muted-dark whitespace-nowrap">{cols[2]}</span>
      {action ? <span className="shrink-0">{action}</span> : null}
    </div>
  );
}
