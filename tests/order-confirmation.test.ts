import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildOrderConfirmationEmail,
  WIDERRUF_CONSENT_TEXT,
} from '../lib/email/order-confirmation';
import { VAT_NOTE, PROVIDER } from '../lib/legal/provider';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const sample = buildOrderConfirmationEmail({
  firstName: 'Alex',
  productName: '360°-Spiegel',
  orderNumber: 'CC-1042',
  purchaseId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  purchasedAt: new Date('2026-06-18T10:30:00Z'),
  amountCents: 19900,
  currency: 'eur',
  consentVersion: '2026-05-31',
  consentAcceptedAt: new Date('2026-06-18T10:29:00Z'),
  appUrl: 'https://coachcheck.humatrix.cc',
  assessmentId: 'ffffffff-1111-2222-3333-444444444444',
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

  it('maßgebliche AGB-Fassung + Link + Widerrufsbelehrung-Verweis', () => {
    expect(sample.html).toMatch(/AGB-Fassung/);
    expect(sample.html).toContain('/legal/agb');
    expect(sample.html).toMatch(/Muster-Widerrufsformular/);
  });

  it('Betreff trägt Produkt und Bestellnummer', () => {
    expect(sample.subject).toContain('360°-Spiegel');
    expect(sample.subject).toContain('CC-1042');
  });
});

describe('Keine erfundenen Steuerangaben', () => {
  it('Default-VAT_NOTE behauptet keinen Satz und keinen Kleinunternehmer-Status', () => {
    // Default darf keine konkrete Steuerbehauptung enthalten (die wäre erfunden).
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
  it('Migration 31 ergänzt Versandstatus + Bestellnummer', () => {
    const m = read('supabase', 'migrations', '31_order_confirmation_tracking.sql');
    expect(m).toMatch(/confirmation_sent_at/);
    expect(m).toMatch(/confirmation_attempts/);
    expect(m).toMatch(/order_number/);
  });
  it('Retry-Endpoint ist per CRON_SECRET geschützt', () => {
    const r = read('app', 'api', 'internal', 'confirmation-retry', 'route.ts');
    expect(r).toMatch(/CRON_SECRET/);
    expect(r).toMatch(/Bearer \$\{secret\}/);
    expect(r).toMatch(/confirmation_sent_at.*null|is\('confirmation_sent_at', null\)/s);
  });
});
