import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');
const MIG = read('supabase', 'migrations', '38_security_paywall_anonymity.sql');

describe('Blocker 1 · Saison-Paywall (Tier 5)', () => {
  it('Migration 38 bindet seasons an einen Kauf + entfernt Schreib-RLS', () => {
    expect(MIG).toMatch(/seasons\s+add column if not exists purchase_id/);
    expect(MIG).toMatch(/seasons_purchase_unique/);
    expect(MIG).toMatch(/drop policy if exists "seasons_owner_all"/);
    expect(MIG).toMatch(/seasons_owner_select/);
  });

  it('seasons/create erzwingt bezahlten Tier-5-Kauf serverseitig (kein assessment_id-Bypass)', () => {
    const r = read('app', 'api', 'seasons', 'create', 'route.ts');
    expect(r).toMatch(/tier5/);
    expect(r).toMatch(/erfordert ein gekauftes/);
    expect(r).toMatch(/purchase_id: purchaseId/);
    // Kein "nur prüfen, wenn assessment_id übergeben" mehr
    expect(r).not.toMatch(/if \(assessment_id\) \{/);
  });
});

describe('Blocker 2 · Pulse-Anonymität (>= 5)', () => {
  it('compute_pulse_snapshot gibt unter 5 Antworten keine Dimensionen aus', () => {
    expect(MIG).toMatch(/compute_pulse_snapshot/);
    expect(MIG).toMatch(/>= 5/);
    expect(MIG).toMatch(/below_threshold/);
  });
  it('detect_pulse_trends verlangt in BEIDEN Zyklen >= 5', () => {
    expect(MIG).toMatch(/detect_pulse_trends/);
    expect((MIG.match(/response_count'\)::int, 0\) < 5/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

describe('Blocker 3 · Token gibt keine gespeicherten Antworten zurück', () => {
  for (const [p, file] of [
    ['einschaetzung', 'page.tsx'],
    ['teamcheck', 'page.tsx'],
    ['pulse', 'page.tsx'],
  ] as const) {
    it(`${p}: kein Vorladen von Einzelantworten`, () => {
      const s = read('app', p, '[token]', file);
      expect(s).not.toMatch(/\.from\('invitation_answers'\)/);
      expect(s).not.toMatch(/\.eq\('respondent_token', token\)/);
    });
  }
});

describe('Blocker 4 · Invitation-API gehärtet', () => {
  it('owner darf einzelne Pulse-Antworten nicht mehr direkt lesen', () => {
    expect(MIG).toMatch(/drop policy if exists "pulse_responses_owner_select"/);
  });
  it('create-Route: nur fremdbild, Tier-Prüfung unbedingt', () => {
    const r = read('app', 'api', 'invitations', 'create', 'route.ts');
    expect(r).toMatch(/nur Fremdbild-Einladungen/);
    expect(r).toMatch(/invitation_type: 'fremdbild'/);
    // Tier-Check nicht mehr an invitation_type === 'fremdbild' gekoppelt
    expect(r).not.toMatch(/invitation_type === 'fremdbild' && tier < 3/);
  });
  it('DB-Check verbietet Spieler-Einladung mit E-Mail', () => {
    expect(MIG).toMatch(/invitations_spieler_no_email/);
    expect(MIG).toMatch(/invitation_type <> 'spieler' or invited_email is null/);
  });
});

describe('Weitere Fixes', () => {
  it('Freigabe-Token wird beim Deaktivieren rotiert (alter Link stirbt)', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'share', 'route.ts');
    expect(r).toMatch(/share_enabled: false, share_token: null/);
  });
  it('Personalisierung leakt keine Provider-Fehler an den Browser', () => {
    const r = read('app', 'api', 'archetyp', 'personalize', 'route.ts');
    expect(r).not.toMatch(/AI-Fehler:/);
    expect(r).toMatch(/vorübergehend nicht erstellt werden/);
  });
  it('PDF: Spielertyp-Karten brechen nicht über Seiten (wrap=false)', () => {
    const pdf = read('lib', 'pdf', 'report-document.tsx');
    expect(pdf).toMatch(/styles\.moduleCard\} wrap=\{false\}/);
  });
});
