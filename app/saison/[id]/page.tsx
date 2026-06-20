import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSeasonEntitlement } from '@/lib/season/entitlement';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { SeasonControl } from './season-control';

export const dynamic = 'force-dynamic';

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Ownership zuerst über den Admin-Client klären (RLS-unabhängig), damit wir
  // eine gesperrte Saison als "gesperrt" anzeigen können statt 404.
  const { data: season } = await admin
    .from('seasons')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!season) notFound();

  // P0 (v3.42, Blocker 2): Saison-Daten werden NICHT mehr direkt mit dem
  // Benutzerclient geladen. Lesezugriff nur nach bestandener Entitlement-Prüfung
  // (bezahlter, nicht erstatteter Tier-5-Kauf + aktive Saison). Nach einem Refund
  // ist die Saison archiviert → kein Zugriff mehr auf Snapshots, Antwortzahlen,
  // Achtsamkeitshinweise oder Tokens.
  const ent = await requireSeasonEntitlement(admin, id, { ownerUserId: user.id });

  if (!ent.ok) {
    return (
      <>
        <TopNav />
        <main className="max-w-[860px] mx-auto px-4 md:px-8 py-12">
          <Link href="/saison" className="font-mono text-xs uppercase tracking-[0.15em] text-muted hover:text-ink">
            ← Alle Saisons
          </Link>
          <div className="mt-8 bg-bone-soft border border-bone-line p-8 rounded-md">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-3">
              Saison-Monitor · Zugriff gesperrt
            </div>
            <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">{season.name}</h1>
            <p className="text-muted leading-relaxed">
              Diese Saison ist derzeit nicht zugänglich. Das passiert, wenn der zugehörige
              Kauf erstattet wurde oder die Saison archiviert ist. Pulse-Cycles, Tokens und
              gespeicherte Auswertungen sind damit gesperrt.
            </p>
            <p className="text-muted leading-relaxed mt-3 text-sm">
              Wenn du den Saison-Monitor weiter nutzen möchtest, ist ein gültiges,
              aktives Saison-Paket erforderlich. Bei Fragen wende dich an den Support.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Ab hier ist der Zugriff berechtigt — Daten serverseitig (service_role) laden.
  const { data: cycles } = await admin
    .from('pulse_cycles')
    .select('*')
    .eq('season_id', id)
    .order('cycle_number', { ascending: false });

  const { data: invitations } = await admin
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
