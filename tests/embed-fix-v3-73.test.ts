import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { getInviterProfile } from '../lib/invitations/inviter-profile';

const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// Statischer Regressions-Guard: der verschachtelte assessments→profiles-Embed
// darf in AUSFÜHRBAREM Code (in einem .select(...)) nie wieder auftauchen.
// (Im Doku-Kommentar des Helfers steht das Muster bewusst — das ist kein
//  .select() und wird daher korrekt nicht erfasst.)
// ---------------------------------------------------------------------------
function walk(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (['.ts', '.tsx'].includes(extname(p))) out.push(p);
  }
  return out;
}

const BROKEN = 'parent_assessment_id(profile:user_id(';

describe('v3.73 — PostgREST-Embed-Bug bleibt behoben (Regressions-Guard)', () => {
  const files = [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'lib'))];

  it('kein .select() im Code enthält den verschachtelten assessments→profiles-Embed', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (line.includes('.select(') && line.includes(BROKEN)) {
          offenders.push(`${f.replace(ROOT + '/', '')}:${i + 1}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('die drei betroffenen Stellen nutzen den robusten Helfer', () => {
    const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');
    const einschaetzung = read('app', 'einschaetzung', '[token]', 'page.tsx');
    const teamcheck = read('app', 'teamcheck', '[token]', 'page.tsx');
    const emails = read('lib', 'email', 'progress-emails.ts');
    for (const src of [einschaetzung, teamcheck, emails]) {
      expect(src).toContain('getInviterProfile');
    }
  });
});

// ---------------------------------------------------------------------------
// Helfer-Verhalten: FK-Inferenz-unabhängige Zwei-Schritt-Auflösung.
// ---------------------------------------------------------------------------
type Row = Record<string, unknown> | null;

function mockAdmin(byTable: Record<string, Row>) {
  const calls: { table: string; col?: string; val?: unknown }[] = [];
  const client = {
    from(table: string) {
      const ctx: { table: string; col?: string; val?: unknown } = { table };
      calls.push(ctx);
      const builder = {
        select() { return builder; },
        eq(col: string, val: unknown) { ctx.col = col; ctx.val = val; return builder; },
        async maybeSingle() { return { data: byTable[table] ?? null, error: null }; },
      };
      return builder;
    },
  };
  return { client: client as unknown as Parameters<typeof getInviterProfile>[0], calls };
}

describe('getInviterProfile — robuste Zwei-Schritt-Auflösung', () => {
  it('ohne parentAssessmentId → null, ohne DB-Zugriff', async () => {
    const { client, calls } = mockAdmin({});
    expect(await getInviterProfile(client, null)).toBeNull();
    expect(await getInviterProfile(client, undefined)).toBeNull();
    expect(calls.length).toBe(0);
  });

  it('löst full_name / sport / club über assessment.user_id → profile auf', async () => {
    const { client, calls } = mockAdmin({
      assessments: { user_id: 'u-1' },
      profiles: { full_name: 'Mara Vogt', sport: 'fussball', club: 'SV Beispiel' },
    });
    const res = await getInviterProfile(client, 'a-1');
    expect(res).toEqual({ fullName: 'Mara Vogt', sport: 'fussball', club: 'SV Beispiel' });
    expect(calls.map((c) => c.table)).toEqual(['assessments', 'profiles']);
    expect(calls[0]).toMatchObject({ col: 'id', val: 'a-1' });
    expect(calls[1]).toMatchObject({ col: 'id', val: 'u-1' });
  });

  it('fehlendes Assessment → null (kein profiles-Lookup)', async () => {
    const { client, calls } = mockAdmin({ assessments: null });
    expect(await getInviterProfile(client, 'a-x')).toBeNull();
    expect(calls.map((c) => c.table)).toEqual(['assessments']);
  });

  it('fehlendes Profil → null', async () => {
    const { client } = mockAdmin({ assessments: { user_id: 'u-2' }, profiles: null });
    expect(await getInviterProfile(client, 'a-2')).toBeNull();
  });

  it('Null-/fehlende Felder im Profil werden zu null normalisiert', async () => {
    const { client } = mockAdmin({ assessments: { user_id: 'u-3' }, profiles: {} });
    expect(await getInviterProfile(client, 'a-3')).toEqual({ fullName: null, sport: null, club: null });
  });
});
