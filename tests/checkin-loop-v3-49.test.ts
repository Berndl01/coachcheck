import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const MIG = read('supabase', 'migrations', '43_action_checkins.sql');
const ROUTE = read('app', 'api', 'action', '[planId]', 'route.ts');
const TRACKER = read('components', 'assessment', 'focus-tracker.tsx');
const DASH = read('app', 'dashboard', 'page.tsx');
const DE = read('lib', 'i18n', 'dictionaries', 'de.ts');

// ============================================================
// Migration 43 — action_checkins (Bestcase §12)
// ============================================================
describe('Migration 43 · action_checkins', () => {
  it('genau ein Check-in pro Plan und Tag', () => {
    expect(MIG).toMatch(/create table if not exists public\.action_checkins/);
    expect(MIG).toMatch(/checkin_date date not null/);
    expect(MIG).toMatch(/unique \(plan_id, checkin_date\)/);
  });
  it('RLS: nur Owner-SELECT, keine Schreib-Policy', () => {
    expect(MIG).toMatch(/action_checkins_owner_select.*\n?.*for select to authenticated using \(auth\.uid\(\) = user_id\)/s);
    expect(MIG).toMatch(/cmd in \('INSERT', 'UPDATE', 'DELETE'\)/);
  });
});

// ============================================================
// Route — Check-in / Undo / Abschluss, Ownership via Plan
// ============================================================
describe('Plan-Route /api/action/[planId]', () => {
  it('POST (Check-in), DELETE (Undo), PATCH (Abschluss) vorhanden', () => {
    expect(ROUTE).toMatch(/export async function POST/);
    expect(ROUTE).toMatch(/export async function DELETE/);
    expect(ROUTE).toMatch(/export async function PATCH/);
  });
  it('prüft Eigentum über action_plans.user_id', () => {
    expect(ROUTE).toMatch(/loadOwnedPlan/);
    expect(ROUTE).toMatch(/data\.user_id !== userId/);
  });
  it('Check-in nur bei aktivem Fokus, Upsert auf (plan_id, heute)', () => {
    expect(ROUTE).toMatch(/plan\.status !== 'active'/);
    expect(ROUTE).toMatch(/onConflict:\s*'plan_id,checkin_date'/);
    expect(ROUTE).toMatch(/todayISO\(\)/);
  });
  it('Abschluss setzt status=completed + completed_at, via service_role', () => {
    expect(ROUTE).toMatch(/status:\s*'completed'/);
    expect(ROUTE).toMatch(/completed_at/);
    expect(ROUTE).toMatch(/createAdminClient\(\)/);
  });
  it('rührt kein Scoring an', () => {
    expect(ROUTE).not.toMatch(/axis_scores\s*:/);
  });
});

// ============================================================
// FocusTracker (Client)
// ============================================================
describe('FocusTracker', () => {
  it('Client-Component mit Check-in, Undo, Abschluss', () => {
    expect(TRACKER).toMatch(/'use client'/);
    expect(TRACKER).toMatch(/method:\s*'POST'/);
    expect(TRACKER).toMatch(/method:\s*'DELETE'/);
    expect(TRACKER).toMatch(/method:\s*'PATCH'/);
    expect(DE).toMatch(/Heute erledigt/);
    expect(TRACKER).toMatch(/focusTracker\.doneToday/);
  });
  it('zeigt Fortschritt (X von Ziel-Tagen) und Streak', () => {
    expect(DE).toMatch(/von \{target\} Tagen/);
    expect(TRACKER).toMatch(/focusTracker\.progressLine/);
    expect(TRACKER).toMatch(/streak/);
  });
  it('ruft die Plan-Route auf', () => {
    expect(TRACKER).toMatch(/\/api\/action\/\$\{planId\}/);
  });
});

// ============================================================
// Dashboard-Einbindung
// ============================================================
describe('Dashboard · Check-in-Schleife', () => {
  it('lädt Check-ins und berechnet Fortschritt/Streak serverseitig', () => {
    expect(DASH).toMatch(/from\('action_checkins'\)/);
    expect(DASH).toMatch(/focusProgress/);
    expect(DASH).toMatch(/streak/);
  });
  it('rendert den interaktiven FocusTracker', () => {
    expect(DASH).toMatch(/from '@\/components\/assessment\/focus-tracker'/);
    expect(DASH).toMatch(/<FocusTracker/);
  });
});
