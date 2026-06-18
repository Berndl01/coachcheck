import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Quell-Ebenen-Invariante (v3_29):
 *
 * Das Coach-Selbstassessment darf NIEMALS Spieler-Items (player_item=true)
 * enthalten — weder über die Lesequelle (get_items_for_assessment) noch über
 * die Schreibquelle (/api/assessment/[id]/answer). Diese Items gehören
 * ausschließlich in den Einladungs-Flow.
 *
 * Hintergrund: get_items_for_assessment lieferte für TeamCheck (Tier 4) 89 statt
 * der beworbenen 77 Items, weil player_item nicht gefiltert wurde. Dieser Test
 * nagelt den Fix auf Quell-Ebene fest, damit ein künftiger Refactor den Filter
 * nicht still wieder entfernt.
 */

const ROOT = process.cwd();

function latestRpcDefinition(): { file: string; body: string } {
  const dir = join(ROOT, 'supabase', 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  let found: { file: string; body: string } | null = null;
  for (const f of files) {
    const sql = readFileSync(join(dir, f), 'utf8');
    // Nur ECHTE Funktionskörper, keine Kommentar-Erwähnungen.
    const re =
      /create\s+or\s+replace\s+function\s+public\.get_items_for_assessment[\s\S]*?\$\$;/gi;
    const matches = sql.match(re);
    if (matches && matches.length > 0) {
      found = { file: f, body: matches[matches.length - 1] };
    }
  }
  if (!found) throw new Error('Keine Definition von get_items_for_assessment gefunden');
  return found;
}

describe('Coach-Selbstassessment schließt Spieler-Items aus (Lesequelle)', () => {
  it('die JÜNGSTE get_items_for_assessment-Definition filtert player_item = false', () => {
    const { file, body } = latestRpcDefinition();
    const normalized = body.replace(/\s+/g, ' ').toLowerCase();
    expect(
      /player_item\s*=\s*false/.test(normalized),
      `Letzte Definition steht in ${file}, filtert aber player_item nicht`,
    ).toBe(true);
  });

  it('die jüngste Definition stammt aus Migration 26 oder später', () => {
    const { file } = latestRpcDefinition();
    const num = parseInt(file.slice(0, 2), 10);
    expect(num).toBeGreaterThanOrEqual(26);
  });
});

describe('Coach-Selbstassessment schließt Spieler-Items aus (Schreibquelle)', () => {
  const route = readFileSync(
    join(ROOT, 'app', 'api', 'assessment', '[id]', 'answer', 'route.ts'),
    'utf8',
  );

  it('die answer-Route selektiert player_item', () => {
    expect(route).toMatch(/select\([^)]*player_item/s);
  });

  it('die answer-Route lehnt player_item=true ab', () => {
    const normalized = route.replace(/\s+/g, ' ');
    expect(normalized).toMatch(/player_item\s*===\s*true/);
  });
});
