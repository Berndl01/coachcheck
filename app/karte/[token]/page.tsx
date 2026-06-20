import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildOperatingManual, buildPlayerTypeMatrix } from '@/lib/insight/operating-manual';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ArchetypeRow = {
  name_de: string;
  short_trait: string;
  kernmuster: string;
  staerken: string[];
  risiken: string[];
  entwicklungshebel: string[];
};

/**
 * Lädt NUR die freigegebene, nicht-sensible Profilkarte über den Token.
 * Kein User, keine E-Mail, keine Antworten, keine 360°-/Team-Daten.
 */
async function loadCard(token: string) {
  // UUID-Form grob validieren, bevor wir die DB anfragen.
  if (!/^[0-9a-fA-F-]{32,36}$/.test(token)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('assessments')
    .select('id, share_enabled, axis_scores, signature, primary:primary_archetype_id(name_de, short_trait, kernmuster, staerken, risiken, entwicklungshebel), secondary:secondary_archetype_id(name_de, short_trait)')
    .eq('share_token', token)
    .eq('share_enabled', true)
    .maybeSingle();
  if (!data || !data.primary) return null;
  const primary = data.primary as unknown as ArchetypeRow;
  const secondary = (data.secondary as unknown as { name_de: string; short_trait: string } | null) ?? null;
  const scores = (data.axis_scores ?? {}) as Record<string, number>;
  // Mischprofil-Einordnung kommt aus dem in finalize gespeicherten signature.profile
  // (Bestcase §9/§16). Fallback für Alt-Assessments: 'dominant'.
  const profileType = ((data.signature as any)?.profile?.type as string | undefined) ?? 'dominant';
  return {
    manual: buildOperatingManual(primary, scores as any),
    matrix: buildPlayerTypeMatrix(primary, scores as any),
    secondary,
    isMixed: profileType === 'mixed',
  };
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const card = await loadCard(token);
  if (!card) {
    const t = await getT();
    return { title: t('cardPage.metaTitle'), robots: { index: false, follow: false } };
  }
  const title = `${card.manual.ueberschrift} · CoachCheck`;
  const description = card.manual.kernsatz;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'profile' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function CardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await loadCard(token);
  const t = await getT();

  if (!card) {
    return (
      <main className="min-h-screen bg-petrol text-bone flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-light mb-4">CoachCheck</div>
          <h1 className="font-display text-3xl mb-3" style={{ fontVariationSettings: "'opsz' 144" }}>{t('cardPage.notFoundTitle')}</h1>
          <p className="text-bone-soft text-sm leading-[1.5] mb-8">{t('cardPage.notFoundText')}</p>
          <Link href="/" className="inline-block px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition">{t('cardPage.toCoachCheck')}</Link>
        </div>
      </main>
    );
  }

  const { manual, matrix, secondary, isMixed } = card;
  // §16: genau zwei Stärken auf der Karte.
  const cardStrengths = manual.staerken.slice(0, 2);

  return (
    <main className="min-h-screen bg-petrol text-bone py-14 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-light mb-6 text-center">CoachCheck · Profilkarte</div>

        {/* Karte */}
        <div className="bg-bone text-ink rounded-lg p-7 md:p-10 border-l-[4px] border-gold">
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-gold-deep mb-2">
            {isMixed ? 'Coachingprofil · Mischprofil' : 'Coachingprofil'}
          </div>
          <div className="font-display text-[clamp(2rem,6vw,3rem)] tracking-[-0.02em] mb-2 leading-[1.05]" style={{ fontVariationSettings: "'opsz' 144" }}>{manual.ueberschrift}</div>
          {secondary && (
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-gold-deep mb-3">
              {isMixed
                ? `Mischprofil mit ${secondary.name_de}`
                : `Starke Zweittendenz: ${secondary.name_de}`}
            </div>
          )}
          <p className="font-editorial italic text-[1.1rem] leading-[1.5] text-ink mb-6">{manual.kernsatz}</p>
          {cardStrengths.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {cardStrengths.map((s, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-petrol text-bone font-mono text-[0.62rem] uppercase tracking-[0.12em]">{s}</span>
              ))}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm leading-[1.5]">
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-gold-deep mb-1">So erreichst du mich</div>
              <p>{manual.soErreichstDuMich}</p>
            </div>
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-gold-deep mb-1">So gibst du mir Feedback</div>
              <p>{manual.soGibstDuFeedback}</p>
            </div>
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-gold-deep mb-1">Unter Druck</div>
              <p>{manual.unterDruck}</p>
            </div>
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-gold-deep mb-1">Bitte vermeiden</div>
              <p>{manual.vermeide}</p>
            </div>
          </div>
        </div>

        {/* Wirkung je Spielertyp */}
        <div className="mt-8">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold-light mb-4">Derselbe Stil, vier Wirkungen</div>
          <div className="grid sm:grid-cols-2 gap-4">
            {matrix.map((p, i) => (
              <div key={i} className="bg-bone/5 border border-bone/10 rounded-md p-5">
                <div className="font-display text-base mb-2">{p.spielertyp}</div>
                <p className="text-bone-soft text-[0.85rem] leading-[1.5] mb-3">{p.wirkung}</p>
                <div className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-gold-light mb-1">Anpassung</div>
                <p className="text-bone-soft text-[0.85rem] leading-[1.5]">{p.anpassung}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-bone-soft mb-4">Coaching-Hypothese, keine Diagnose · erstellt mit CoachCheck</p>
          <Link href="/" className="inline-block px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition">{t('cardPage.ctaCreate')}</Link>
        </div>
      </div>
    </main>
  );
}
