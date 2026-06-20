import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');
const CARD = read('app', 'karte', '[token]', 'page.tsx');

// ============================================================
// Coach Card: Zweittendenz + Mischprofil (Bestcase §16) — Abschluss
// des in v3_44 bewusst ausgesparten Mischprofil-Konsistenzpunkts.
// ============================================================
describe('Coach Card · Zweittendenz + Mischprofil', () => {
  it('lädt Sekundär-Archetyp und gespeicherten Profiltyp', () => {
    expect(CARD).toMatch(/secondary:secondary_archetype_id\(name_de, short_trait\)/);
    expect(CARD).toMatch(/signature/);
    expect(CARD).toMatch(/profile\?\.type/);
  });

  it('zeigt die starke Zweittendenz auf der Karte', () => {
    expect(CARD).toMatch(/Starke Zweittendenz/);
    expect(CARD).toMatch(/secondary\.name_de/);
  });

  it('ist mischprofil-bewusst (konsistent zu Result/PDF)', () => {
    expect(CARD).toMatch(/isMixed/);
    expect(CARD).toMatch(/Mischprofil mit/);
  });

  it('zeigt §16-konform genau zwei Stärken', () => {
    expect(CARD).toMatch(/manual\.staerken\.slice\(0,\s*2\)/);
  });

  it('Datenschutz-Invariante: keine Scores/Team/Fremdbild auf der Karte', () => {
    // Es werden keine numerischen Achsen-/Score-Werte oder Team-/Fremdbilddaten gerendert.
    expect(CARD).not.toMatch(/axis_scores\}/);          // keine Score-Ausgabe
    expect(CARD).not.toMatch(/fremdbild/i);
    expect(CARD).not.toMatch(/teamcheck|team_scores/i);
    expect(CARD).not.toMatch(/\bemail\b/i);
    // weiterhin als Hypothese gerahmt
    expect(CARD).toMatch(/keine Diagnose/);
  });

  it('Mischprofil-Quelle ist der gespeicherte signature.profile (kein Neuberechnen)', () => {
    expect(CARD).toMatch(/signature as any\)\?\.profile\?\.type/);
  });
});
