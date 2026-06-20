import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Marken-Konsistenz (Bernies Entscheidung v3_55: „CoachCheck überall").
 * Der Produktname ist überall „CoachCheck" — der frühere Zweitname „Humatrix Coach"
 * darf in keinem kundenseitigen Quelltext mehr vorkommen. Die FIRMA „Humatrix"
 * (Anbieter, Footer, Logo, Mail-Domain) bleibt davon unberührt und muss erhalten sein.
 */

const ROOTS = ['app', 'components', 'lib'];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('Marken-Konsistenz: CoachCheck überall', () => {
  const files = ROOTS.flatMap((r) => walk(r));

  it('kein kundenseitiger Quelltext enthält noch den Zweitnamen „Humatrix Coach"', () => {
    const offenders = files.filter((f) => readFileSync(f, 'utf-8').includes('Humatrix Coach'));
    expect(offenders, `„Humatrix Coach" gefunden in:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('die Firma „Humatrix" bleibt erhalten (Footer-Spalte + Copyright)', () => {
    const de = readFileSync('lib/i18n/dictionaries/de.ts', 'utf-8');
    expect(de).toMatch(/Humatrix/);
    expect(de).toMatch(/The Mind Club Company/);
  });

  it('der Produktname „CoachCheck" ist im sichtbaren Erlebnis präsent (i18n-Wörterbuch)', () => {
    // Sichtbare UI-Strings liegen seit der Zweisprachigkeit im i18n-Wörterbuch.
    const de = readFileSync('lib/i18n/dictionaries/de.ts', 'utf-8');
    const en = readFileSync('lib/i18n/dictionaries/en.ts', 'utf-8');
    expect(de).toMatch(/CoachCheck/);
    expect(en).toMatch(/CoachCheck/);
  });
});
