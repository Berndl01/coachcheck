import { createAdminClient } from '@/lib/supabase/admin';
import { createHash } from 'node:crypto';

/**
 * Schreibt einen Audit-Eintrag (best effort — darf den Hauptfluss nie brechen).
 * Nur serverseitig verwenden (Service-Role).
 */
export async function logAudit(entry: {
  actorUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await createAdminClient().from('audit_logs').insert({
      actor_user_id: entry.actorUserId ?? null,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.warn('[audit] log failed:', err instanceof Error ? err.message : err);
  }
}

const hash = (v: string | null | undefined) =>
  v ? createHash('sha256').update(v).digest('hex').slice(0, 32) : null;

/**
 * Speichert eine Einwilligung (DSGVO Art. 7 Nachweisbarkeit). IP/UA nur gehasht.
 */
export async function recordConsent(entry: {
  userId: string;
  consentType: string;
  version: string;
  ip?: string | null;
  userAgent?: string | null;
  source?: string;
  // Bindet diese Einwilligung an einen konkreten Checkout-Vorgang. So kann die
  // Bestätigung exakt die zu DIESEM Kauf gehörenden Consents verwenden.
  checkoutAttemptId?: string | null;
  // Exakter Wortlaut der angeklickten Erklärung (nicht nur die Versionsnummer).
  consentText?: string | null;
}): Promise<boolean> {
  try {
    const { error } = await createAdminClient().from('consent_records').insert({
      user_id: entry.userId,
      consent_type: entry.consentType,
      version: entry.version,
      ip_hash: hash(entry.ip),
      user_agent_hash: hash(entry.userAgent),
      source: entry.source ?? null,
      checkout_attempt_id: entry.checkoutAttemptId ?? null,
      consent_text: entry.consentText ?? null,
    });
    if (error) {
      console.error('[consent] record failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[consent] record threw:', err instanceof Error ? err.message : err);
    return false;
  }
}
