import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildOrderConfirmationEmail,
  WIDERRUF_CONSENT_TEXT,
} from '../lib/email/order-confirmation';
import { buildContractSnapshot, CONSENT_TEXTS } from '../lib/legal/withdrawal';
import { VAT_NOTE, PROVIDER } from '../lib/legal/provider';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const snapshot = buildContractSnapshot({
  productName: '360°-Spiegel',
  priceCents: 19900,
  currency: 'eur',
  orderNumber: 'CC-1042',
  purchaseId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  purchasedAt: new Date('2026-06-18T10:30:00Z'),
  consentVersion: '2026-05-31',
  consents: [
    { type: 'agb', acceptedAt: '2026-06-18T10:29:00Z' },
    { type: 'datenschutz', acceptedAt: '2026-06-18T10:29:00Z' },
    { type: 'ki_verarbeitung', acceptedAt: '2026-06-18T10:29:00Z' },
    { type: 'widerruf_verzicht', acceptedAt: '2026-06-18T10:29:00Z' },
  ],
});

const sample = buildOrderConfirmationEmail({
  firstName: 'Alex',
  appUrl: 'https://coachcheck.humatrix.cc',
  assessmentId: 'ffffffff-1111-2222-3333-444444444444',
  snapshot,
});

describe('Bestell-/Vertragsbestätigung enthält alle Pflichtangaben', () => {
  it('Bestellnummer, Datum, Produkt, Preis, Zahlungsart, Vertragsreferenz', () => {
    expect(sample.html).toContain('CC-1042');
    expect(sample.html).toMatch(/18\.06\.2026/);
    expect(sample.html).toContain('360°-Spiegel');
    expect(sample.html).toMatch(/199,00\s*€|€\s*199,00/);
    expect(sample.html).toMatch(/Kreditkarte/);
    expect(sample.html).toContain('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
  });

  it('vollständige Anbieterangaben', () => {
    expect(sample.html).toContain(PROVIDER.legalName);
    expect(sample.html).toContain(PROVIDER.person);
    expect(sample.html).toContain(PROVIDER.city);
    expect(sample.html).toContain(PROVIDER.email);
  });

  it('exakter Widerruf-Zustimmungstext + Consent-Version/Zeitpunkt', () => {
    expect(sample.html).toContain(WIDERRUF_CONSENT_TEXT);
    expect(sample.html).toContain('2026-05-31');
    expect(sample.html).toMatch(/Zustimmung dokumentiert/);
  });

  it('VOLLSTÄNDIGE Widerrufsbelehrung direkt in der Mail (nicht nur Link)', () => {
    // Kernsätze der Belehrung müssen im Mailtext stehen.
    expect(sample.html).toMatch(/Widerrufsbelehrung/);
    expect(sample.html).toMatch(/14 Tagen ohne Angabe von Gr/);
    expect(sample.html).toMatch(/§ 18 Abs 1 Z 11 FAGG/);
  });

  it('Muster-Widerrufsformular direkt in der Mail', () => {
    expect(sample.html).toMatch(/Muster-Widerrufsformular/);
    expect(sample.html).toMatch(/Hiermit widerrufe\(n\) ich\/wir/);
  });

  it('prominente Online-Widerrufsfunktion verlinkt', () => {
    expect(sample.html).toMatch(/\/widerruf\?ref=/);
    expect(sample.html).toMatch(/Vertrag online widerrufen/);
  });

  it('maßgebliche AGB-Fassung + Link', () => {
    expect(sample.html).toMatch(/AGB-Fassung/);
    expect(sample.html).toContain('/legal/agb');
  });

  it('Betreff trägt Produkt und Bestellnummer', () => {
    expect(sample.subject).toContain('360°-Spiegel');
    expect(sample.subject).toContain('CC-1042');
  });
});

describe('Snapshot friert die geltenden Texte ein', () => {
  it('Zustimmungswortlaut wird wortgleich gespeichert', () => {
    const widerruf = snapshot.consents.find((c) => c.type === 'widerruf_verzicht');
    expect(widerruf?.text).toBe(CONSENT_TEXTS.widerruf_verzicht);
    expect(snapshot.consents).toHaveLength(4);
  });
  it('AGB-Fassung + Belehrung + Formular sind im Snapshot', () => {
    expect(snapshot.agbVersion).toBeTruthy();
    expect(snapshot.widerrufsbelehrung).toMatch(/FAGG/);
    expect(snapshot.musterWiderrufsformular).toMatch(/Muster-Widerrufsformular/);
  });
});

describe('Keine erfundenen Steuerangaben', () => {
  it('Default-VAT_NOTE behauptet keinen Satz und keinen Kleinunternehmer-Status', () => {
    expect(VAT_NOTE).not.toMatch(/\d+\s*%/);
    expect(VAT_NOTE).not.toMatch(/Kleinunternehmer/i);
    expect(VAT_NOTE).not.toMatch(/ATU\d/);
  });
});

describe('Verdrahtung: Webhook, Migration, Retry', () => {
  it('Webhook versendet die statusverfolgte Bestätigung (keine alte Welcome-Mail)', () => {
    const wh = read('app', 'api', 'stripe', 'webhook', 'route.ts');
    expect(wh).toMatch(/sendOrderConfirmationForPurchase/);
    expect(wh).not.toMatch(/welcomeEmailHtml/);
  });
  it('Webhook legt Assessment gesperrt an (awaiting_contract_confirmation)', () => {
    const wh = read('app', 'api', 'stripe', 'webhook', 'route.ts');
    expect(wh).toMatch(/awaiting_contract_confirmation/);
    expect(wh).toMatch(/checkout_attempt_id/);
  });
  it('Migration 31 ergänzt Versandstatus + Bestellnummer', () => {
    const m = read('supabase', 'migrations', '31_order_confirmation_tracking.sql');
    expect(m).toMatch(/confirmation_sent_at/);
    expect(m).toMatch(/confirmation_attempts/);
    expect(m).toMatch(/order_number/);
  });
  it('Migration 33 ergänzt Snapshot + checkout_attempt_id + awaiting-Status', () => {
    const m = read('supabase', 'migrations', '33_contract_confirmation_gate.sql');
    expect(m).toMatch(/contract_snapshot/);
    expect(m).toMatch(/checkout_attempt_id/);
    expect(m).toMatch(/awaiting_contract_confirmation/);
    expect(m).toMatch(/last_activity_at/);
  });
  it('Retry-Endpoint ist per CRON_SECRET geschützt', () => {
    const r = read('app', 'api', 'internal', 'confirmation-retry', 'route.ts');
    expect(r).toMatch(/CRON_SECRET/);
    expect(r).toMatch(/Bearer \$\{secret\}/);
    expect(r).toMatch(/confirmation_sent_at.*null|is\('confirmation_sent_at', null\)/s);
  });
  it('Bestätigungs-Versand schaltet das gesperrte Assessment atomar frei (RPC)', () => {
    const oc = read('lib', 'email', 'order-confirmation.ts');
    // Freischaltung erfolgt jetzt transaktional über die DB-Funktion, nicht über
    // zwei separate Updates → der frühere `status: 'pending'`-Literal entfällt.
    expect(oc).toMatch(/finalize_order_confirmation/);
    expect(oc).toMatch(/p_purchase_id/);
    expect(oc).toMatch(/p_assessment_id/);
    expect(oc).not.toMatch(/status: 'pending'/);
  });
});
