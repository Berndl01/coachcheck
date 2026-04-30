import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { ARCHETYPE_DEEP_DIVES } from '@/lib/archetype-deep-dive';
import { PersonalSection } from './personal-section';

export default async function ArchetypePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ assessment?: string }>;
}) {
  const { slug } = await params;
  const { assessment: assessmentId } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Load archetype base data
  const { data: archetype } = await supabase
    .from('archetypes')
    .select('*')
    .eq('code', slug)
    .single();

  if (!archetype) notFound();

  // Load deep-dive content (static)
  const deepDive = ARCHETYPE_DEEP_DIVES[slug];
  if (!deepDive) notFound();

  // Check tier access via user's assessments
  const { data: assessments } = await supabase
    .from('assessments')
    .select('*, product:products(tier)')
    .eq('user_id', user.id)
    .eq('status', 'report_ready');

  const maxTier = Math.max(0, ...((assessments ?? []).map((a: any) => a.product?.tier ?? 0)));
  const hasAccess = maxTier >= 2;

  // Find THIS user's assessment with this primary archetype for personalization
  let personalAssessment: any = null;
  if (assessmentId) {
    const { data: ax } = await supabase
      .from('assessments')
      .select('*, product:products(tier)')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single();
    personalAssessment = ax;
  } else {
    // Try to find any report-ready assessment with this primary archetype
    personalAssessment = (assessments ?? []).find((a: any) => a.primary_archetype_id === archetype.id) ?? null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('training_level, age_group, club_type')
    .eq('id', user.id)
    .single();

  if (!hasAccess) {
    return (
      <>
        <TopNav />
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-16 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
            Premium-Feature
          </div>
          <h1 className="font-display text-4xl tracking-[-0.03em] mb-4">
            Deep-Dive <em className="font-editorial">verschlossen.</em>
          </h1>
          <p className="text-muted mb-8 max-w-[50ch] mx-auto leading-[1.5]">
            Die ausführlichen Archetypen-Portraits sind Teil des Selbsttest Premium (29 €) und aller weiteren Pakete.
            Im Schnelltest (9 €) siehst du nur die Kurzbeschreibung.
          </p>
          <Link href="/#products" className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-ink hover:text-gold transition">
            Premium freischalten <span className="font-mono">→</span>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopNav />
      <main>
        {/* Hero */}
        <section className="bg-petrol text-bone py-16 md:py-24 px-4 md:px-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(179, 142, 69, 0.15), transparent 50%)' }} />
          <div className="max-w-4xl mx-auto relative">
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-gold-light mb-6">
              Deep Dive · Archetyp-Portrait
            </div>
            <h1 className="font-display font-light text-[clamp(2.6rem,6vw,5rem)] leading-[1.02] tracking-[-0.035em] mb-3" style={{ fontVariationSettings: "'opsz' 144" }}>
              {archetype.name_de}
            </h1>
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-bone-soft mb-6">
              {deepDive.kicker}
            </div>
            <p className="font-editorial italic text-xl leading-[1.5] max-w-[58ch] text-bone-soft mb-8">
              {archetype.kernmuster}
            </p>
            <div className="pt-6 border-t border-bone/10">
              <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold mb-2">
                Führungsenergie
              </div>
              <div className="font-display text-xl font-light tracking-[-0.01em]" style={{ fontVariationSettings: "'opsz' 144" }}>
                {deepDive.signatur}
              </div>
            </div>
          </div>
        </section>

        {/* DNA */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">01 · Die DNA</div>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-[-0.03em] mb-10">
            Wer <em className="font-editorial">du bist,</em> wenn du führst.
          </h2>
          <div className="space-y-5 text-ink leading-[1.65] text-lg">
            {deepDive.dna.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* Im Alltag */}
        <section className="bg-bone-soft py-16 px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">02 · Im Alltag</div>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-[-0.03em] mb-3">
              Fünf Szenen aus deinem Trainer-Leben.
            </h2>
            <p className="font-editorial italic text-lg text-muted mb-10 leading-[1.5]">
              Wie du in typischen Momenten wirkst — Stärken und blinde Flecken, konkret und ungeschönt.
            </p>
            <div className="space-y-6">
              {deepDive.alltag.map((s, i) => (
                <div key={i} className="p-6 bg-bone rounded-md border border-bone-line">
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-gold-deep mb-2">
                    Szene {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="font-display text-xl tracking-[-0.01em] mb-3">{s.szene}</h3>
                  <p className="text-ink leading-[1.6]">{s.beschreibung}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Spieler */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">03 · Spieler unter dir</div>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-[-0.03em] mb-10">
            Wer <em className="font-editorial">wächst</em>, wer <em className="font-editorial">leidet.</em>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-bone rounded-md border border-bone-line">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-gold-deep mb-4">
                Profitieren bei dir
              </div>
              <ul className="space-y-3">
                {deepDive.spieler_profitieren.map((s, i) => (
                  <li key={i} className="pl-5 relative leading-[1.5]">
                    <span className="absolute left-0 text-gold">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-ink text-bone rounded-md">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-gold mb-4">
                Leiden bei dir
              </div>
              <ul className="space-y-3">
                {deepDive.spieler_leiden.map((s, i) => (
                  <li key={i} className="pl-5 relative leading-[1.5] text-bone-soft">
                    <span className="absolute left-0 text-gold">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Kippmuster */}
        <section className="bg-petrol text-bone py-16 px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-4">04 · Shadow Pattern</div>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-[-0.03em] mb-10">
              Dein <em className="font-editorial">Kippmuster</em> unter Druck.
            </h2>
            <p className="font-editorial italic text-xl leading-[1.55] text-bone-soft">
              {deepDive.kippmuster}
            </p>
          </div>
        </section>

        {/* Reifeweg */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">05 · Dein Entwicklungsweg</div>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-[-0.03em] mb-3">
            Drei Reifestufen <em className="font-editorial">dieses Typs.</em>
          </h2>
          <p className="font-editorial italic text-lg text-muted mb-10 leading-[1.5]">
            Derselbe Grundstil — von kontrollstarr bis souverän. Wo stehst du heute?
          </p>
          <div className="space-y-6">
            {deepDive.reifeweg.map((r) => (
              <div key={r.stufe} className="flex gap-6">
                <div className="shrink-0">
                  <div className="font-display text-5xl text-gold-deep font-light leading-none" style={{ fontVariationSettings: "'opsz' 144" }}>
                    {r.stufe}
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-xl tracking-[-0.01em] mb-2">{r.titel}</h3>
                  <p className="text-ink leading-[1.6]">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI-personalized section (only if assessment data available) */}
        {personalAssessment && (
          <PersonalSection
            archetypeCode={slug}
            archetypeName={archetype.name_de}
            assessmentId={personalAssessment.id}
            trainingLevel={profile?.training_level ?? null}
            ageGroup={profile?.age_group ?? null}
            clubType={profile?.club_type ?? null}
          />
        )}

        {/* Upsell */}
        <section className="bg-ink text-bone py-16 px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-4">
              Der nächste Schritt
            </div>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-[-0.03em] mb-5">
              Jetzt kennst du dich. Aber wie sieht dich <em className="font-editorial text-gold">dein Team?</em>
            </h2>
            <p className="font-editorial italic text-lg text-bone-soft mb-8 max-w-[55ch] mx-auto leading-[1.5]">
              {deepDive.upsell_hinweis}
            </p>
            <Link
              href="/#products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink rounded-full font-semibold hover:bg-bone transition"
            >
              Weitere Pakete ansehen <span className="font-mono">→</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
