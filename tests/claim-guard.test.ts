import { describe, it, expect } from 'vitest';
import { softenText, softenDeep } from '@/lib/knowledge/claim-guard';

describe('softenText', () => {
  it('leaves claim-safe text untouched and reports no hits', () => {
    const clean = 'Das Profil zeigt Hinweise auf eine analytische, reflexive Arbeitsweise.';
    const { text, hits } = softenText(clean);
    expect(text).toBe(clean);
    expect(hits).toHaveLength(0);
  });

  it('replaces a success guarantee', () => {
    const { text, hits } = softenText('Dieses System garantiert mehr Siege.');
    expect(text.toLowerCase()).not.toContain('garantiert mehr siege');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('softens "mental schwach"', () => {
    const { text } = softenText('Der Trainer wirkt mental schwach.');
    expect(text.toLowerCase()).not.toContain('mental schwach');
  });

  it('softens a diagnosis verb', () => {
    const { text } = softenText('Das Modell diagnostiziert eine Schwäche.');
    expect(text.toLowerCase()).not.toContain('diagnostiziert');
  });
});

describe('softenDeep', () => {
  it('walks nested objects/arrays and aggregates the audit', () => {
    const input = {
      summary: 'garantiert mehr Siege im nächsten Jahr',
      sections: [{ body: 'Der Spieler ist mental schwach.' }, { body: 'sauberer Text' }],
      meta: { tier: 2 },
    };
    const { value, audit } = softenDeep(input);
    expect(audit.clean).toBe(false);
    expect(audit.hits.length).toBeGreaterThan(0);
    expect((value.sections[1] as { body: string }).body).toBe('sauberer Text');
    expect(value.meta.tier).toBe(2); // Nicht-Strings bleiben unverändert
    expect(JSON.stringify(value).toLowerCase()).not.toContain('mental schwach');
  });

  it('reports clean=true for fully claim-safe content', () => {
    const { audit } = softenDeep({ a: 'wissenschaftlich fundierte Coaching-Hypothese', b: ['analytisch', 'reflexiv'] });
    expect(audit.clean).toBe(true);
    expect(audit.hits).toHaveLength(0);
  });
});
