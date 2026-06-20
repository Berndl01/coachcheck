import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { classifyProfile, profileHeadline, MIX_DOMINANCE_THRESHOLD, type Archetype } from '@/lib/scoring';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const A = (code: string): Archetype => ({ id: 1, code, name_de: `Der ${code}`, axis_profile: {} });
const dist = (primaryD: number, secondaryD: number) => [
  { archetype: A('Architekt'), distance: primaryD },
  { archetype: A('Motivator'), distance: secondaryD },
];

// ============================================================
// Kern: deterministische Mischprofil-Klassifikation (Bestcase §9)
// ============================================================
describe('classifyProfile', () => {
  it('gleich nahe Archetypen → mixed', () => {
    const c = classifyProfile(dist(0.30, 0.30));
    expect(c.type).toBe('mixed');
    expect(c.dominance).toBeCloseTo(0, 5);
  });

  it('klar getrennt (Primär viel näher) → dominant', () => {
    const c = classifyProfile(dist(0.10, 0.50));
    expect(c.type).toBe('dominant');
    expect(c.dominance).toBeGreaterThan(MIX_DOMINANCE_THRESHOLD);
  });

  it('knapp unter der Schwelle → mixed', () => {
    // dominance = (d2-d1)/d2 soll knapp < THRESHOLD liegen
    const d2 = 0.40;
    const d1 = d2 * (1 - (MIX_DOMINANCE_THRESHOLD - 0.02));
    const c = classifyProfile(dist(d1, d2));
    expect(c.dominance).toBeLessThan(MIX_DOMINANCE_THRESHOLD);
    expect(c.type).toBe('mixed');
  });

  it('knapp über der Schwelle → dominant', () => {
    const d2 = 0.40;
    const d1 = d2 * (1 - (MIX_DOMINANCE_THRESHOLD + 0.05));
    const c = classifyProfile(dist(d1, d2));
    expect(c.dominance).toBeGreaterThan(MIX_DOMINANCE_THRESHOLD);
    expect(c.type).toBe('dominant');
  });

  it('perfekter Sitz auf Primär (d1=0) → dominant', () => {
    const c = classifyProfile(dist(0, 0.4));
    expect(c.type).toBe('dominant');
    expect(c.dominance).toBeCloseTo(1, 5);
  });

  it('beide Distanzen 0 (degenerate) → mixed, kein NaN/Crash', () => {
    const c = classifyProfile(dist(0, 0));
    expect(c.type).toBe('mixed');
    expect(Number.isFinite(c.dominance)).toBe(true);
  });

  it('gap = d2 - d1', () => {
    const c = classifyProfile(dist(0.2, 0.35));
    expect(c.gap).toBeCloseTo(0.15, 5);
  });
});

describe('profileHeadline', () => {
  it('mixed nennt ausdrücklich die Mischung', () => {
    const c = classifyProfile(dist(0.3, 0.3));
    expect(profileHeadline(c)).toMatch(/Mischprofil aus .* und /);
  });
  it('dominant nennt Primär mit Zweittendenz, NICHT „eindeutig"', () => {
    const h = profileHeadline(classifyProfile(dist(0.1, 0.6)));
    expect(h).toMatch(/Zweittendenz/);
    expect(h).not.toMatch(/eindeutig/);
  });
});

// ============================================================
// Sweep: dieselbe Einordnung überall (Bestcase §10 Konsistenz)
// ============================================================
describe('Mischprofil-Sweep über alle Consumer', () => {
  it('finalize berechnet + speichert profile in signature (kanonisch)', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'finalize', 'route.ts');
    expect(r).toMatch(/classifyProfile\(distances\)/);
    expect(r).toMatch(/signature:\s*\{\s*axes:\s*signature,\s*profile\s*\}/);
    expect(r).toMatch(/headline:\s*profileHeadline/);
  });

  it('Result-Seite liest gespeicherten Typ und reicht ihn an die Enthüllung', () => {
    const r = read('app', 'assessment', '[id]', 'result', 'page.tsx');
    expect(r).toMatch(/signature as any\)\?\.profile/);
    expect(r).toMatch(/isMixedProfile/);
    // Die „Mischprofil aus X und Y"-Formulierung liegt jetzt im Reveal-Component;
    // die Seite reicht den Typ via Prop hinein.
    expect(r).toMatch(/isMixed=\{isMixedProfile\}/);
  });

  it('Report-Route nutzt DIESELBE Funktion (classifyProfile) und reicht profileType durch', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'report', 'route.ts');
    expect(r).toMatch(/classifyProfile\(\[/);
    expect(r).toMatch(/profileType,/);
  });

  it('Report-Prompt entscheidet Mischtyp über profileType (Fallback Delta)', () => {
    const r = read('lib', 'ai', 'report-prompt.ts');
    expect(r).toMatch(/profileType\?:\s*'dominant'\s*\|\s*'mixed'/);
    expect(r).toMatch(/input\.profileType === 'mixed'/);
    expect(r).toMatch(/MISCHPROFIL-HINWEIS/);
    // Alte rein-absolute Schwelle als alleinige Entscheidung darf es nicht mehr geben
    expect(r).not.toMatch(/MISCHTYP-HINWEIS: Distanz-Differenz/);
  });

  it('PDF kennt profileType und rendert Mischprofil-Label', () => {
    const r = read('lib', 'pdf', 'report-document.tsx');
    expect(r).toMatch(/profileType\?:\s*'dominant'\s*\|\s*'mixed'/);
    expect(r).toMatch(/isMixedProfile/);
    expect(r).toMatch(/Mischprofil/);
  });

  it('PDF-Fulltest deckt den Mischprofil-Renderpfad ab', () => {
    const r = read('scripts', 'pdf-fulltest.mjs');
    expect(r).toMatch(/profileType:\s*'mixed'/);
  });
});
