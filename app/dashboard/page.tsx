import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bereit zum Start',
  in_progress: 'Läuft',
  completed: 'Abgeschlossen',
  report_ready: 'Ergebnis bereit',
  archived: 'Archiviert',
};

const LEVEL_LABELS: Record<string, string> = {
  amateur_hobby: 'Amateur · Hobby',
  amateur_ambitioniert: 'Amateur · Ambitioniert',
  semi_profi: 'Semi-Profi',
  profi: 'Profi',
};

const AGE_LABELS: Record<string, string> = {
  kids_u12: 'Kids U12',
  jugend_u16: 'Jugend U13-U16',
  jugend_u18: 'Jugend U17-U19',
  erwachsene: 'Erwachsene',
  gemischt: 'Gemischt',
};

const SPORT_LABELS: Record<string, string> = {
  fussball: 'Fußball',
  handball: 'Handball',
  basketball: 'Basketball',
  volleyball: 'Volleyball',
  eishockey: 'Eishockey',
  andere: 'Sport',
};

function statusCTA(status: string, id: string) {
  if (status === 'report_ready' || status === 'completed') {
    return { href: `/assessment/${id}/result`, label: 'Ergebnis ansehen' };
  }
  if (status === 'in_progress') {
    return { href: `/assessment/${id}`, label: 'Fortsetzen' };
  }
  return { href: `/assessment/${id}`, label: 'Starten' };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, status, progress_pct, created_at, completed_at, product:products(id, name_de, slug, tier, price_cents), primary:primary_archetype_id(name_de, code)')
    .order('created_at', { ascending: false });

  const { data: allProducts } = await supabase
    .from('products').select('*').eq('active', true).order('tier', { ascending: true });

  const { data: seasons } = await supabase
    .from('seasons').select('id, name, status').eq('user_id', user.id).order('created_at', { ascending: false });

  // Pakete kategorisieren: gekauft vs. nicht gekauft
  const ownedProductIds = new Set((assessments ?? []).map((a: any) => a.product?.id).filter(Boolean));
  const ownedProducts = (allProducts ?? []).filter((p: any) => ownedProductIds.has(p.id));
  const availableProducts = (allProducts ?? []).filter((p: any) => !ownedProductIds.has(p.id));

  const firstName = profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Trainer';
  const profileComplete = !!profile?.full_name && !!profile?.training_level;

  // Meta-Chip zeigt Niveau + Alter + Sport wenn gesetzt
  const chips: string[] = [];
  if (profile?.training_level) chips.push(LEVEL_LABELS[profile.training_level] ?? profile.training_level);
  if (profile?.sport) chips.push(SPORT_LABELS[profile.sport] ?? profile.sport);
  if (profile?.age_group) chips.push(AGE_LABELS[profile.age_group] ?? profile.age_group);
  if (profile?.club) chips.push(profile.club);

  return (
    <>
      <TopNav />
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-14">

        {/* ====================================================== */}
        {/* ZONE 1 — PROFIL-HEADER */}
        {/* ====================================================== */}
        <header className="mb-12 pb-8 border-b border-bone-line">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep mb-3">
            Mein Profil
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex-grow">
              <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] mb-3">
                {firstName}
              </h1>
              {chips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {chips.map((c, i) => (
                    <span key={i} className="font-mono text-[0.65rem] uppercase tracking-[0.12em] px-3 py-1.5 bg-bone-soft border border-bone-line rounded-full text-muted">
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted italic">Profil noch nicht vervollständigt.</p>
              )}
            </div>
            <Link
              href="/profil/setup"
              className="font-mono text-xs uppercase tracking-[0.1em] px-4 py-2.5 border border-bone-line rounded-full text-muted hover:bg-ink hover:text-bone hover:border-ink transition whitespace-nowrap"
            >
              {profileComplete ? 'Bearbeiten' : 'Vervollständigen'} →
            </Link>
          </div>

          {/* Profil-Pflichthinweis wenn unvollständig */}
          {!profileComplete && (
            <div className="mt-6 p-4 bg-gold/10 border-l-4 border-gold rounded-r-md">
              <p className="text-sm">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep mr-2">Hinweis:</span>
                Ohne Niveau-Angabe sind deine Reports allgemein gehalten. <Link href="/profil/setup" className="text-gold-deep hover:underline font-semibold">Jetzt vervollständigen →</Link>
              </p>
            </div>
          )}
        </header>

        {/* ====================================================== */}
        {/* ZONE 2 — MEINE AUSWERTUNGEN */}
        {/* ====================================================== */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-2xl tracking-[-0.02em]">Meine Auswertungen</h2>
            {(assessments && assessments.length > 0) && (
              <div className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
                {assessments.length} {assessments.length === 1 ? 'Assessment' : 'Assessments'}
              </div>
            )}
          </div>

          {(!assessments || assessments.length === 0) ? (
            <div className="bg-bone-soft p-10 rounded-md border border-bone-line text-center">
              <div className="font-editorial text-xl italic text-muted mb-2">
                Noch keine Auswertungen.
              </div>
              <p className="text-sm text-muted mb-6 max-w-[40ch] mx-auto">
                Starte mit deinem ersten Assessment — unten siehst du, welche Pakete du freischalten kannst.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {assessments.map((a: any) => {
                const cta = statusCTA(a.status, a.id);
                const ready = a.status === 'report_ready' || a.status === 'completed';
                const tier = a.product?.tier ?? 0;
                return (
                  <div
                    key={a.id}
                    className={`p-6 rounded-md border-2 transition ${
                      ready
                        ? 'bg-ink text-bone border-ink'
                        : 'bg-bone border-bone-line hover:border-gold'
                    }`}
                  >
                    <div className={`font-mono text-[0.65rem] uppercase tracking-[0.15em] mb-2 ${ready ? 'text-gold' : 'text-gold-deep'}`}>
                      {a.product?.name_de}
                    </div>
                    {ready && a.primary?.name_de ? (
                      <>
                        <div className={`font-display text-2xl tracking-[-0.02em] mb-1 ${ready ? '' : 'text-ink'}`}>
                          {a.primary.name_de}
                        </div>
                        <div className={`font-mono text-[0.65rem] uppercase tracking-[0.12em] mb-4 ${ready ? 'text-bone-soft' : 'text-muted'}`}>
                          {STATUS_LABELS[a.status]} · Tier {tier}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`font-display text-xl tracking-[-0.02em] mb-1 ${ready ? '' : 'text-ink'}`}>
                          {STATUS_LABELS[a.status]}
                        </div>
                        {a.progress_pct > 0 && a.progress_pct < 100 && (
                          <div className="font-mono text-xs text-muted mb-4">{a.progress_pct}% fortgeschritten</div>
                        )}
                      </>
                    )}
                    <div className="flex gap-2 flex-wrap mt-4">
                      <Link
                        href={cta.href}
                        className={`font-mono text-[0.65rem] uppercase tracking-[0.1em] px-4 py-2 rounded-full transition ${
                          ready ? 'bg-gold text-ink hover:bg-bone' : 'bg-ink text-bone hover:bg-gold hover:text-ink'
                        }`}
                      >
                        {cta.label} →
                      </Link>
                      {ready && tier >= 2 && a.primary?.code && (
                        <Link
                          href={`/archetyp/${a.primary.code}?assessment=${a.id}`}
                          className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-4 py-2 rounded-full border border-gold text-gold hover:bg-gold hover:text-ink transition"
                        >
                          Deep-Dive →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ====================================================== */}
        {/* ZONE 3 — MEINE PAKETE + TOOLS */}
        {/* ====================================================== */}
        {(ownedProducts.length > 0 || (seasons && seasons.length > 0)) && (
          <section className="mb-16">
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-6">Meine Pakete & Tools</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Gekaufte Pakete anzeigen */}
              {ownedProducts.map((p: any) => (
                <div key={p.id} className="p-5 bg-bone-soft rounded-md border border-bone-line">
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-gold-deep mb-2">
                    ✓ Freigeschaltet
                  </div>
                  <div className="font-display text-lg tracking-[-0.01em] mb-2">{p.name_de}</div>
                  <div className="text-xs text-muted leading-[1.5]">
                    {p.tier >= 2 && 'Premium Report · Deep-Dive · '}
                    {p.tier >= 3 && '360° Fremdeinschätzung · '}
                    {p.tier >= 4 && 'TeamCheck · '}
                    {p.tier >= 5 && 'Saison-Monitor · '}
                  </div>
                </div>
              ))}

              {/* Saison-Link nur wenn Saison-Produkt aktiv ist */}
              {(seasons && seasons.length > 0) && (
                <Link
                  href="/saison"
                  className="p-5 bg-petrol text-bone rounded-md hover:bg-petrol-soft transition block"
                >
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-gold-light mb-2">
                    Tool · Saison-Monitor
                  </div>
                  <div className="font-display text-lg tracking-[-0.01em] mb-2">
                    {seasons.length} {seasons.length === 1 ? 'Saison' : 'Saisons'} aktiv
                  </div>
                  <div className="font-mono text-xs uppercase tracking-[0.1em] text-gold">
                    Öffnen →
                  </div>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ====================================================== */}
        {/* ZONE 4 — WEITERE MÖGLICHKEITEN (nur wenn Pakete übrig) */}
        {/* ====================================================== */}
        {availableProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="font-display text-2xl tracking-[-0.02em]">Weitere Möglichkeiten</h2>
              <Link href="/#products" className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep hover:underline">
                Alle Pakete →
              </Link>
            </div>
            <p className="font-editorial italic text-muted mb-6 leading-[1.5]">
              {ownedProducts.length > 0
                ? 'Der nächste sinnvolle Schritt für dich.'
                : 'Pakete, die du noch nicht freigeschaltet hast.'}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableProducts.slice(0, 3).map((p: any) => (
                <Link
                  key={p.id}
                  href={p.tier >= 4 ? `/kontakt?plan=${p.slug}` : `/checkout/${p.slug}`}
                  className="p-5 border border-bone-line rounded-md hover:border-gold hover:bg-bone-soft transition block"
                >
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted mb-2">
                    Tier {p.tier}
                  </div>
                  <div className="font-display text-lg tracking-[-0.01em] mb-1">{p.name_de}</div>
                  <div className="font-mono text-xs text-gold-deep mb-3">
                    {p.price_cents < 10000 ? `${Math.floor(p.price_cents / 100)} €` : `ab ${(p.price_cents / 100).toLocaleString('de-AT')} €`}
                  </div>
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                    {p.tier >= 4 ? 'Anfragen →' : 'Freischalten →'}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Logout */}
        <div className="pt-8 border-t border-bone-line">
          <form action="/auth/signout" method="post">
            <button type="submit" className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink transition">
              Logout →
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
