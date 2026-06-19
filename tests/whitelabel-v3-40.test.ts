import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

describe('White-Label · kein Claude/KI/Opus in der Produkt-UI', () => {
  const files = [
    ['app', 'assessment', '[id]', 'result', 'page.tsx'],
    ['components', 'assessment', 'report-generate-button.tsx'],
    ['app', 'archetyp', '[slug]', 'personal-section.tsx'],
  ];
  for (const f of files) {
    it(`${f.join('/')} nennt weder Claude noch Opus`, () => {
      const s = read(...f);
      expect(s).not.toMatch(/Claude/);
      expect(s).not.toMatch(/Opus/);
    });
  }

  it('Button zeigt keinen "KI ausgelastet"-Text mehr', () => {
    const s = read('components', 'assessment', 'report-generate-button.tsx');
    expect(s).not.toMatch(/KI war kurz ausgelastet/);
    expect(s).not.toMatch(/KI erstellt deinen Report/);
  });
});

describe('Report-Erstellung liefert bei nicht verfügbarem Dienst aus den Daten', () => {
  it('Kein "ausgelastet"-503-Block mehr in der Report-Route', () => {
    const s = read('app', 'api', 'assessment', '[id]', 'report', 'route.ts');
    expect(s).not.toMatch(/ai_unavailable_retryable/);
    expect(s).not.toMatch(/Dienst ist gerade ausgelastet/);
    // Der Fallback fließt jetzt in die normale Auslieferung (ai_fallback bleibt gesetzt).
    expect(s).toMatch(/ai_fallback: gen\.fallback/);
  });
});
