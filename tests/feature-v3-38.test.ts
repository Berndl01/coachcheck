import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildOperatingManual, buildPlayerTypeMatrix } from '../lib/insight/operating-manual';
import { buildFallbackReport } from '../lib/ai/report-prompt';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const ARCH = {
  name_de: 'Der Strukturgeber',
  short_trait: 'klar, berechenbar, verlässlich',
  kernmuster: 'Führung über Standards und Berechenbarkeit.',
  staerken: ['Klarheit', 'Verlässlichkeit', 'Standardsicherheit', 'Konsequenz'],
  risiken: ['Kontrolle unter Druck', 'begrenzte Anschlussfähigkeit'],
  entwicklungshebel: ['Anschlussfähigkeit', 'Aktivierung'],
};

const SCORES_STRUKTUR = {
  struktur_intuition: 78, autoritaet_beteiligung: 62, leistung_beziehung: 69,
  stabilisierung_aktivierung: 60, standardisierung_anpassung: 64,
};
const SCORES_BEZIEHUNG = {
  struktur_intuition: 35, autoritaet_beteiligung: 38, leistung_beziehung: 32,
  stabilisierung_aktivierung: 45, standardisierung_anpassung: 40,
};

describe('Bedienungsanleitung (deterministisch)', () => {
  it('liefert alle Karten-Felder, max. 3 Stärken', () => {
    const m = buildOperatingManual(ARCH, SCORES_STRUKTUR);
    expect(m.ueberschrift).toBe('Der Strukturgeber');
    expect(m.kernsatz.length).toBeGreaterThan(10);
    expect(m.staerken.length).toBe(3);
    for (const k of ['unterDruck', 'soErreichstDuMich', 'soGibstDuFeedback', 'vermeide'] as const) {
      expect(typeof m[k]).toBe('string');
      expect(m[k].length).toBeGreaterThan(10);
    }
  });

  it('passt sich an die Achsen an (Struktur vs. Beziehung unterscheidbar)', () => {
    const a = buildOperatingManual(ARCH, SCORES_STRUKTUR);
    const b = buildOperatingManual(ARCH, SCORES_BEZIEHUNG);
    expect(a.unterDruck).not.toBe(b.unterDruck);
    expect(a.soErreichstDuMich).not.toBe(b.soErreichstDuMich);
  });

  it('funktioniert auch ohne Achsenwerte (Default 50)', () => {
    const m = buildOperatingManual(ARCH);
    expect(m.kernsatz.length).toBeGreaterThan(0);
    expect(m.soGibstDuFeedback.length).toBeGreaterThan(0);
  });
});

describe('Wirkung je Spielertyp (Matrix)', () => {
  it('liefert genau vier benannte Typen mit Wirkung + Anpassung', () => {
    const matrix = buildPlayerTypeMatrix(ARCH, SCORES_STRUKTUR);
    expect(matrix.length).toBe(4);
    const namen = matrix.map((m) => m.spielertyp);
    expect(namen).toContain('Der selbstbewusste Leistungsträger');
    expect(namen).toContain('Der unsichere, zurückhaltende Spieler');
    for (const m of matrix) {
      expect(m.wirkung.length).toBeGreaterThan(20);
      expect(m.anpassung.length).toBeGreaterThan(15);
    }
  });
});

describe('Report-Pipeline integriert die neuen Felder', () => {
  it('Fallback-Report enthält bedienungsanleitung + wirkung_je_spielertyp', () => {
    const r = buildFallbackReport({
      primaryArchetype: ARCH,
      axisScores: SCORES_STRUKTUR,
      productTier: 2,
    } as any);
    expect(r.bedienungsanleitung?.kernsatz).toBeTruthy();
    expect(Array.isArray(r.wirkung_je_spielertyp)).toBe(true);
    expect(r.wirkung_je_spielertyp?.length).toBe(4);
  });

  it('KI-Ausgabe wird zentral ergänzt (Merge vorhanden)', () => {
    const p = read('lib', 'ai', 'report-prompt.ts');
    expect(p).toMatch(/parsed\.wirkung_je_spielertyp = buildPlayerTypeMatrix/);
    expect(p).toMatch(/parsed\.bedienungsanleitung = buildOperatingManual/);
  });

  it('PDF rendert beide neuen Abschnitte', () => {
    const pdf = read('lib', 'pdf', 'report-document.tsx');
    expect(pdf).toMatch(/Wirkung je Spielertyp/);
    expect(pdf).toMatch(/Deine Bedienungsanleitung/);
    expect(pdf).toMatch(/wirkung_je_spielertyp/);
    expect(pdf).toMatch(/bedienungsanleitung/);
  });

  it('Ergebnisseite rendert beide Abschnitte + Teilen-Button', () => {
    const page = read('app', 'assessment', '[id]', 'result', 'page.tsx');
    expect(page).toMatch(/ShareCardButton/);
    expect(page).toMatch(/Derselbe Stil, vier Wirkungen/);
    expect(page).toMatch(/So arbeitet man am besten mit dir/);
  });
});

describe('Teilbare Karte — Sicherheit', () => {
  it('Share-API ist Eigentümer-gebunden + nur für fertige Ergebnisse', () => {
    const api = read('app', 'api', 'assessment', '[id]', 'share', 'route.ts');
    expect(api).toMatch(/eq\('user_id', user\.id\)/);
    expect(api).toMatch(/SHAREABLE_STATUSES/);
    expect(api).toMatch(/randomUUID/);
    expect(api).toMatch(/assessment not shareable yet/);
  });

  it('Öffentliche Karte liest nur freigegebene, nicht-sensible Felder', () => {
    const card = read('app', 'karte', '[token]', 'page.tsx');
    expect(card).toMatch(/eq\('share_enabled', true\)/);
    // KEINE sensiblen Felder im Select
    expect(card).not.toMatch(/email/i);
    expect(card).not.toMatch(/answers/);
    expect(card).not.toMatch(/fremdbild/i);
    expect(card).toMatch(/index: false/); // nicht indexieren
  });

  it('Migration 37 legt Token + Unique-Index an', () => {
    const m = read('supabase', 'migrations', '37_shareable_profile_card.sql');
    expect(m).toMatch(/share_token/);
    expect(m).toMatch(/share_enabled/);
    expect(m).toMatch(/assessments_share_token_unique/);
  });
});
