import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { CreateSeasonForm } from './create-form';

export default async function SaisonOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: seasons } = await supabase
    .from('seasons')
    .select('*, latest_cycle:pulse_cycles(id, cycle_number, status, response_count, started_at, closes_at)')
    .order('created_at', { ascending: false });

  return (
    <>
      <TopNav />
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-12">
        <div className="mb-12">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-2">
            Saison-Monitor
          </div>
          <h1 className="font-display text-5xl tracking-[-0.03em]">
            Deine <em className="font-editorial">Saisons.</em>
          </h1>
          <p className="text-muted mt-3 max-w-[55ch]">
            Monatliche Pulse-Checks, Frühwarnsystem für Konflikte, Entwicklungsdynamik über Zeit.
          </p>
        </div>

        {/* Existing seasons */}
        <section className="mb-16">
          <h2 className="font-display text-2xl tracking-[-0.02em] mb-6">Aktive & Vergangene</h2>
          {(!seasons || seasons.length === 0) ? (
            <div className="bg-bone-soft p-8 rounded-md border border-bone-line">
              <div className="font-editorial text-lg italic text-muted">
                Noch keine Saison gestartet.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {seasons.map((s: any) => {
                const cycles = (s.latest_cycle ?? []) as any[];
                const openCycle = cycles.find((c) => c.status === 'open');
                const totalCycles = cycles.length;
                return (
                  <Link
                    key={s.id}
                    href={`/saison/${s.id}`}
                    className="block p-5 bg-bone-soft border border-bone-line rounded-md hover:border-gold transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="font-display text-xl">{s.name}</div>
                        <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted mt-1">
                          {s.sport ?? 'Sport'} · {s.status} · {totalCycles} Pulse-Cycles
                          {openCycle && <> · <span className="text-gold-deep">offener Pulse #{openCycle.cycle_number}</span></>}
                        </div>
                      </div>
                      <span className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Create new season */}
        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] mb-6">Neue Saison starten</h2>
          <CreateSeasonForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
