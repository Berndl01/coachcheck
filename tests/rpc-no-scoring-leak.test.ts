import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

/**
 * v3_32: Die security-definer-RPCs dürfen auf DB-Ebene KEINE Scoring-Metadaten
 * mehr liefern (axis_weights/reverse_scored/Optionsgewichte/Paket-Interna).
 * Empirisch gegen echte DB bewiesen; dieser Test nagelt die Migration fest,
 * damit der Rückgabetyp nicht still wieder auf `setof items` zurückfällt.
 */
const mig30 = read('supabase', 'migrations', '30_rpc_strip_scoring_metadata.sql');
const FORBIDDEN = ['axis_weights', 'reverse_scored', 'package_tiers', 'created_at'];

describe('Migration 30 — RPCs liefern keine Scoring-Metadaten', () => {
  it('ersetzt setof items durch einen restriktiven table-Rückgabetyp', () => {
    expect(mig30).toMatch(/drop function if exists public\.get_items_for_assessment\(uuid\)/i);
    expect(mig30).toMatch(/drop function if exists public\.get_items_for_invitation\(text\)/i);
    expect(mig30).toMatch(/returns table\s*\(/i);
    expect(mig30).not.toMatch(/returns setof public\.items/i);
  });

  it('der deklarierte Rückgabetyp enthält keine Scoring-Spalten', () => {
    // Bereich zwischen den beiden "returns table (" und dem schließenden ")"
    const tableBlocks = mig30.match(/returns table\s*\(([^)]*)\)/gi) ?? [];
    expect(tableBlocks.length).toBeGreaterThanOrEqual(2);
    for (const block of tableBlocks) {
      for (const col of FORBIDDEN) {
        expect(block.toLowerCase()).not.toContain(col);
      }
      // Anzeige-Felder müssen vorhanden sein
      expect(block).toMatch(/\bid\b/);
      expect(block).toMatch(/format/);
      expect(block).toMatch(/options/);
    }
  });

  it('strippt Optionsgewichte über strip_option_weights (nur key/text)', () => {
    expect(mig30).toMatch(/function public\.strip_option_weights/i);
    expect(mig30).toMatch(/'key',\s*o->>'key'/);
    expect(mig30).toMatch(/'text',\s*o->>'text'/);
    expect(mig30).toMatch(/strip_option_weights\(i\.options\)/);
  });

  it('Assertion bricht ab, falls Scoring-Spalten auftauchen', () => {
    expect(mig30).toMatch(/raise exception 'RPC liefert weiterhin Scoring-Spalten/i);
  });
});

describe('Landing-Zitate sind faktisch korrekt (verifiziert)', () => {
  const sci = read('components', 'landing', 'science-foundation.tsx');
  it('Cooke et al. ist nicht als Review ausgewiesen', () => {
    // Cooke-Zeile darf nicht das Wort "Review" tragen
    const cookeLine = sci.split('\n').find((l) => l.includes('Cooke et al.')) ?? '';
    expect(cookeLine).not.toMatch(/Review/);
    expect(cookeLine).toMatch(/qualitative Studie/);
  });
  it('Vella et al. (systematisches Review) ist als Quelle geführt', () => {
    expect(sci).toMatch(/Vella et al\..*systematisches Review/);
  });
  it('Glandorf ist als 2023 geführt', () => {
    const glandorf = sci.split('\n').find((l) => l.includes('Glandorf')) ?? '';
    expect(glandorf).toMatch(/year:\s*2023/);
  });
});
