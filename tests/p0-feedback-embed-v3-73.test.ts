import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

// Alle .ts/.tsx unter app/ und lib/ einsammeln.
function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(join(ROOT, dir))) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const rel = join(dir, name);
    const st = statSync(join(ROOT, rel));
    if (st.isDirectory()) walk(rel, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(rel);
  }
  return acc;
}

const sourceFiles = [...walk('app'), ...walk('lib')];

// Reine Kommentarzeilen entfernen (Konvention wie in den übrigen P0-Tests): die
// Gefahr ist ein AUSFÜHRBARES Embed, nicht ein Kommentar, der den Fix erklärt.
const stripComments = (code: string) =>
  code
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
    })
    .join('\n');

// ---------------------------------------------------------------------------
// P0 — assessments → profiles ist über PostgREST NICHT einbettbar.
//
// Realität (Migration 01): profiles.id → auth.users(id) UND
// assessments.user_id → auth.users(id). Es gibt KEINEN direkten FK
// assessments → profiles. Ein verschachteltes Embed wie
//   assessment:parent_assessment_id(profile:user_id(full_name, sport))
// löst `user_id` auf den FK → auth.users auf; full_name/sport existieren dort
// nicht → die GESAMTE Abfrage scheitert (data = null). Vorher wurde der Fehler
// verschluckt: Einladungsseiten zeigten „ungültig", Rater-Reminders versendeten nie.
// Fix: getrennte Einzelabfragen invitations → assessments.user_id → profiles.
// ---------------------------------------------------------------------------
describe('P0 · kein nicht-auflösbares assessments→profiles-Embed mehr', () => {
  it('KEINE Quelldatei verschachtelt profile:user_id(...) in einem PostgREST-Select', () => {
    const offenders: string[] = [];
    for (const f of sourceFiles) {
      const code = stripComments(read(f));
      // Verschachteltes Embed eines Profils über die user_id-Spalte (die auf
      // auth.users zeigt) — exakt das kaputte Muster.
      if (/profile\s*:\s*user_id\s*\(/.test(code)) offenders.push(f);
    }
    expect(offenders, `Verbotenes Embed in: ${offenders.join(', ')}`).toEqual([]);
  });

  it('KEINE Quelldatei bettet assessment(...) mit verschachteltem profile(...) ein', () => {
    const offenders: string[] = [];
    for (const f of sourceFiles) {
      const code = stripComments(read(f));
      if (/assessment[^()]*\([^)]*profile[^()]*:/.test(code)) offenders.push(f);
    }
    expect(offenders, `Verbotenes Embed in: ${offenders.join(', ')}`).toEqual([]);
  });

  for (const f of [
    'app/teamcheck/[token]/page.tsx',
    'app/einschaetzung/[token]/page.tsx',
    'lib/email/progress-emails.ts',
  ]) {
    it(`${f}: lädt das Profil getrennt über public.profiles`, () => {
      const code = read(f);
      expect(code).toMatch(/\.from\('profiles'\)/);
      expect(code).toMatch(/\.from\('assessments'\)/);
      // Fehler der Einladungsabfrage wird nicht mehr still verschluckt.
      expect(code).toMatch(/invitationError|rowsError/);
    });
  }
});
