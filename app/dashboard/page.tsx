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

  if (!user) return null; // middleware redirects

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, status, progress_pct, created_at, completed_at, product:products(name_de, slug, tier), primary:primary_archetype_id(name_de)')
    .order('created_at', { ascending: false });

  const { data: allProducts } = await supabase
    .from('products').select('*').eq('active', true).order('tier', { ascending: true });

  return (
    <>
      <TopNav />
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-12">
        <div className="mb-12">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-2">
            Dashboard
          </div>
          <h1 className="font-display text-5xl tracking-[-0.03em]">
            Hallo{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.
          </h1>
          {profile?.sport && profile?.role && (
            <p className="text-muted mt-3">Als {profile.role} im {profile.sport}.</p>
          )}
        </div>

        {/* Assessments */}
        <section className="mb-16">
          <h2 className="font-display text-2xl tracking-[-0.02em] mb-6">Deine Assessments</h2>
          {(!assessments || assessments.length === 0) ? (
            <div className="bg-bone-soft p-8 rounded-md border border-bone-line">
              <div className="font-editorial text-lg italic text-muted mb-4">
                Noch keine Assessments gestartet.
              </div>
              <Link href="/#products" className="inline-flex items-center gap-2 px-5 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition">
                Erstes Paket wählen <span className="font-mono">→</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.map((a: any) => {
                const cta = statusCTA(a.status, a.id);
                const ready = a.status === 'report_ready' || a.status === 'completed';
                return (
                  <div key={a.id} className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-md border ${
                    ready ? 'bg-ink text-bone border-ink' : 'bg-bone-soft border-bone-line'
                  }`}>
                    <div className="flex-grow min-w-0">
                      <div className={`font-display text-xl ${ready ? 'text-bone' : ''}`}>
                        {a.product?.name_de}
                      </div>
                      <div className={`font-mono text-xs uppercase tracking-[0.12em] mt-1 ${ready ? 'text-gold' : 'text-muted'}`}>
                        {STATUS_LABELS[a.status] ?? a.status}
                        {a.progress_pct > 0 && a.progress_pct < 100 && <> · {a.progress_pct}%</>}
                        {ready && a.primary?.name_de && <> · {a.primary.name_de}</>}
                      </div>
                    </div>
                    <Link
                      href={cta.href}
                      className={`font-mono text-xs uppercase tracking-[0.1em] px-5 py-2.5 rounded-full transition whitespace-nowrap ${
                        ready
                          ? 'bg-gold text-ink hover:bg-bone'
                          : 'bg-ink text-bone hover:bg-gold hover:text-ink'
                      }`}
                    >
                      {cta.label} →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Saison-Monitor */}
        <section className="mb-16">
          <h2 className="font-display text-2xl tracking-[-0.02em] mb-6">Saison-Monitor</h2>
          <Link
            href="/saison"
            className="block p-5 bg-petrol text-bone rounded-md hover:bg-petrol-soft transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-xl">Deine Saisons & Pulse-Cycles</div>
                <div className="font-mono text-xs uppercase tracking-[0.1em] text-gold-light mt-1">
                  Monatliche Spieler-Pulse · Trend-Erkennung · Frühwarnsystem
                </div>
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.1em] text-gold">→</span>
            </div>
          </Link>
        </section>

        {/* Upsell */}
        <section className="mb-16">
          <h2 className="font-display text-2xl tracking-[-0.02em] mb-6">Weitere Pakete</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(allProducts ?? []).map((p: any) => (
              <div key={p.id} className="p-5 border border-bone-line rounded-md hover:border-gold transition">
                <div className="font-display text-xl mb-1">{p.name_de}</div>
                <div className="font-mono text-xs uppercase tracking-[0.1em] text-muted mb-3">
                  {p.price_cents < 10000 ? `${Math.floor(p.price_cents / 100)} €` : `ab ${(p.price_cents / 100).toLocaleString('de-AT')} €`}
                </div>
                <Link href={`/checkout/${p.slug}`} className="font-mono text-xs uppercase tracking-[0.1em] text-gold hover:underline">
                  Freischalten →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <form action="/auth/signout" method="post">
          <button type="submit" className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink">
            Logout →
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
