import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Quell-Ebenen-Invarianten (v3_31): RLS-Härtung answers/items/invitations,
 * IP-Schutz (kein axis_weights im Browser), Webhook-Schärfung, Widerruf-Consent.
 * Bewiesen gegen echte DB; diese Tests verhindern stillen Rückfall.
 */
const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');
const allMigrations = readdirSync(join(ROOT, 'supabase', 'migrations'))
  .filter((f) => f.endsWith('.sql')).sort()
  .map((f) => read('supabase', 'migrations', f)).join('\n').toLowerCase();

describe('RLS-Lockdown answers / items / invitations (Migration)', () => {
  it('entfernt answers-Schreibpolicies', () => {
    expect(allMigrations).toMatch(/drop policy if exists answers_insert_own on public\.answers/);
    expect(allMigrations).toMatch(/drop policy if exists answers_update_own on public\.answers/);
  });
  it('entfernt items_read_auth (Pool nicht direkt lesbar)', () => {
    expect(allMigrations).toMatch(/drop policy if exists items_read_auth on public\.items/);
  });
  it('entfernt invitations_insert_owner', () => {
    expect(allMigrations).toMatch(/drop policy if exists invitations_insert_owner on public\.invitations/);
  });
  it('get_items_for_assessment prüft Assessment-Eigentum', () => {
    expect(allMigrations).toMatch(/a\.user_id\s*=\s*auth\.uid\(\)/);
  });
  it('Antworten sind nach Abschluss unveränderbar (Trigger)', () => {
    expect(allMigrations).toMatch(/block_answer_changes_when_finalized/);
    expect(allMigrations).toMatch(/trg_answers_immutable_after_finalize/);
  });
});

describe('Schreib-/Lesepfade laufen über service_role', () => {
  it('answer-Route liest Items über admin, nicht über den User-Client', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'answer', 'route.ts');
    expect(r).toMatch(/await admin\s*\.from\('items'\)/s);
    expect(r).not.toMatch(/await supabase\s*\.from\('items'\)/s);
  });
  it('invitation create + bulk schreiben über admin', () => {
    expect(read('app', 'api', 'invitations', 'create', 'route.ts')).toMatch(/await admin\s*\.from\('invitations'\)\s*\.insert/s);
    expect(read('app', 'api', 'invitations', 'bulk', 'route.ts')).toMatch(/await admin\s*\.from\('invitations'\)\s*\.insert/s);
  });
});

describe('IP-Schutz: keine Scoring-Metadaten im Browser', () => {
  it('Client-Item-Typ enthält kein axis_weights/reverse_scored', () => {
    const t = read('components', 'assessment', 'item-renderer.tsx');
    expect(t).not.toMatch(/axis_weights:/);
    expect(t).not.toMatch(/reverse_scored:/);
  });
  it('Sanitizer existiert und gibt keine Optionsgewichte aus', () => {
    const s = read('lib', 'utils', 'sanitize-items.ts');
    expect(s).toMatch(/sanitizeItemsForClient/);
    // Die zurückgegebenen Options enthalten nur key/text — kein weights-Feld.
    expect(s).not.toMatch(/weights:/);
    expect(s).toMatch(/key:\s*String/);
    expect(s).toMatch(/text:\s*String/);
  });
  it('Runner-Seiten sanitizen vor der Übergabe', () => {
    for (const p of [
      ['app', 'assessment', '[id]', 'page.tsx'],
      ['app', 'einschaetzung', '[token]', 'page.tsx'],
      ['app', 'teamcheck', '[token]', 'page.tsx'],
    ]) {
      expect(read(...p)).toMatch(/sanitizeItemsForClient/);
    }
  });
});

describe('Webhook-Schärfung & Checkout', () => {
  const wh = read('app', 'api', 'stripe', 'webhook', 'route.ts');
  it('prüft payment_status === paid', () => {
    expect(wh.replace(/\s+/g, ' ')).toMatch(/session\.payment_status\s*!==\s*'paid'/);
  });
  it('entzieht nur bei voller Rückerstattung', () => {
    expect(wh).toMatch(/amount_refunded/);
    expect(wh).toMatch(/isFullRefund/);
  });
  it('Checkout erzwingt Widerruf-Verzicht-Consent', () => {
    const start = read('app', 'checkout', '[slug]', 'start', 'route.ts');
    expect(start).toMatch(/widerruf_verzicht/);
    expect(start.replace(/\s+/g, ' ')).toMatch(/!widerrufOk/);
  });
  it('regenerate nur für Admins', () => {
    const rep = read('app', 'api', 'assessment', '[id]', 'report', 'route.ts');
    expect(rep.replace(/\s+/g, ' ')).toMatch(/regenerate.*isAdminUser\(user\)/);
  });
});
