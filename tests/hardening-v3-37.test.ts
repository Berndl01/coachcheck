import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isAssessmentActivated, ACTIVE_ASSESSMENT_STATUSES } from '../lib/assessment/activation-gate';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

// ---------------------------------------------------------------------------
// Blocker 1 — Aktivierungssperre in ALLEN Assessment-APIs + Item-RPC
// ---------------------------------------------------------------------------
describe('Blocker 1 · Aktivierungssperre serverseitig', () => {
  it('Helper akzeptiert nur freigeschaltete Zustände', () => {
    expect(isAssessmentActivated('pending')).toBe(true);
    expect(isAssessmentActivated('in_progress')).toBe(true);
    expect(isAssessmentActivated('awaiting_contract_confirmation')).toBe(false);
    expect(isAssessmentActivated('completed')).toBe(false);
    expect(isAssessmentActivated('report_ready')).toBe(false);
    expect(isAssessmentActivated('archived')).toBe(false);
    expect(isAssessmentActivated(null)).toBe(false);
    expect([...ACTIVE_ASSESSMENT_STATUSES]).toEqual(['pending', 'in_progress']);
  });

  it('Answer-Route blockiert nicht-aktivierte Assessments (409)', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'answer', 'route.ts');
    expect(r).toMatch(/isAssessmentActivated/);
    expect(r).toMatch(/assessment not activated/);
    // alte, zu schwache Terminal-only-Prüfung ist weg
    expect(r).not.toMatch(/assessment already finalized/);
  });

  it('Finalize-Route blockiert nicht-aktivierte Assessments (409)', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'finalize', 'route.ts');
    expect(r).toMatch(/isAssessmentActivated/);
    expect(r).toMatch(/assessment not activated/);
  });

  it('Context-Route blockiert nicht-aktivierte Assessments (409)', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'context', 'route.ts');
    expect(r).toMatch(/isAssessmentActivated/);
    expect(r).toMatch(/status/); // Status wird jetzt geladen
  });

  it('Item-RPC (Migration 36) liefert nur für freigeschaltete Assessments', () => {
    const m = read('supabase', 'migrations', '36_activation_gate_enforcement.sql');
    expect(m).toMatch(/get_items_for_assessment/);
    expect(m).toMatch(/a\.status in \('pending', 'in_progress'\)/);
  });

  it('Contract-Gate-Trigger erzwingt die Sperre auf DB-Ebene', () => {
    const m = read('supabase', 'migrations', '36_activation_gate_enforcement.sql');
    expect(m).toMatch(/trg_enforce_contract_gate/);
    expect(m).toMatch(/enforce_contract_gate/);
    expect(m).toMatch(/app\.finalizing/);
    expect(m).toMatch(/awaiting_contract_confirmation/);
  });
});

// ---------------------------------------------------------------------------
// Blocker 2 — Stripe-Link-Fehler sperrt keinen zahlenden Kunden mehr aus
// ---------------------------------------------------------------------------
describe('Blocker 2 · Webhook-Verknüpfung selbstheilend', () => {
  it('Webhook sucht vor Insert nach vorhandenem Assessment (purchase_id)', () => {
    const w = read('app', 'api', 'stripe', 'webhook', 'route.ts');
    expect(w).toMatch(/\.eq\('purchase_id', purchaseId\)/);
    expect(w).toMatch(/orphan/i);
  });

  it('Webhook gibt bei Link-Fehler 500 zurück (statt nur zu loggen)', () => {
    const w = read('app', 'api', 'stripe', 'webhook', 'route.ts');
    expect(w).toMatch(/Purchase\/assessment link failed/);
    expect(w).toMatch(/status: 500/);
  });

  it('Retry relinkt verwaiste Käufe und repariert über die Finalize-RPC', () => {
    const r = read('app', 'api', 'internal', 'confirmation-retry', 'route.ts');
    expect(r).toMatch(/relinked/);
    expect(r).toMatch(/is\('assessment_id', null\)/);
    expect(r).toMatch(/finalize_order_confirmation/);
    // direkter awaiting→pending-Update ist entfernt (nur noch via RPC)
    expect(r).not.toMatch(/update\(\{ status: 'pending' \}\)/);
  });

  it('Retry eskaliert hängende Bestätigungen an den Betreiber', () => {
    const r = read('app', 'api', 'internal', 'confirmation-retry', 'route.ts');
    expect(r).toMatch(/escalat/i);
    expect(r).toMatch(/admin_escalated_at/);
  });
});

// ---------------------------------------------------------------------------
// finalize_order_confirmation Härtung + Snapshot-Persistenz
// ---------------------------------------------------------------------------
describe('Härtung · finalize + Snapshot + Consent', () => {
  it('finalize_order_confirmation prüft Zuordnung und bricht sonst ab', () => {
    const m = read('supabase', 'migrations', '36_activation_gate_enforcement.sql');
    expect(m).toMatch(/v_belongs/);
    expect(m).toMatch(/raise exception/i);
    expect(m).toMatch(/gehoert nicht zu Purchase/);
    expect(m).toMatch(/set_config\('app\.finalizing'/);
  });

  it('Snapshot-Speicherfehler verhindert Versand + Freischaltung', () => {
    const oc = read('lib', 'email', 'order-confirmation.ts');
    expect(oc).toMatch(/snapErr/);
    expect(oc).toMatch(/snapshot persist failed/);
  });

  it('E-Mail behauptet NICHT mehr, die vollständige AGB sei im PDF', () => {
    const oc = read('lib', 'email', 'order-confirmation.ts');
    expect(oc).not.toMatch(/im angeh&auml;ngten PDF enthalten/);
    expect(oc).not.toMatch(/vollst&auml;ndige Vertragsdokument h&auml;ngt/);
    // weiterhin ehrlicher Verweis auf die vollständige AGB
    expect(oc).toMatch(/vollst&auml;ndige AGB ansehen/);
  });

  it('Consent-Validierung verlangt Version und verbietet Duplikate', () => {
    const oc = read('lib', 'email', 'order-confirmation.ts');
    expect(oc).toMatch(/version fehlt/);
    expect(oc).toMatch(/doppelter consent/);
  });

  it('Migration 36 erzwingt eindeutige Checkout-Consents', () => {
    const m = read('supabase', 'migrations', '36_activation_gate_enforcement.sql');
    expect(m).toMatch(/consent_checkout_type_unique/);
    expect(m).toMatch(/checkout_attempt_id is not null/);
  });
});
