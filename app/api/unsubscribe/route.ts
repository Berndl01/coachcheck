import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidTokenShape } from '@/lib/utils/anon-api';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * One-Click-Unsubscribe-Endpoint (RFC 8058).
 *
 * Der List-Unsubscribe-Header der Einladungs-/Reminder-Mails verweist hierauf.
 * Gmail/Yahoo senden beim Klick auf „Abmelden" einen POST mit dem Body
 * `List-Unsubscribe=One-Click` an diese URL — OHNE weitere Interaktion. Daher
 * MUSS hier ein POST-Endpoint stehen (eine GET-Seite erfüllt One-Click nicht).
 *
 * Der invitation token ist ein unguessable Capability-Token aus der Mail; sein
 * Besitz genügt als Berechtigung für die Abmeldung dieses einen Empfängers.
 *
 * Wirkung: unsubscribed_at setzen UND status='expired' (damit
 * get_items_for_invitation keine Items mehr ausliefert und der Versand-Endpoint
 * den Empfänger verweigert) — identisch zur sichtbaren ?unsubscribe=1-Seite.
 */
async function unsubscribe(token: string | null): Promise<boolean> {
  if (!token || !isValidTokenShape(token)) return false;

  // Leichte Drossel gegen Token-Durchprobieren.
  const rl = await checkRateLimit(`unsubscribe:${token}`, 10, 60_000);
  if (!rl.ok) return false;

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from('invitations')
    .select('id, unsubscribed_at')
    .eq('token', token)
    .maybeSingle();

  if (!inv) return false;
  if (inv.unsubscribed_at) return true; // schon abgemeldet → idempotent ok.

  const { error } = await admin
    .from('invitations')
    .update({ unsubscribed_at: new Date().toISOString(), status: 'expired' })
    .eq('id', inv.id);

  return !error;
}

export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  const ok = await unsubscribe(token);
  // Mailprovider erwarten 200; Inhalt ist unerheblich.
  return NextResponse.json({ ok });
}

// GET: falls ein Mailclient die URL direkt öffnet → ebenfalls abmelden und zur
// bestehenden Bestätigungsseite weiterleiten.
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  await unsubscribe(token);
  if (token && isValidTokenShape(token)) {
    return NextResponse.redirect(
      new URL(`/einschaetzung/${token}?unsubscribe=1`, request.url),
      { status: 303 },
    );
  }
  return NextResponse.json({ ok: false });
}
