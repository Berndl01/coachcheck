import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/utils/admin';
import { evaluateReadiness } from '@/lib/release/readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Geschützte Release-Readiness-API.
 *
 * Prüft live, ob das deployte Modell dem Release-Vertrag entspricht
 * (lib/release/readiness.ts). Liefert:
 *   - HTTP 200, wenn ALLE Checks ok sind (`ready: true`),
 *   - HTTP 503, wenn irgendein Check fehlschlägt (mit den Gründen).
 *
 * Zugriff: entweder eingeloggter Admin-Nutzer ODER Maschinenaufruf mit
 * `Authorization: Bearer <CRON_SECRET>` (für den Preflight / CI / Cron).
 * Ohne Berechtigung: 401. Bewusst kein Daten-Leak — nur Status + Prüf-Details.
 */
async function handle(request: NextRequest) {
  // Maschinen-Pfad (Preflight/CI): Bearer-Token.
  const secret = process.env.CRON_SECRET;
  const bearer = request.headers.get('authorization');
  let authorized = false;
  if (secret && bearer === `Bearer ${secret}`) {
    authorized = true;
  } else {
    // Menschlicher Pfad: eingeloggter Admin.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    authorized = await isAdminUser(user);
  }

  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const report = await evaluateReadiness(admin);

  return NextResponse.json(report, { status: report.ready ? 200 : 503 });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
