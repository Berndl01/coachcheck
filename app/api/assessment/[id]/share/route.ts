import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { checkPaidEntitlement } from '@/lib/auth/entitlement';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coachcheck.humatrix.cc';
// Geteilt werden darf NUR ein fertiges Ergebnis.
const SHAREABLE_STATUSES = ['completed', 'report_ready'];

function cardUrl(token: string): string {
  return `${APP_URL.replace(/\/$/, '')}/karte/${token}`;
}

/** Eigentümer aktiviert das Teilen und erhält den öffentlichen Karten-Link. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(`share:${user.id}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Anfragen', retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  // Ownership + Freigabe-Voraussetzung prüfen.
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, user_id, status, share_token, share_enabled')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!assessment) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!SHAREABLE_STATUSES.includes(assessment.status)) {
    return NextResponse.json({ error: 'assessment not shareable yet' }, { status: 409 });
  }

  const admin = createAdminClient();

  // P0 (v3.42, Blocker 1 — Refund-Lockdown, Variante A): Einen öffentlichen
  // Karten-Link darf nur aktivieren, wessen Purchase weiterhin BEZAHLT ist.
  // Nach Refund wird ein bestehender Link bereits per Stripe-Webhook deaktiviert;
  // hier verhindern wir zusätzlich eine erneute Aktivierung.
  const ent = await checkPaidEntitlement(admin, id, user.id);
  if (!ent.ok) {
    return NextResponse.json(
      { error: 'Für dieses Ergebnis besteht keine aktive Berechtigung mehr.' },
      { status: 402 },
    );
  }

  const token = assessment.share_token ?? randomUUID();
  const { error } = await admin
    .from('assessments')
    .update({ share_token: token, share_enabled: true, shared_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[share] enable failed:', error.message);
    return NextResponse.json({ error: 'could not enable sharing' }, { status: 500 });
  }
  return NextResponse.json({ enabled: true, token, url: cardUrl(token) });
}

/** Eigentümer deaktiviert das Teilen (Link wird ungültig). Token bleibt erhalten. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!assessment) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('assessments')
    // Token beim Deaktivieren entfernen → der alte, bereits verschickte Link wird
    // dauerhaft ungültig. Eine erneute Aktivierung erzeugt einen NEUEN Token.
    .update({ share_enabled: false, share_token: null })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[share] disable failed:', error.message);
    return NextResponse.json({ error: 'could not disable sharing' }, { status: 500 });
  }
  return NextResponse.json({ enabled: false });
}
