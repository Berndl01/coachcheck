import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { SeasonControl } from './season-control';

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!season) notFound();

  const { data: cycles } = await supabase
    .from('pulse_cycles')
    .select('*')
    .eq('season_id', id)
    .order('cycle_number', { ascending: false });

  const { data: invitations } = await supabase
    .from('pulse_invitations')
    .select('*')
    .eq('season_id', id)
    .order('created_at', { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coachcheck.humatrix.cc';

  return (
    <>
      <TopNav />
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-12">
        {/* Hero */}
        <div className="mb-12">
          <Link href="/saison" className="font-mono text-xs uppercase tracking-[0.15em] text-muted hover:text-ink">
            ← Alle Saisons
          </Link>
          <div className="mt-4 mb-2 font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
            Saison-Monitor
          </div>
          <h1 className="font-display text-5xl tracking-[-0.03em]">
            {season.name}
          </h1>
          <p className="text-muted mt-3">
            {season.sport ? `${season.sport} · ` : ''}{season.team_size_estimate ? `~${season.team_size_estimate} Spieler · ` : ''}Pulse alle {season.pulse_interval_days} Tage · Status: {season.status}
          </p>
        </div>

        <SeasonControl
          season={season}
          cycles={(cycles ?? []) as any[]}
          invitations={(invitations ?? []) as any[]}
          appUrl={appUrl}
        />
      </main>
      <Footer />
    </>
  );
}
