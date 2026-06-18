import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  WIDERRUFSBELEHRUNG,
  MUSTER_WIDERRUFSFORMULAR,
  CONSENT_TEXTS,
  buildContractSnapshot,
  flattenConsentText,
} from '../lib/legal/withdrawal';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

describe('Kanonische Widerrufstexte', () => {
  it('Belehrung nennt Frist, FAGG und Online-Funktion', () => {
    expect(WIDERRUFSBELEHRUNG).toMatch(/14 Tagen/);
    expect(WIDERRUFSBELEHRUNG).toMatch(/FAGG/);
    expect(WIDERRUFSBELEHRUNG).toMatch(/Online-Widerrufsfunktion/);
  });
  it('Muster-Widerrufsformular ist vollständig', () => {
    expect(MUSTER_WIDERRUFSFORMULAR).toMatch(/Hiermit widerrufe\(n\) ich\/wir/);
    expect(MUSTER_WIDERRUFSFORMULAR).toMatch(/Bestellt am \/ erhalten am/);
  });
  it('alle vier Consent-Wortlaute vorhanden', () => {
    for (const k of ['agb', 'datenschutz', 'ki_verarbeitung', 'widerruf_verzicht']) {
      expect(CONSENT_TEXTS[k]).toBeTruthy();
    }
  });
});

describe('Snapshot-Builder', () => {
  const snap = buildContractSnapshot({
    productName: 'Selbsttest',
    priceCents: 7900,
    currency: 'eur',
    orderNumber: 'CC-1099',
    purchaseId: '11111111-2222-3333-4444-555555555555',
    purchasedAt: new Date('2026-06-18T08:00:00Z'),
    consentVersion: '2026-05-31',
    consents: [{ type: 'widerruf_verzicht', acceptedAt: '2026-06-18T07:59:00Z' }],
  });
  it('füllt fehlende Consents mit null-Zeitstempel auf (immer 4)', () => {
    expect(snap.consents).toHaveLength(4);
    const agb = snap.consents.find((c) => c.type === 'agb');
    expect(agb?.acceptedAt).toBeNull();
    expect(agb?.text).toBe(CONSENT_TEXTS.agb);
  });
  it('flacht Consent-Texte für die Speicherung ab', () => {
    const flat = flattenConsentText(snap);
    expect(flat).toMatch(/widerruf|Leistungsbeginn|Widerrufsfrist/i);
    expect(flat.split('\n')).toHaveLength(4);
  });
});

describe('Online-Widerrufsfunktion (Blocker 4)', () => {
  it('API-Route protokolliert Eingang + bestätigt + benachrichtigt', () => {
    const r = read('app', 'api', 'widerruf', 'route.ts');
    expect(r).toMatch(/from\('withdrawals'\)/);
    expect(r).toMatch(/received_at/);
    expect(r).toMatch(/withdrawal-confirm/);
    expect(r).toMatch(/withdrawal-admin/);
    expect(r).toMatch(/verifyTurnstile/);     // Bot-Schutz
    expect(r).toMatch(/website/);             // Honeypot
  });
  it('Bestätigung verspricht KEINE automatische Rückerstattung (ehrlich)', () => {
    const r = read('app', 'api', 'widerruf', 'route.ts');
    expect(r).toMatch(/prüfen/i);
    expect(r).not.toMatch(/garantiert.*erstatt/i);
  });
  it('Widerruf-Seite + Formular existieren', () => {
    const page = read('app', 'widerruf', 'page.tsx');
    const form = read('app', 'widerruf', 'widerruf-form.tsx');
    expect(page).toMatch(/WiderrufForm/);
    expect(page).toMatch(/force-dynamic/);    // sonst Build-Hang über TopNav
    expect(form).toMatch(/\/api\/widerruf/);
    expect(form).toMatch(/confirm/);          // eindeutige Erklärung erforderlich
  });
  it('Footer verlinkt die Widerrufsfunktion (leicht zugänglich)', () => {
    const f = read('components', 'landing', 'footer.tsx');
    expect(f).toMatch(/\/widerruf/);
    expect(f).toMatch(/Vertrag widerrufen/);
  });
  it('Migration 34 legt withdrawals an', () => {
    const m = read('supabase', 'migrations', '34_withdrawals.sql');
    expect(m).toMatch(/create table if not exists public\.withdrawals/);
    expect(m).toMatch(/received_at/);
    expect(m).toMatch(/enable row level security/);
  });
});

describe('One-Click-Unsubscribe (RFC 8058)', () => {
  it('dedizierter POST-Endpoint setzt unsubscribed_at', () => {
    const r = read('app', 'api', 'unsubscribe', 'route.ts');
    expect(r).toMatch(/export async function POST/);
    expect(r).toMatch(/unsubscribed_at/);
    expect(r).toMatch(/status: 'expired'/);
  });
  it('List-Unsubscribe-Header zeigt auf den POST-Endpoint (Reminder + Einladung)', () => {
    const prog = read('lib', 'email', 'progress-emails.ts');
    const send = read('app', 'api', 'invitations', 'send', 'route.ts');
    expect(prog).toMatch(/\/api\/unsubscribe\?token=/);
    expect(send).toMatch(/\/api\/unsubscribe\?token=/);
  });
});

describe('Reminder-Inaktivität + Meilenstein-Idempotenz', () => {
  it('Resume-Reminder filtert auf last_activity_at statt created_at', () => {
    const p = read('lib', 'email', 'progress-emails.ts');
    expect(p).toMatch(/\.lt\('last_activity_at', cutoff\)/);
    expect(p).not.toMatch(/\.lt\('created_at', cutoff\)/);
  });
  it('Answer-Route bumpt last_activity_at', () => {
    const a = read('app', 'api', 'assessment', '[id]', 'answer', 'route.ts');
    expect(a).toMatch(/last_activity_at/);
  });
  it('Meilenstein-Mails claimen atomar (kein Doppel/Skip)', () => {
    const p = read('lib', 'email', 'progress-emails.ts');
    expect(p).toMatch(/first_response_notified_at/);
    expect(p).toMatch(/threshold_notified_at/);
    expect(p).toMatch(/\.is\('threshold_notified_at', null\)/);
    expect(p).toMatch(/completed >= FREMDBILD_MIN/);
  });
});

describe('Checkout bindet Consent an konkreten Kauf', () => {
  it('Checkout-Start erzeugt checkout_attempt_id und reicht ihn an Stripe + Consent', () => {
    const s = read('app', 'checkout', '[slug]', 'start', 'route.ts');
    expect(s).toMatch(/checkoutAttemptId/);
    expect(s).toMatch(/checkout_attempt_id/);
    expect(s).toMatch(/consentText/);
  });
  it('Bestätigung wählt Consent über checkout_attempt_id', () => {
    const oc = read('lib', 'email', 'order-confirmation.ts');
    expect(oc).toMatch(/checkout_attempt_id/);
  });
});
