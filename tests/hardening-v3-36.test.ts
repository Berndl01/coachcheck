import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildContractSnapshot,
  serviceDescriptionFor,
  BEREITSTELLUNG,
  GEWAEHRLEISTUNG,
  FUNKTIONALITAET_KOMPATIBILITAET,
  NUTZUNG_HAFTUNG_VERFUEGBARKEIT,
  CONSENT_TEXTS,
} from '../lib/legal/withdrawal';
import { buildOrderConfirmationEmail } from '../lib/email/order-confirmation';
import {
  buildWithdrawalDeclaration,
  renderWithdrawalConfirmationEmail,
  WIDERRUF_FORMEL,
} from '../lib/email/withdrawal-confirmation';
import { AGB_VERSION } from '../lib/legal/provider';
import { CONSENT_VERSION } from '../lib/constants/consent';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

// ---------------------------------------------------------------------------
// Blocker 1 — § 4 FAGG-Vertragsinformationen vollständig & unveränderbar
// ---------------------------------------------------------------------------
describe('Blocker 1 · § 4 FAGG-Vertragsinformationen', () => {
  const snap = buildContractSnapshot({
    productName: '360°-Spiegel',
    priceCents: 19900,
    currency: 'eur',
    orderNumber: 'CC-2001',
    purchaseId: 'aaaa1111-bbbb-cccc-dddd-eeeeeeeeeeee',
    purchasedAt: new Date('2026-06-18T10:00:00Z'),
    consentVersion: CONSENT_VERSION,
    consents: [{ type: 'widerruf_verzicht', acceptedAt: '2026-06-18T09:59:00Z' }],
  });

  it('Snapshot trägt alle fünf § 4-Bausteine', () => {
    expect(snap.serviceTerms.leistungsbeschreibung).toBeTruthy();
    expect(snap.serviceTerms.bereitstellung).toBe(BEREITSTELLUNG);
    expect(snap.serviceTerms.gewaehrleistung).toBe(GEWAEHRLEISTUNG);
    expect(snap.serviceTerms.funktionalitaet).toBe(FUNKTIONALITAET_KOMPATIBILITAET);
    expect(snap.serviceTerms.nutzungHaftung).toBe(NUTZUNG_HAFTUNG_VERFUEGBARKEIT);
  });

  it('E-Mail rendert die § 4-Bedingungen INLINE (nicht nur als Link)', () => {
    const mail = buildOrderConfirmationEmail({
      firstName: 'Alex',
      appUrl: 'https://coachcheck.humatrix.cc',
      assessmentId: 'ffff0000-1111-2222-3333-444444444444',
      snapshot: snap,
    });
    expect(mail.html).toMatch(/(?:&sect;|§)\s?4 FAGG/);
    expect(mail.html).toMatch(/Bereitstellung/);
    expect(mail.html).toMatch(/Gew&auml;hrleistung|Gewährleistung/);
    expect(mail.html).toMatch(/Kompatibilit/);
    expect(mail.html).toMatch(/Haftung/);
    // Hauptmerkmale produktspezifisch enthalten.
    expect(mail.html).toMatch(/Fremdeinsch/);
    // Hinweis auf angehängtes PDF + eingefrorene Fassung.
    expect(mail.html).toMatch(/PDF/);
    expect(mail.html).toContain(AGB_VERSION);
  });

  it('serviceDescriptionFor liefert ehrliche, produktspezifische Texte ohne Heilsversprechen', () => {
    const schnell = serviceDescriptionFor('Schnelltest');
    const spiegel = serviceDescriptionFor('360° Spiegel');
    const team = serviceDescriptionFor('TeamCheck');
    expect(schnell).not.toBe(spiegel);
    expect(spiegel).toMatch(/Fremd/);
    expect(team).toMatch(/Team|Begleitung/);
    for (const t of [schnell, spiegel, team]) {
      expect(t).not.toMatch(/garantiert/i);
      expect(t).not.toMatch(/sieg|gewinn(en|t)/i);
      expect(t).not.toMatch(/psychometrisch valid/i);
    }
  });

  it('Vertrags-PDF-Renderer ist vorhanden und exportiert', () => {
    const doc = read('lib', 'pdf', 'contract-document.tsx');
    expect(doc).toMatch(/renderContractDocument/);
    expect(doc).toMatch(/ContractSnapshot/);
  });
});

// ---------------------------------------------------------------------------
// Blocker 2 — atomare Freischaltung (transaktionale DB-Funktion + Selbstheilung)
// ---------------------------------------------------------------------------
describe('Blocker 2 · Atomare Freischaltung', () => {
  it('Migration 35 definiert finalize_order_confirmation transaktional', () => {
    const m = read('supabase', 'migrations', '35_contract_finalize_and_withdrawal_retry.sql');
    expect(m).toMatch(/create or replace function public\.finalize_order_confirmation/);
    expect(m).toMatch(/update public\.purchases/);
    expect(m).toMatch(/update public\.assessments/);
    expect(m).toMatch(/awaiting_contract_confirmation/);
    // Rechte nur für service_role.
    expect(m).toMatch(/grant execute on function public\.finalize_order_confirmation/);
  });

  it('order-confirmation ruft die RPC statt zweier Einzel-Updates', () => {
    const oc = read('lib', 'email', 'order-confirmation.ts');
    expect(oc).toMatch(/\.rpc\('finalize_order_confirmation'/);
    expect(oc).not.toMatch(/status: 'pending'/);
  });

  it('Retry repariert bestätigte, aber gesperrte Käufe selbst (Szenario A)', () => {
    const r = read('app', 'api', 'internal', 'confirmation-retry', 'route.ts');
    expect(r).toMatch(/repaired/);
    expect(r).toMatch(/awaiting_contract_confirmation/);
  });
});

// ---------------------------------------------------------------------------
// Blocker 3 — gespeicherter Consent-Wortlaut + strikte Validierung
// ---------------------------------------------------------------------------
describe('Blocker 3 · Gespeicherter Consent-Wortlaut', () => {
  it('Snapshot friert den GESPEICHERTEN Wortlaut ein (nicht die Code-Konstante)', () => {
    const stored = 'INDIVIDUELL GESPEICHERTER WORTLAUT v3_35 — nur in diesem Kauf.';
    const snap = buildContractSnapshot({
      productName: 'Selbsttest',
      priceCents: 7900,
      currency: 'eur',
      orderNumber: 'CC-2099',
      purchaseId: '22221111-2222-3333-4444-555555555555',
      purchasedAt: new Date('2026-06-18T08:00:00Z'),
      consentVersion: CONSENT_VERSION,
      consents: [{ type: 'widerruf_verzicht', acceptedAt: '2026-06-18T07:59:00Z', text: stored }],
    });
    const w = snap.consents.find((c) => c.type === 'widerruf_verzicht');
    expect(w?.text).toBe(stored);
    expect(w?.text).not.toBe(CONSENT_TEXTS.widerruf_verzicht);
  });

  it('Fehlender gespeicherter Text fällt auf Code-Konstante zurück (Altbestellung)', () => {
    const snap = buildContractSnapshot({
      productName: 'Selbsttest',
      priceCents: 7900,
      currency: 'eur',
      orderNumber: 'CC-2098',
      purchaseId: '33331111-2222-3333-4444-555555555555',
      purchasedAt: new Date('2026-06-18T08:00:00Z'),
      consentVersion: null,
      consents: [{ type: 'agb', acceptedAt: '2026-06-18T07:59:00Z' }],
    });
    expect(snap.consents.find((c) => c.type === 'agb')?.text).toBe(CONSENT_TEXTS.agb);
  });

  it('order-confirmation liest consent_text und validiert strikt', () => {
    const oc = read('lib', 'email', 'order-confirmation.ts');
    expect(oc).toMatch(/consent_text/);
    expect(oc).toMatch(/validateConsents/);
    expect(oc).toMatch(/REQUIRED_CONSENTS/);
  });
});

// ---------------------------------------------------------------------------
// Blocker 4 — Online-Widerruf belastbar
// ---------------------------------------------------------------------------
describe('Blocker 4 · Online-Widerruf belastbar', () => {
  it('Route verlangt mindestens eine Vertragsidentifikation', () => {
    const r = read('app', 'api', 'widerruf', 'route.ts');
    expect(r).toMatch(/orderRefStr/);
    expect(r).toMatch(/productHintStr/);
    expect(r).toMatch(/!orderRefStr && !productHintStr/);
    expect(r).toMatch(/Identifizierung/);
  });

  it('Eingangsbestätigung enthält Inhalt der Erklärung + Freitext', () => {
    const built = renderWithdrawalConfirmationEmail({
      ref: 'WD-ABCD1234',
      firstName: 'Sam',
      fullName: 'Sam Beispiel',
      email: 'sam@example.com',
      orderRef: 'CC-1042',
      productHint: '360° Spiegel',
      note: 'Bitte um Rückmeldung per E-Mail.',
      receivedAtLabel: '18.06.2026, 14:32 Uhr (MEZ/MESZ)',
    });
    expect(built.html).toContain(WIDERRUF_FORMEL);
    expect(built.html).toMatch(/CC-1042/);
    expect(built.html).toMatch(/360° Spiegel/);
    expect(built.html).toMatch(/Bitte um R/);
    expect(built.html).toMatch(/Inhalt deiner Widerrufserkl/);
    expect(built.declarationText).toContain(WIDERRUF_FORMEL);
    expect(built.declarationText).toMatch(/Bestellnummer: CC-1042/);
    expect(built.declarationText).toMatch(/Anmerkung des Kunden/);
  });

  it('buildWithdrawalDeclaration ist stabil ohne optionale Felder', () => {
    const txt = buildWithdrawalDeclaration({
      fullName: 'Nur Name',
      email: 'a@b.de',
      productHint: 'Schnelltest',
      receivedAtLabel: 'X',
    });
    expect(txt).toContain(WIDERRUF_FORMEL);
    expect(txt).toMatch(/Produkt: Schnelltest/);
    expect(txt).not.toMatch(/Anmerkung des Kunden/);
  });

  it('Route persistiert declaration_full und plant Retry bei Sendefehler', () => {
    const r = read('app', 'api', 'widerruf', 'route.ts');
    expect(r).toMatch(/declaration_full/);
    expect(r).toMatch(/confirmation_next_retry_at/);
    expect(r).toMatch(/confirmationEmailSent/);
  });

  it('Retry-Cron für Widerrufsbestätigungen existiert und ist geschützt', () => {
    const r = read('app', 'api', 'internal', 'withdrawal-retry', 'route.ts');
    expect(r).toMatch(/CRON_SECRET/);
    expect(r).toMatch(/Bearer \$\{secret\}/);
    expect(r).toMatch(/renderWithdrawalConfirmationEmail/);
    expect(r).toMatch(/confirmation_sent_at/);
  });

  it('Cron ist in vercel.json registriert', () => {
    const v = read('vercel.json');
    expect(v).toMatch(/withdrawal-retry/);
  });

  it('Formular: Button heißt "Widerruf bestätigen" und validiert Identifikation', () => {
    const f = read('app', 'widerruf', 'widerruf-form.tsx');
    expect(f).toMatch(/Widerruf bestätigen/);
    expect(f).not.toMatch(/Widerruf absenden/);
    expect(f).toMatch(/!orderRef\.trim\(\) && !productHint\.trim\(\)/);
    expect(f).toMatch(/confirmationEmailSent/);
  });

  it('Migration 35 ergänzt Widerruf-Retry-Spalten', () => {
    const m = read('supabase', 'migrations', '35_contract_finalize_and_withdrawal_retry.sql');
    expect(m).toMatch(/confirmation_attempts/);
    expect(m).toMatch(/confirmation_last_error/);
    expect(m).toMatch(/confirmation_next_retry_at/);
    expect(m).toMatch(/declaration_full/);
  });
});

// ---------------------------------------------------------------------------
// Blocker 5/6/7 — Versionen & ehrliche Rechts-/Datenschutztexte
// ---------------------------------------------------------------------------
describe('Blocker 5 · Versionen aktualisiert', () => {
  it('AGB- und Consent-Version sind auf den 18. Juni 2026 gesetzt', () => {
    expect(AGB_VERSION).toBe('18. Juni 2026');
    expect(CONSENT_VERSION).toBe('2026-06-18');
  });
  it('AGB-Seite zeigt den neuen Stand', () => {
    const agb = read('app', 'legal', 'agb', 'page.tsx');
    expect(agb).toMatch(/Stand: 18\. Juni 2026/);
    expect(agb).not.toMatch(/Stand: Mai 2026/);
  });
});

describe('Blocker 6 · Rechnungstext entspricht der Realität', () => {
  it('AGB versprechen keine automatische PDF-Rechnung mehr', () => {
    const agb = read('app', 'legal', 'agb', 'page.tsx');
    expect(agb).not.toMatch(/Rechnungen werden elektronisch als PDF bereitgestellt/);
    expect(agb).toMatch(/auf Anfrage/);
  });
});

describe('Blocker 7 · Log-Retention entspricht der Realität', () => {
  it('Datenschutz behauptet keine 14-Tage-Löschung mehr', () => {
    const ds = read('app', 'legal', 'datenschutz', 'page.tsx');
    expect(ds).not.toMatch(/nach 14 Tagen automatisch gelöscht/);
    expect(ds).not.toMatch(/Technische Logs:<\/strong> 14 Tage/);
    expect(ds).toMatch(/Aufbewahrungsfristen unserer Infrastruktur/);
    expect(ds).toMatch(/Stand: 18\. Juni 2026/);
  });
});
