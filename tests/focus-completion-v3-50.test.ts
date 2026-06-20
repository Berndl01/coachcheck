import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const TRACKER = read('components', 'assessment', 'focus-tracker.tsx');
const DASH = read('app', 'dashboard', 'page.tsx');
const DE = read('lib', 'i18n', 'dictionaries', 'de.ts');

// ============================================================
// Abschluss-Würdigung + nächster Fokus (Bestcase §11/§12, Baustein 3)
// ============================================================
describe('FocusTracker · Abschluss würdigen statt stumm verschwinden', () => {
  it('hat einen Abschluss-Zustand mit Würdigung', () => {
    expect(TRACKER).toMatch(/completed/);
    expect(DE).toMatch(/Fokus abgeschlossen/);
    expect(TRACKER).toMatch(/focusTracker\.completedKicker/);
    expect(DE).toMatch(/drangeblieben/);
    expect(TRACKER).toMatch(/focusTracker\.completedTitle/);
  });
  it('Abschluss zeigt Erfolgskarte (kein sofortiges router.refresh im PATCH)', () => {
    // complete() setzt den Abschluss-Zustand; refresh erst über „Fertig".
    expect(TRACKER).toMatch(/setCompleted\(true\)/);
  });
  it('bietet direkt einen neuen Fokus an (Link zum Ergebnis)', () => {
    expect(DE).toMatch(/Neuen Fokus setzen/);
    expect(TRACKER).toMatch(/focusTracker\.newFocus/);
    expect(TRACKER).toMatch(/\/assessment\/\$\{assessmentId\}\/result/);
  });
});

// ============================================================
// Fokus-Historie auf dem Dashboard
// ============================================================
describe('Dashboard · Fokus-Historie', () => {
  it('lädt abgeschlossene Foki', () => {
    expect(DASH).toMatch(/completedFoci/);
    expect(DASH).toMatch(/\.eq\('status', 'completed'\)/);
    expect(DASH).toMatch(/order\('completed_at'/);
  });
  it('rendert eine Historie-Sektion mit Tage-Zahl', () => {
    expect(DE).toMatch(/Abgeschlossene Foki/);
    expect(DASH).toMatch(/dashboard\.completedFoci/);
    expect(DASH).toMatch(/focusProgress\(f\.id\)\.count/);
  });
  it('Check-in-Load deckt aktive UND abgeschlossene Pläne ab', () => {
    expect(DASH).toMatch(/\.\.\.\(activeFoci \?\? \[\]\)\.map/);
    expect(DASH).toMatch(/\.\.\.\(completedFoci \?\? \[\]\)\.map/);
  });
});

// ============================================================
// Slice nutzt vorhandenes Schema — keine neue Migration
// ============================================================
describe('Kein neues Schema in dieser Slice', () => {
  it('es gibt keine Migration 44', () => {
    expect(existsSync(join(ROOT, 'supabase', 'migrations', '44_focus_completion.sql'))).toBe(false);
  });
});
