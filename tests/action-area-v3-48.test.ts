import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const MIG = read('supabase', 'migrations', '42_action_plans.sql');
const ROUTE = read('app', 'api', 'assessment', '[id]', 'action', 'route.ts');
const CARD = read('components', 'assessment', 'action-focus-card.tsx');
const RESULT = read('app', 'assessment', '[id]', 'result', 'page.tsx');
const DASH = read('app', 'dashboard', 'page.tsx');
const DE = read('lib', 'i18n', 'dictionaries', 'de.ts');

// ============================================================
// Migration 42 — action_plans (Bestcase §11/§12/§24)
// ============================================================
describe('Migration 42 · action_plans', () => {
  it('Tabelle mit Status-Enum und Ziel-Tagen', () => {
    expect(MIG).toMatch(/create table if not exists public\.action_plans/);
    expect(MIG).toMatch(/status text not null default 'active' check \(status in \('active', 'completed', 'archived'\)\)/);
    expect(MIG).toMatch(/target_days smallint not null default 7/);
  });
  it('höchstens ein aktiver Fokus pro Nutzer+Assessment (Partial-Unique)', () => {
    expect(MIG).toMatch(/create unique index if not exists ux_action_plans_one_active/);
    expect(MIG).toMatch(/where status = 'active'/);
  });
  it('RLS: nur Owner-SELECT, keine Schreib-Policy', () => {
    expect(MIG).toMatch(/action_plans_owner_select.*\n?.*for select to authenticated using \(auth\.uid\(\) = user_id\)/s);
    expect(MIG).toMatch(/cmd in \('INSERT', 'UPDATE', 'DELETE'\)/); // Verifikationsblock
  });
});

// ============================================================
// Route — POST setzt/ersetzt, DELETE entfernt; service_role; kein Scoring
// ============================================================
describe('Aktions-Route', () => {
  it('POST und DELETE vorhanden, Auth + Eigentum + Abschluss-Gate', () => {
    expect(ROUTE).toMatch(/export async function POST/);
    expect(ROUTE).toMatch(/export async function DELETE/);
    expect(ROUTE).toMatch(/auth\.getUser\(\)/);
    expect(ROUTE).toMatch(/\.eq\('user_id', user\.id\)/);
    expect(ROUTE).toMatch(/ALLOWED_STATUSES/);
  });
  it('validiert per Zod (Titel + Aktion mit Längengrenzen)', () => {
    expect(ROUTE).toMatch(/title:\s*z\.string\(\)\.trim\(\)\.min\(1\)\.max\(160\)/);
    expect(ROUTE).toMatch(/action:\s*z\.string\(\)\.trim\(\)\.min\(1\)\.max\(600\)/);
  });
  it('schreibt via service_role nur in action_plans, nie ins Scoring', () => {
    expect(ROUTE).toMatch(/createAdminClient\(\)/);
    expect(ROUTE).toMatch(/\.from\('action_plans'\)/);
    expect(ROUTE).not.toMatch(/axis_scores\s*:/);
    expect(ROUTE).not.toMatch(/from\('assessments'\)[\s\S]{0,80}\.update/);
  });
  it('hält genau einen aktiven Fokus (Update-in-place statt Konflikt)', () => {
    expect(ROUTE).toMatch(/\.eq\('status', 'active'\)/);
  });
});

// ============================================================
// Fokus-Karte (Client)
// ============================================================
describe('ActionFocusCard', () => {
  it('Client-Component mit Setzen und Entfernen', () => {
    expect(CARD).toMatch(/'use client'/);
    expect(CARD).toMatch(/method:\s*'POST'/);
    expect(CARD).toMatch(/method:\s*'DELETE'/);
    expect(DE).toMatch(/Als 7-Tage-Fokus setzen/);
    expect(CARD).toMatch(/actionFocus\.set/);
  });
  it('postet an die Aktions-Route mit Quelle signature_lever', () => {
    expect(CARD).toMatch(/\/api\/assessment\/\$\{assessmentId\}\/action/);
    expect(CARD).toMatch(/signature_lever/);
  });
});

// ============================================================
// Einbindung Ergebnis + Dashboard
// ============================================================
describe('Aktionsbereich-Einbindung', () => {
  it('Ergebnis-Seite lädt aktiven Plan und rendert die Karte mit dem Hebel', () => {
    expect(RESULT).toMatch(/from '@\/components\/assessment\/action-focus-card'/);
    expect(RESULT).toMatch(/from\('action_plans'\)/);
    expect(RESULT).toMatch(/<ActionFocusCard/);
    expect(RESULT).toMatch(/lever=\{signature\.lever\}/);
  });
  it('Dashboard lädt aktive Foki und zeigt eine Fokus-Zone', () => {
    expect(DASH).toMatch(/from\('action_plans'\)/);
    // UI-Text liegt seit i18n im Woerterbuch; Komponente referenziert den Key.
    expect(DE).toMatch(/Aktiver Fokus/);
    expect(DASH).toMatch(/dashboard\.activeFocus/);
    // Die Fokus-Karte selbst (inkl. „7-Tage-Fokus"-Label) wird ab v3_49 vom
    // FocusTracker-Component gerendert.
  });
});

// ============================================================
// Doku
// ============================================================
describe('Deployment-Doku enthält Migration 42', () => {
  for (const d of ['GO-LIVE.md', 'LAUNCH_CHECKLIST.md', 'README.md']) {
    it(`${d}: beschreibt Migration 42`, () => {
      const r = read(d);
      // Header-Migrationsstand wandert mit jeder neuen Migration (vom neuesten Test
      // geprüft); hier nur die dauerhafte 42er-Beschreibung.
      expect(r).toMatch(/Migration 42 \(neu\)/);
      expect(r).toMatch(/action_plans/);
    });
  }
});
