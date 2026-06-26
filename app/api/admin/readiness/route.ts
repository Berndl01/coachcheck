import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SCHEMA_VERSION, SCORING_VERSION, ITEMPOOL_VERSION } from '@/lib/release-contract';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Geschützte Live-Readiness-Prüfung (P0 Abnahme).
 *
 * Prüft die ECHTE Datenbank gegen den Release-Vertrag über
 * check_release_contract() (Migration 45): Itemzahlen je Tier, alle sieben
 * Module, Archetypen-Anzahl, vollständige Spannungsfeld-Pole, bekannte Formate,
 * „beworben = geliefert". Zusätzlich wird die schema_meta-Version mit dem Code
 * abgeglichen.
 *
 * HTTP 200  → vollständig freigabefähig.
 * HTTP 503  → mindestens eine Bedingung verletzt; Body listet die Verstöße.
 *
 * Schutz: Bearer-Token == CRON_SECRET (gleiche Konvention wie die Cron-Endpoints).
 * Ohne gesetztes CRON_SECRET ist der Endpoint absichtlich deaktiviert (kein
 * ungeschützter Statusabfluss).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'readiness disabled (no CRON_SECRET set)' }, { status: 503 });
  }
  const auth = request.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1) Vertragsprüfung in der DB
  const { data: checks, error } = await admin.rpc('check_release_contract');
  if (error) {
    return NextResponse.json(
      { ready: false, error: `check_release_contract failed: ${error.message}` },
      { status: 503 },
    );
  }

  const rows = (checks ?? []) as Array<{ check_name: string; ok: boolean; detail: string }>;
  const failing = rows.filter((r) => !r.ok);

  // 2) Schema-Version abgleichen
  const { data: meta } = await admin
    .from('schema_meta')
    .select('schema_version, scoring_version, itempool_version')
    .eq('id', true)
    .maybeSingle();

  const versionProblems: string[] = [];
  if (!meta) {
    versionProblems.push('schema_meta Zeile fehlt');
  } else {
    if (meta.schema_version !== SCHEMA_VERSION) {
      versionProblems.push(`schema_version DB=${meta.schema_version} ≠ Code=${SCHEMA_VERSION}`);
    }
    if (meta.scoring_version !== SCORING_VERSION) {
      versionProblems.push(`scoring_version DB=${meta.scoring_version} ≠ Code=${SCORING_VERSION}`);
    }
    if (meta.itempool_version !== ITEMPOOL_VERSION) {
      versionProblems.push(`itempool_version DB=${meta.itempool_version} ≠ Code=${ITEMPOOL_VERSION}`);
    }
  }

  const ready = failing.length === 0 && versionProblems.length === 0;

  return NextResponse.json(
    {
      ready,
      checkedAt: new Date().toISOString(),
      totalChecks: rows.length,
      failingChecks: failing,
      versionProblems,
      expected: { schema: SCHEMA_VERSION, scoring: SCORING_VERSION, itempool: ITEMPOOL_VERSION },
    },
    { status: ready ? 200 : 503 },
  );
}
