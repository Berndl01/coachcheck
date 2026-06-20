import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const MIG = read('supabase', 'migrations', '41_result_feedback.sql');
const ROUTE = read('app', 'api', 'assessment', '[id]', 'feedback', 'route.ts');
const WIDGET = read('components', 'assessment', 'recognition-feedback.tsx');
const RESULT = read('app', 'assessment', '[id]', 'result', 'page.tsx');
const DE_DICT = read('lib', 'i18n', 'dictionaries', 'de.ts');

// ============================================================
// Migration 41 — Tabelle + Constraints + RLS (Bestcase §27)
// ============================================================
describe('Migration 41 · result_feedback', () => {
  it('legt Tabelle mit recognition 0–10 und Unique pro Assessment an', () => {
    expect(MIG).toMatch(/create table if not exists public\.result_feedback/);
    expect(MIG).toMatch(/recognition smallint not null check \(recognition >= 0 and recognition <= 10\)/);
    expect(MIG).toMatch(/unique \(assessment_id\)/);
  });
  it('RLS an, nur Owner-SELECT, KEINE Schreib-Policy für authenticated', () => {
    expect(MIG).toMatch(/alter table public\.result_feedback enable row level security/);
    expect(MIG).toMatch(/result_feedback_owner_select.*\n?.*for select to authenticated using \(auth\.uid\(\) = user_id\)/s);
    expect(MIG).not.toMatch(/for insert/i);
    expect(MIG).not.toMatch(/for update/i);
  });
  it('Verifikationsblock erzwingt: keine Schreib-Policy', () => {
    expect(MIG).toMatch(/cmd in \('INSERT', 'UPDATE', 'DELETE'\)/);
  });
});

// ============================================================
// Route — Auth, Validierung, Upsert via service_role, KEIN Scoring
// ============================================================
describe('Feedback-Route', () => {
  it('verlangt Login und Eigentum am Assessment', () => {
    expect(ROUTE).toMatch(/auth\.getUser\(\)/);
    expect(ROUTE).toMatch(/\.eq\('user_id', user\.id\)/);
    expect(ROUTE).toMatch(/status:\s*401/);
  });
  it('validiert recognition 0–10 per Zod', () => {
    expect(ROUTE).toMatch(/recognition:\s*z\.number\(\)\.int\(\)\.min\(0\)\.max\(10\)/);
  });
  it('schreibt per service_role als Upsert in result_feedback', () => {
    expect(ROUTE).toMatch(/createAdminClient\(\)/);
    expect(ROUTE).toMatch(/\.from\('result_feedback'\)\s*\n?\s*\.upsert/);
    expect(ROUTE).toMatch(/onConflict:\s*'assessment_id'/);
  });
  it('rührt NIE Scoring/Archetyp an (§27: Feedback ändert Ergebnis nicht)', () => {
    // Zuweisungsform prüfen (feld:), damit der Prosa-Kommentar nicht fälschlich trifft.
    expect(ROUTE).not.toMatch(/axis_scores\s*:/);
    expect(ROUTE).not.toMatch(/primary_archetype_id\s*:/);
    expect(ROUTE).not.toMatch(/secondary_archetype_id\s*:/);
    expect(ROUTE).not.toMatch(/maturity_scores\s*:/);
    // schreibt NICHT in die assessments-Tabelle
    expect(ROUTE).not.toMatch(/from\('assessments'\)[\s\S]{0,80}\.update/);
  });
  it('erlaubt Feedback nur nach Abschluss', () => {
    expect(ROUTE).toMatch(/ALLOWED_STATUSES/);
    expect(ROUTE).toMatch(/status:\s*409/);
  });
});

// ============================================================
// Widget — 0–10-Skala + hilfreichster Abschnitt
// ============================================================
describe('RecognitionFeedback-Widget', () => {
  it('ist ein Client-Component mit 0–10-Skala', () => {
    expect(WIDGET).toMatch(/'use client'/);
    expect(WIDGET).toMatch(/length:\s*11/);
    expect(DE_DICT).toMatch(/Wie gut erkennst du dich/);
    expect(WIDGET).toMatch(/recognitionFeedback\.h3/);
  });
  it('postet an die Feedback-Route', () => {
    expect(WIDGET).toMatch(/\/api\/assessment\/\$\{assessmentId\}\/feedback/);
    expect(WIDGET).toMatch(/most_helpful/);
  });
});

// ============================================================
// Result-Seite — lädt vorhandenes Feedback + rendert Widget
// ============================================================
describe('Result-Seite Einbindung', () => {
  it('lädt vorhandenes Feedback serverseitig und rendert das Widget', () => {
    expect(RESULT).toMatch(/from '@\/components\/assessment\/recognition-feedback'/);
    expect(RESULT).toMatch(/from\('result_feedback'\)/);
    expect(RESULT).toMatch(/<RecognitionFeedback/);
  });
});

// ============================================================
// Doku — Migrationen jetzt 01 → 41
// ============================================================
describe('Deployment-Doku enthält Migration 41', () => {
  for (const d of ['GO-LIVE.md', 'LAUNCH_CHECKLIST.md', 'README.md']) {
    it(`${d}: beschreibt Migration 41`, () => {
      const r = read(d);
      // Der Header-Migrationsstand wandert mit jeder neuen Migration und wird vom
      // jeweils neuesten Test geprüft; hier nur die dauerhafte 41er-Beschreibung.
      expect(r).toMatch(/Migration 41 \(neu\)/);
      expect(r).toMatch(/result_feedback/);
    });
  }
});
