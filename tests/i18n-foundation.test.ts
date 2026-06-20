import { describe, it, expect } from 'vitest';
import { de } from '@/lib/i18n/dictionaries/de';
import { en } from '@/lib/i18n/dictionaries/en';
import { makeT } from '@/lib/i18n';
import { defaultLocale } from '@/lib/i18n/config';

/** Sammelt alle Punktpfade eines verschachtelten Wörterbuch-Objekts. */
function keyPaths(obj: unknown, prefix = ''): string[] {
  if (obj && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      keyPaths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

describe('i18n-Fundament (zweisprachig DE/EN)', () => {
  it('Deutsch bleibt Standardsprache', () => {
    expect(defaultLocale).toBe('de');
  });

  it('DE und EN haben exakt dieselbe Schlüsselstruktur (keine Lücke)', () => {
    const deKeys = keyPaths(de).sort();
    const enKeys = keyPaths(en).sort();
    const missingInEn = deKeys.filter((k) => !enKeys.includes(k));
    const missingInDe = enKeys.filter((k) => !deKeys.includes(k));
    expect(missingInEn, `Fehlt in EN:\n${missingInEn.join('\n')}`).toEqual([]);
    expect(missingInDe, `Fehlt in DE:\n${missingInDe.join('\n')}`).toEqual([]);
  });

  it('alle Werte sind nicht-leere Strings (DE und EN)', () => {
    const allStrings = (o: unknown): boolean =>
      o && typeof o === 'object'
        ? Object.values(o as Record<string, unknown>).every(allStrings)
        : typeof o === 'string' && o.length > 0;
    expect(allStrings(de)).toBe(true);
    expect(allStrings(en)).toBe(true);
  });

  it('t() liefert die richtige Sprache und fällt bei fehlendem Key auf den Key zurück', () => {
    expect(makeT('de')('nav.products')).toBe('Pakete');
    expect(makeT('en')('nav.products')).toBe('Packages');
    expect(makeT('en')('does.not.exist')).toBe('does.not.exist');
  });
});
